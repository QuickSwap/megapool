// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see `ERC20Detailed`.
 */
interface IDepositor {

    function deposit(address user, bytes calldata depositData) external;

}