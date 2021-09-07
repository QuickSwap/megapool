// Author: Nick Mudge (nick@perfectabstractions.com, @mudgen, https://twitter.com/mudgen)

// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {IERC20} from "./interfaces/IERC20.sol";
import {SafeERC20} from "./libraries/SafeERC20.sol";
import {IERC20Permit} from "./interfaces/IERC20Permit.sol";

struct RewardToken {
    uint256 index; // index in rewardsTokensArray
    uint256 periodFinish;
    uint256 rewardRate;
    uint256 rewardPerTokenStored;
    uint256 lastUpdateTime;
    mapping(address => uint256) userRewardPerTokenPaid;
    mapping(address => uint256) rewards;
}

struct AppStorage {
    address rewardsDistribution;
    IERC20 stakingToken;
    address[] rewardTokensArray;    
    
    uint256 totalSupply;
    mapping(address => uint256) balances;
    mapping(address => RewardToken) rewardTokens;
}

contract MegaPool {
    AppStorage s;

    constructor(
        address _rewardsDistribution,
        address _stakingToken
    ) {
        s.stakingToken = IERC20(_stakingToken);
        s.rewardsDistribution = _rewardsDistribution;
    }

    function rewardsDistribution() external view returns (address) {
        return s.rewardsDistribution;
    }

    function transferRewardsDistribution(address _newRewardsDistribution) external {
        require(s.rewardsDistribution == msg.sender, "Transfer rewards distribution not authorized");
        emit RewardsDistributionTransferred(s.rewardsDistribution, _newRewardsDistribution);
        s.rewardsDistribution = _newRewardsDistribution;
    }

    function lastTimeRewardApplicable(address _rewardToken) public view returns (uint256) {
        uint256 periodFinish = s.rewardTokens[_rewardToken].periodFinish;
        // return smaller time
        return block.timestamp > periodFinish ? periodFinish : block.timestamp;
    }

    function rewardPerToken(address _rewardToken) public view returns (uint256) {
        RewardToken storage rewardToken = s.rewardTokens[_rewardToken];
        if (s.totalSupply == 0) {
            return rewardToken.rewardPerTokenStored;
        }
        return
            rewardToken.rewardPerTokenStored +
                (lastTimeRewardApplicable(_rewardToken) - rewardToken.lastUpdateTime) * 
                rewardToken.rewardRate * 
                1e18 / 
                s.totalSupply;            
    }

    function earned(address _account, address _rewardToken) public view returns (uint256) {
        RewardToken storage rewardToken = s.rewardTokens[_rewardToken];
        return s.balances[_account] * 
            (rewardPerToken(_rewardToken) - rewardToken.userRewardPerTokenPaid[_account]) / 
            1e18 +
            rewardToken.rewards[_account];
    }

    function stakeWithPermit(uint256 _amount, uint _deadline, uint8 _v, bytes32 _r, bytes32 _s) external {
        require(_amount > 0, "Cannot stake 0");        
        updateRewardAll(msg.sender); 
        IERC20 stakingToken = s.stakingToken;
        s.totalSupply += _amount;
        s.balances[msg.sender] += _amount;
        emit Staked(msg.sender, _amount);
        // permit
        IERC20Permit(address(stakingToken)).permit(msg.sender, address(this), _amount, _deadline, _v, _r, _s);

        SafeERC20.safeTransferFrom(stakingToken, msg.sender, address(this), _amount);
        
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Cannot stake 0");
        updateRewardAll(msg.sender);
        s.totalSupply += _amount;
        s.balances[msg.sender] += _amount;
        emit Staked(msg.sender, _amount);
        SafeERC20.safeTransferFrom(s.stakingToken, msg.sender, address(this), _amount);
    }

    function withdraw(uint256 _amount) public {
        require(_amount > 0, "Cannot withdraw 0");        
        updateRewardAll(msg.sender);
        s.totalSupply -= _amount;
        s.balances[msg.sender] -= _amount;
        emit Withdrawn(msg.sender, _amount);
        SafeERC20.safeTransfer(s.stakingToken, msg.sender, _amount);
    }

    function getRewards() public {
        uint256 length = s.rewardTokensArray.length;
        for(uint256 i; i < length; i++) {
            address rewardTokenAddress = s.rewardTokensArray[i];
            updateReward(msg.sender, rewardTokenAddress);
            RewardToken storage rewardToken = s.rewardTokens[rewardTokenAddress];
            uint256 reward = rewardToken.rewards[msg.sender];
            if (reward > 0) {
                rewardToken.rewards[msg.sender] = 0;
                emit RewardPaid(rewardTokenAddress, msg.sender, reward);
                SafeERC20.safeTransfer(IERC20(rewardTokenAddress), msg.sender, reward);                                
            }                
        }        
    }

    function getSpecificRewards(address[] calldata _rewardTokensArray) external {        
        for(uint256 i; i < _rewardTokensArray.length; i++) {
            address rewardTokenAddress = _rewardTokensArray[i];
            updateReward(msg.sender, rewardTokenAddress);
            RewardToken storage rewardToken = s.rewardTokens[rewardTokenAddress];
            uint256 index = rewardToken.index;
            require(s.rewardTokensArray[index] == rewardTokenAddress, "Reward token address does not exist");
            uint256 reward = rewardToken.rewards[msg.sender];
            if (reward > 0) {
                rewardToken.rewards[msg.sender] = 0;
                emit RewardPaid(rewardTokenAddress, msg.sender, reward);
                SafeERC20.safeTransfer(IERC20(rewardTokenAddress), msg.sender, reward);                                
            }                
        }
    }

    function exit() external {
        withdraw(s.balances[msg.sender]);
        getRewards();
    }

    function updateRewardAll(address _account) internal {
        uint256 length = s.rewardTokensArray.length;
        for(uint256 i; i < length; i++) {
            updateReward(_account, s.rewardTokensArray[i]);
        }
    }

    function updateReward(address _account, address _rewardToken) internal {
        RewardToken storage rewardToken = s.rewardTokens[_rewardToken];        
        uint256 rewardPerTokenStored = rewardPerToken(_rewardToken);
        rewardToken.rewardPerTokenStored = rewardPerTokenStored;
        rewardToken.lastUpdateTime = lastTimeRewardApplicable(_rewardToken);
        if (_account != address(0)) {
            rewardToken.rewards[_account] = earned(_account, _rewardToken);
            rewardToken.userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
    }

    struct RewardTokenArgs {
        address rewardToken;
        uint256 reward;
        uint256 rewardDuration;
    }

    function notifyRewardAmount(RewardTokenArgs[] calldata _args) external {
        require(msg.sender == s.rewardsDistribution, "Caller is not RewardsDistribution");
        for(uint256 i; i < _args.length; i++) {
            RewardTokenArgs calldata args = _args[i];
            RewardToken storage rewardToken = s.rewardTokens[args.rewardToken];
            require(block.timestamp + args.rewardDuration >= rewardToken.periodFinish, "Cannot reduce existing period");
            updateReward(address(0), args.rewardToken);
            uint256 rewardRate;
            if (block.timestamp >= rewardToken.periodFinish) {
                rewardRate = args.reward / args.rewardDuration;
            } else {                
                uint256 remaining = rewardToken.periodFinish - block.timestamp;
                uint256 leftover = remaining * rewardToken.rewardRate;
                rewardRate = (args.reward + leftover) / args.rewardDuration;                
            }
            rewardToken.rewardRate = rewardRate;            
            rewardToken.lastUpdateTime = block.timestamp;
            uint256 periodFinish = block.timestamp +  args.rewardDuration;
            rewardToken.periodFinish = periodFinish;
            if(rewardToken.index == 0) {
                rewardToken.index = s.rewardTokensArray.length;
                s.rewardTokensArray.push(args.rewardToken);                
            }
            emit RewardAdded(args.rewardToken, args.reward, periodFinish);

            // Ensure the provided reward amount is not more than the balance in the contract.
            // This keeps the reward rate in the right range, preventing overflows due to
            // very high values of rewardRate in the earned and rewardsPerToken functions;
            // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
            uint balance = IERC20(args.rewardToken).balanceOf(address(this));
            require(rewardRate <= balance / args.rewardDuration, "Provided reward too high");            
        }     
    }

    event RewardAdded(address indexed rewardToken, uint256 reward, uint256 periodFinish);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed rewardToken, address indexed user, uint256 reward);
    event RewardsDistributionTransferred(address indexed oldRewardsDistribution, address indexed newRewardsDistribution);


}