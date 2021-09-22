# megapool contract
The [MegaPool.sol](https://github.com/QuickSwap/megapool/blob/main/contracts/MegaPool.sol) contract builds off of the [StakingRewards.sol](https://github.com/QuickSwap/quickswap-core/blob/master/contracts/staking/StakingRewards.sol) contract that is used by Quickswap for [liquidity mining](https://quickswap.exchange/#/quick) and [Syrup pools](https://quickswap.exchange/#/syrup).

The MegaPool contract supports one ERC20 token for staking and up to 200 ERC20 reward tokens.

Users could stake dQUICK into one MegaPool contract and over time receive token rewards from up to 200 project at the same time.


# Deployment

The MegaPool contract is deployed as a regular contract with this constructor:

```Solidity
constructor(
    address _rewardsDistribution,
    address _stakingToken
)
```

The `_rewardsDistribution` is the address that has the permission to call the `notifyRewardAmount` function which is used to start the distribution of rewards.

the `_stakingToken` is the address of the ERC20 token that must be staked to earn rewards. For example the dQUICK address.

# Adding and Starting Rewards

After deploying the MegaPool contract the reward tokens that will be distributed by it will need to be transferred to it. Once that is done rewards distribution is started by calling the `notifyRewardAmount` function:

```Solidity
struct RewardTokenArgs {
    address rewardToken;
    uint256 reward; 
    uint256 rewardDuration;
}

function notifyRewardAmount(RewardTokenArgs[] calldata _args) external
```

As can be seen the `notifyRewardAmount` function is passed an array of `RewardTokenArgs`.

`rewardToken` is the ERC20 address of a token that is distributed as a reward.

`reward` is the total amount of ERC20 tokens that will be distributed.

`rewardDuration` is the duration in seconds that the reward tokens will be distributed. This is the period of time rewards will be distributed.

Here is a code example calling the `notifyRewardAmount` function:

```javascript
const args = [
    {
        rewardToken: '0x300211def2a644b036a9bdd3e58159bb2074d388', // token address
        reward: ethers.utils.parseEther('1000'), // total amount of rewards
        rewardDuration: (60 * 60 * 24) * 60 // distributed over 60 days
    },
    {
        rewardToken: '0x598e49f01befeb1753737934a5b11fea9119c796', // token address
        reward: ethers.utils.parseEther('9000'), // total amount of rewards
        rewardDuration: (60 * 60 * 24) * 30 // distributed over 30 days
    }
]

const tx = await megaPool.notifyRewardAmount(args)
const receipt = await tx.wait()
if (!receipt.status) {
    throw Error(`Transaction failed: ${tx.hash}`)
}
```

Note that before the `notifyRewardAmount` function can be called the total reward tokens that will be distributed need to be transferred to the MegaPool contract.

# Adding more reward tokens or restarting rewards

The `notifyRewardAmount` function can be called more than once for the same tokens. It can be called multiple times for the same tokens in order to extend the reward duration and/or add more rewards. It can also be called to distribute new rewards for a token that has already had rewards distributed. So token rewards can be extended, renewed or restarted. A reward period cannot be shortened and the amount of rewards cannot be lessened. In short things can be more, but not less.

It is also possible to call `notifyRewardAmount` to start distributing rewards for a set of tokens.  Then later call `notifyRewardAmount` again to add new reward tokens to distribute.


# Summary of other functions

* `rewardsDistribution()` returns the address that has permission to call the `notifyRewardAmount` function.
* `transferRewardsDistribution(address _newRewardsDistribution)` change the rewardsDistribution address.
* `totalSupply()` returns the total amount of the staking token that is staked 
* `stakingToken()` returns the address of the staking token
* `rewardTokensArray()` returns an array of all the ERC20 reward token addresses
* `balanceOf(address _account)` returns the number of tokens staked by a user
* `rewardTokenInfo(address _rewardToken)` returns information about a reward token, like when the reward period ends.
* `earned(address _rewardToken, address _account)` returns the amount of reward token a user has earned but has not yet been paid.
* `earned(address _account)` returns the amount of each reward token a user has earned but has not yet been paid.
* `stakeWithPermit(uint256 _amount, uint _deadline, uint8 _v, bytes32 _r, bytes32 _s)` stake tokens with an approval signature.
* `stake(uint256 _amount)` stake tokens (requires that the MegaPool contract is approved to transfer user's funds).
* `getRewards()` pays caller all reward tokens that have been earned.
* `getSpecificRewards(address[] calldata _rewardTokensArray)` pays caller specific reward tokens that have been earned.
* `withdraw(uint256 _amount)` withdraws a specific amount of staked tokens without paying any rewards.
* `withdrawAll()` withdraws all staked tokens without paying any rewards.
* `exit()` pays all rewards and withdraws all staked tokens.
* 





