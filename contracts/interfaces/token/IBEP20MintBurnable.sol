// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import './IBEP20Upgradeable.sol';

interface IBEP20MintBurnable is IBEP20Upgradeable {
    function mint(address account, uint256 amount) external;
    function burn(uint256 amount) external;
}
