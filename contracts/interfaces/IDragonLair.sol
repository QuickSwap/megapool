// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see `ERC20Detailed`.
 */
interface IDragonLair {

    function balanceOf(address account) external view returns (uint256);
    
    function enter(uint256 _quickAmount) external;

    function leave(uint256 _dQuickAmount) external;
    
    function approve(address spender, uint256 amount) external returns (bool);

    // returns the total amount of QUICK an address has in the contract including fees earned
    function QUICKBalance(address _account) external view returns (uint256 quickAmount_);

    //returns how much QUICK someone gets for depositing dQUICK
    function dQUICKForQUICK(uint256 _dQuickAmount) external view returns (uint256 quickAmount_);

    //returns how much dQUICK someone gets for depositing QUICK
    function QUICKForDQUICK(uint256 _quickAmount) external view returns (uint256 dQuickAmount_);

}