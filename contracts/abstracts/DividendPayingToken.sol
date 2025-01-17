// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../interfaces/token/IDividendPayingTokenInterface.sol';
import '../interfaces/token/IDividendPayingTokenOptionalInterface.sol';

abstract contract DividendPayingToken is
    Ownable,
    ERC20,
    IDividendPayingTokenInterface,
    IDividendPayingTokenOptionalInterface
{
    address public immutable override dividendToken;
    address public immutable override parentToken;

    uint256 internal constant magnitude = 2**128;

    uint256 internal magnifiedDividendPerShare;

    mapping(address => int256) internal magnifiedDividendCorrections;
    mapping(address => uint256) internal withdrawnDividends;

    uint256 public override totalDividendsDistributed;

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwnerOrParentToken() {
        require(
            owner() == _msgSender() || parentToken == _msgSender(),
            "Ownable: caller is not the owner or parentToken"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _dividendToken,
        address _parentToken
    ) ERC20(_name, _symbol) {
        dividendToken = _dividendToken;
        parentToken = _parentToken;
    }

    function distributeDividends(uint256 amount) public virtual override onlyOwnerOrParentToken {
        require(totalSupply() > 0, 'DividendPayingToken: Total Supply must be > 0');

        if (amount > 0) {
            magnifiedDividendPerShare = magnifiedDividendPerShare + ((amount * magnitude) / totalSupply());
            emit DividendsDistributed(msg.sender, amount);

            totalDividendsDistributed = totalDividendsDistributed + amount;
        }
    }

    function withdrawDividend() public virtual override {
        _withdrawDividendOfUser(payable(msg.sender));
    }

    function _withdrawDividendOfUser(address payable user) internal returns (uint256) {
        uint256 _withdrawableDividend = withdrawableDividendOf(user);
        if (_withdrawableDividend > 0) {
            withdrawnDividends[user] = withdrawnDividends[user] + _withdrawableDividend;
            emit DividendWithdrawn(user, _withdrawableDividend);
            bool success = IERC20(dividendToken).transfer(user, _withdrawableDividend);

            if (!success) {
                withdrawnDividends[user] = withdrawnDividends[user] - _withdrawableDividend;
                return 0;
            }

            return _withdrawableDividend;
        }

        return 0;
    }

    function dividendOf(address _owner) public view override returns (uint256) {
        return withdrawableDividendOf(_owner);
    }

    function withdrawableDividendOf(address _owner) public view override returns (uint256) {
        return accumulativeDividendOf(_owner) - withdrawnDividends[_owner];
    }

    function withdrawnDividendOf(address _owner) public view override returns (uint256) {
        return withdrawnDividends[_owner];
    }

    function accumulativeDividendOf(address _owner) public view override returns (uint256) {
        return
            uint256(int256((magnifiedDividendPerShare * balanceOf(_owner))) + magnifiedDividendCorrections[_owner]) /
            magnitude;
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        require(false);

        int256 _magCorrection = int256(magnifiedDividendPerShare * value);
        magnifiedDividendCorrections[from] = magnifiedDividendCorrections[from] + _magCorrection;
        magnifiedDividendCorrections[to] = magnifiedDividendCorrections[to] - _magCorrection;
    }

    function _mint(address account, uint256 value) internal override {
        super._mint(account, value);

        magnifiedDividendCorrections[account] =
            magnifiedDividendCorrections[account] -
            int256(magnifiedDividendPerShare * value);
    }

    function _burn(address account, uint256 value) internal override {
        super._burn(account, value);

        magnifiedDividendCorrections[account] =
            magnifiedDividendCorrections[account] +
            int256(magnifiedDividendPerShare * value);
    }

    function _setBalance(address account, uint256 newBalance) internal {
        uint256 currentBalance = balanceOf(account);

        if (newBalance > currentBalance) {
            uint256 mintAmount = newBalance - currentBalance;
            _mint(account, mintAmount);
        } else if (newBalance < currentBalance) {
            uint256 burnAmount = currentBalance - newBalance;
            _burn(account, burnAmount);
        }
    }
}
