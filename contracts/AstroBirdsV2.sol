/**
 *  
 * AstroBirdz
    TOTAL 11% tax:
    3% Auto add to Liquidity Pool .
    3% Auto added to marketing.
    1% Auto added to team
    3% Auto Send to buyback address.
    1% Auto send to PSI rewards
*/

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import './interfaces/IPancakeFactory.sol';
import './interfaces/IPancakePair.sol';
import './interfaces/IPancakeRouter02.sol';
import './interfaces/IDividendTracker.sol';

// 
/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {ERC20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of ERC20 applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20-approve}.
 */
contract ERC20Upgradeable is Initializable, ContextUpgradeable, IERC20Upgradeable {
    using AddressUpgradeable for address;
    
    mapping (address => uint256) private _balances;
    mapping (address => bool) public feeExcludedAddress;
    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint private _decimals;
    uint private _lockTime;
    address public _Owner;
    address public _previousOwner;
    address public _psiAddress;
    address public _buybackAddress;
    address public _liquidityPoolAddress; // not used?
    address payable public _marketingAddress;
    address payable public _teamAddress;
    uint public psiFee;
    uint public liquidityFee;
    uint public marketingFee;
    uint public buybackFee;
    uint public teamFee;
    bool public sellLimiter; // by default false
    uint public sellLimit; // sell limit if sellLimiter is true
    
    uint256 public _maxTxAmount;
    IPancakeRouter02 public pancakeRouter;
    address public pancakePair;
    
    bool inSwapAndLiquify;
    bool public swapAndLiquifyEnabled;
    uint256 private minTokensBeforeSwap;
    
    event MinTokensBeforeSwapUpdated(uint256 minTokensBeforeSwap);
    event SwapAndLiquifyEnabledUpdated(bool enabled);
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiqudity
    );

    modifier onlyOwner{
        require(_msgSender() == _Owner, 'Only Owner Can Call This Function');
        _;
    }
    
    modifier lockTheSwap {
        inSwapAndLiquify = true;
         _;
        inSwapAndLiquify = false;
    }
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    bool public pauseTrade;

    event SendDividends(uint256 tokensSwapped, uint256 amount);
    event ProcessedDividendTracker(
        uint256 iterations,
        uint256 claims,
        uint256 lastProcessedIndex,
        bool indexed automatic,
        uint256 gas,
        address indexed processor
    );
    event UpdateDefaultDexRouter(address indexed newAddress, address indexed oldAddress);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    mapping(address => bool) public dexRouters;
    // store addresses that are automatic market maker (dex) pairs. Any transfer *to* these addresses
    // could be subject to a maximum transfer amount
    mapping(address => bool) public automatedMarketMakerPairs;
    IDividendTracker public dividendTracker;
    uint256 public gasForProcessing;
    bool public paused;

    receive() external payable {}

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    function _ERC20_init(
        string memory _nm,
        string memory _sym,
        address payable marketingAddress_,
        address payable teamAddress_,
        address psiAddress_,
        address buybackAddress_,
        address router_
    ) internal initializer {
        _name = _nm;
        _symbol = _sym;
        _decimals = 18;
        swapAndLiquifyEnabled = true;
        minTokensBeforeSwap = 8;
        psiFee = 100; //1%
        liquidityFee = 300; //3%
        marketingFee = 300; //3%
        teamFee = 100; //1%
        buybackFee = 300; //3%
        sellLimit = 50000 * 10 ** 18; //sell limit if sellLimiter is true
        _maxTxAmount = 5000000 * 10**18;
        _marketingAddress = marketingAddress_;
        _teamAddress = teamAddress_;
        _psiAddress = psiAddress_;
        _buybackAddress = buybackAddress_;
        _Owner = _msgSender();
        
        pancakeRouter = IPancakeRouter02(router_);
         // Create a pancake pair for this new token
        pancakePair = IPancakeFactory(pancakeRouter.factory()).createPair(address(this), pancakeRouter.WETH());
        
        feeExcludedAddress[_msgSender()] = true;
    }

    function initPSIDividendTracker(IDividendTracker _dividendTracker) external onlyOwner {
        require(address(dividendTracker) == address(0), "AstroBirdz: Dividend tracker already initialized");
        dividendTracker = _dividendTracker;

        // exclude from receiving dividends
        dividendTracker.excludeFromDividends(address(dividendTracker));
        dividendTracker.excludeFromDividends(address(pancakeRouter));
        dividendTracker.excludeFromDividends(address(0x000000000000000000000000000000000000dEaD));

        // add pair as marketMaker
        dexRouters[address(pancakeRouter)] = true;
        _setAutomatedMarketMakerPair(pancakePair, true);

        // whitlist wallets f.e. owner wallet to send tokens before presales are over
        excludeFromFeesAndDividends(address(this));
        excludeFromFeesAndDividends(_Owner);

        // use by default 300,000 gas to process auto-claiming dividends
        gasForProcessing = 300000;
        minTokensBeforeSwap = 10000 * (10 ** decimals()); // min 10k tokens in contract before swapping
        _liquidityPoolAddress = _Owner;
        _psiAddress = dividendTracker.dividendToken();
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
     * called.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function calculateLiquidityFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * liquidityFee) / 10**4;
    }
    
    function calculatePSIFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * psiFee) / 10**4;
    }
    
    function calculateMarketingFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * marketingFee) / 10**4;
    }

    function calculateTeamFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * teamFee) / 10**4;
    }

    function calculateBuybackFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * buybackFee) / 10**4;
    }
    
    function setPSIFee(uint256 PSIfee_) public onlyOwner{
        require(PSIfee_ < 1500, 'Fee must be less than 15%');
        psiFee = PSIfee_;
    }
    
    function setLiquidityFee(uint256 LPfee_) public onlyOwner{
        require(LPfee_ < 1500, 'Fee must be less than 15%');
        liquidityFee = LPfee_;
    }
    
    function setBuybackFee(uint256 BBFee_) public onlyOwner{
        require(BBFee_ < 1500, 'Fee must be less than 15%');
        buybackFee = BBFee_;
    }

    function setMarketingFee(uint256 Mfee_) public onlyOwner{
        require(Mfee_ < 1500, 'Fee must be less than 15%');
        marketingFee = Mfee_;
    }

    function setTeamFee(uint256 Tfee_) public onlyOwner{
        require(Tfee_ < 1500, 'Fee must be less than 15%');
        teamFee = Tfee_;
    }
    
    function toggleSellLimit() external onlyOwner() {
        sellLimiter = !sellLimiter;
    }
    
    function setBuybackAddress(address buybackAddress_) public onlyOwner{
        require(buybackAddress_ != address(0),'Cannot be a zero address');
        _buybackAddress = buybackAddress_;
    }
    
    function changeMarketingAddress(address payable marketingAddress_) public onlyOwner{
        require(marketingAddress_ != address(0),'Cannot be a zero address');
        _marketingAddress = marketingAddress_;
    }

    function changeTeamAddress(address payable teamAddress_) public onlyOwner{
        require(teamAddress_ != address(0),'Cannot be a zero address');
        _teamAddress = teamAddress_;
    }

    function changePSIAddress(address PSIAddress_) public onlyOwner{
        require(PSIAddress_ != address(0),'Cannot be a zero address');
        _psiAddress = PSIAddress_;
    }

    function changeLiquidityAddress(address payable liquidityAddress_) public onlyOwner{
        require(liquidityAddress_ != address(0),'Cannot be a zero address');
        _liquidityPoolAddress = liquidityAddress_;
    }
    
    function changeSellLimit(uint256 _sellLimit) public onlyOwner{
        sellLimit = _sellLimit;
    }
    
    function changeMaxtx(uint256 _maxtx) public onlyOwner{
        _maxTxAmount = _maxtx;
    }
    
    function addExcludedAddress(address excludedA) public onlyOwner{
        feeExcludedAddress[excludedA] = true;
    }
    function removeExcludedAddress(address excludedA) public onlyOwner{
        feeExcludedAddress[excludedA] = false;
    }
    function excludeFromFeesAndDividends(address excludedA) public onlyOwner {
        addExcludedAddress(excludedA);
        dividendTracker.excludeFromDividends(excludedA);
    }

    function addNewRouter(address _router, bool makeDefault) external onlyOwner {
        dexRouters[_router] = true;
        dividendTracker.excludeFromDividends(_router);

        IPancakeRouter02 _pancakeRouter = IPancakeRouter02(_router);
        address _pancakePair = IPancakeFactory(_pancakeRouter.factory()).getPair(address(this), _pancakeRouter.WETH());
        if (_pancakePair == address(0))
            _pancakePair = IPancakeFactory(_pancakeRouter.factory()).createPair(address(this), _pancakeRouter.WETH());
        _setAutomatedMarketMakerPair(_pancakePair, true);

        if (makeDefault) {
            emit UpdateDefaultDexRouter(_router, address(pancakeRouter));
            pancakeRouter = _pancakeRouter;
            pancakePair = _pancakePair;
        }
    }
    function setAutomatedMarketMakerPair(address pair, bool value) external onlyOwner {
        require(
            value || pair != pancakePair,
            'AstroBirdz: The default pair cannot be removed from automatedMarketMakerPairs'
        );
        _setAutomatedMarketMakerPair(pair, value);
    }
    function _setAutomatedMarketMakerPair(address pair, bool value) private {
        require(
            automatedMarketMakerPairs[pair] != value,
            'AstroBirdz: Automated market maker pair is already set to that value'
        );

        automatedMarketMakerPairs[pair] = value;
        if (value && address(dividendTracker) != address(0)) dividendTracker.excludeFromDividends(pair);
        emit SetAutomatedMarketMakerPair(pair, value);
    }
    function updateGasForProcessing(uint256 newValue) external onlyOwner {
        require(
            newValue >= 200000 && newValue <= 500000,
            'AstroBirdz: gasForProcessing must be between 200,000 and 500,000'
        );
        require(newValue != gasForProcessing, 'AstroBirdz: Cannot update gasForProcessing to same value');
        gasForProcessing = newValue;
    }
    
    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_Owner, newOwner);
        _Owner = newOwner;
    }

    function getUnlockTime() public view returns (uint256) {
        return _lockTime;
    }

    //Locks the contract for owner for the amount of time provided
    function lock(uint256 time) public virtual onlyOwner {
        _previousOwner = _Owner;
        _Owner = address(0);
        _lockTime = block.timestamp + time;
        emit OwnershipTransferred(_Owner, address(0));
    }
    
    //Unlocks the contract for owner when _lockTime is exceeds
    function unlock() public virtual {
        require(_previousOwner == msg.sender, "You don't have permission to unlock");
        require(block.timestamp > _lockTime , "Contract is still locked");
        emit OwnershipTransferred(_Owner, _previousOwner);
        _Owner = _previousOwner;
    }
    
    function multiTransfer(address[] memory receivers, uint256[] memory amounts) public {
        require(receivers.length != 0, 'Cannot Proccess Null Transaction');
        require(receivers.length == amounts.length, 'Address and Amount array length must be same');
        for (uint256 i = 0; i < receivers.length; i++) {
            transfer(receivers[i], amounts[i]);
        }
    }

    function processDividendTracker(uint256 gas) external {
        (uint256 iterations, uint256 claims, uint256 lastProcessedIndex) = dividendTracker.process(gas);
        emit ProcessedDividendTracker(iterations, claims, lastProcessedIndex, false, gas, tx.origin);
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        // only calculate fee on trades
        if( feeExcludedAddress[recipient] ||
            feeExcludedAddress[_msgSender()] || 
            (!automatedMarketMakerPairs[recipient] && !automatedMarketMakerPairs[_msgSender()])) {
            _transferExcluded(_msgSender(), recipient, amount);
        } else {
            _transfer(_msgSender(), recipient, amount);    
        }
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20};
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for ``sender``'s tokens of at least
     * `amount`.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        if( feeExcludedAddress[recipient] ||
            feeExcludedAddress[sender] || 
            (!automatedMarketMakerPairs[recipient] && !automatedMarketMakerPairs[sender])) {
            _transferExcluded(sender, recipient, amount);
        } else {
            _transfer(sender, recipient, amount);    
        }

        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked { _approve(sender, _msgSender(), currentAllowance - amount); }
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked { _approve(_msgSender(), spender, currentAllowance - subtractedValue); }
        return true;
    }

    function setSwapAndLiquifyEnabled(bool _enabled) public onlyOwner {
        swapAndLiquifyEnabled = _enabled;
        emit SwapAndLiquifyEnabledUpdated(_enabled);
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transferExcluded(address sender, address recipient, uint256 amount) internal virtual {
        require(!paused, "Transfering is paused");
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        if(sender != _Owner && recipient != _Owner)
            require(amount <= _maxTxAmount, "Transfer amount exceeds the maxTxAmount.");
        if(automatedMarketMakerPairs[recipient] && balanceOf(recipient) > 0 && sellLimiter)
            require(amount < sellLimit, 'Cannot sell more than sellLimit');
        if(automatedMarketMakerPairs[recipient] || automatedMarketMakerPairs[sender])
            require(!pauseTrade, "Trading Paused");

        _fixDividendTrackerBalancer(sender, recipient, amount);
        _simpleTransfer(sender, recipient, amount);
    }
    
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        require(!paused, "Transfering is paused");
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        if(sender != _Owner && recipient != _Owner)
            require(amount <= _maxTxAmount, "Transfer amount exceeds the maxTxAmount.");
        if(automatedMarketMakerPairs[recipient] && balanceOf(recipient) > 0 && sellLimiter)
            require(amount < sellLimit, 'Cannot sell more than sellLimit');
        if(automatedMarketMakerPairs[recipient] || automatedMarketMakerPairs[sender])
            require(!pauseTrade, "Trading Paused");

        require(_balances[sender] >= amount, "ERC20: transfer amount exceeds balance");
        uint256 fees = calculateLiquidityFee(amount) +
            calculateBuybackFee(amount) +
            calculateMarketingFee(amount) +
            calculatePSIFee(amount) +
            calculateTeamFee(amount);
        amount -= fees;
        _simpleTransfer(sender, address(this), fees);

        _fixDividendTrackerBalancer(sender, recipient, amount);
        
        // swap fees before transfer has happened and after dividend balances are done
        uint256 contractTokenBalance = balanceOf(address(this));
        if (
            contractTokenBalance >= minTokensBeforeSwap &&
            !inSwapAndLiquify &&
            !automatedMarketMakerPairs[sender] &&
            swapAndLiquifyEnabled
        ) {
            swapAndLiquify(contractTokenBalance);
        }
        
        _simpleTransfer(sender, recipient, amount);

        if (address(dividendTracker) != address(0) && !inSwapAndLiquify) {
            try dividendTracker.process(gasForProcessing) returns (uint256 iterations, uint256 claims, uint256 lastProcessedIndex) {
                emit ProcessedDividendTracker(iterations, claims, lastProcessedIndex, true, gasForProcessing, tx.origin);
            } catch {}
        }
    }

    function _fixDividendTrackerBalancer(
        address sender,
        address recipient,
        uint256 amount
    ) private {
        if (address(dividendTracker) != address(0)) {
            if (sender == recipient) {
                try dividendTracker.setBalance(payable(sender), balanceOf(sender)) {} catch {}
            } else {
                try dividendTracker.setBalance(payable(sender), balanceOf(sender) - amount) {} catch {}
                try dividendTracker.setBalance(payable(recipient), balanceOf(recipient) + amount) {} catch {}
            }
        }
    }

    function _simpleTransfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked { _balances[sender] = senderBalance - amount; }
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
    
    function performSwapAndLiquify() external onlyOwner {
        uint256 contractTokenBalance = balanceOf(address(this));
        if (contractTokenBalance >= minTokensBeforeSwap && !inSwapAndLiquify && swapAndLiquifyEnabled) {
            swapAndLiquify(contractTokenBalance);
        }
    }

    function swapAndLiquify(uint256 contractTokenBalance) private lockTheSwap {
        uint256 totalFees = liquidityFee + marketingFee + teamFee + buybackFee + psiFee ;
        uint256 forLiquidity = (contractTokenBalance * liquidityFee) / totalFees;

        uint256 initialBalance = address(this).balance;
        swapTokensForEth(contractTokenBalance - (forLiquidity / 2)); // withold half of the liquidity tokens
        uint256 swappedBalance = address(this).balance - initialBalance;
        uint256 feeBalance = swappedBalance - 
            ((swappedBalance * (liquidityFee / 2)) / (totalFees - (liquidityFee / 2)));
        totalFees -= liquidityFee;

        payable(_marketingAddress).transfer((feeBalance * marketingFee) / totalFees);
        payable(_teamAddress).transfer((feeBalance * teamFee) / totalFees);
        
        swapAndSendDividends((feeBalance * psiFee) / totalFees);

        addLiquidity(forLiquidity / 2, (swappedBalance - feeBalance));
        
        payable(_buybackAddress).transfer(address(this).balance - initialBalance); // buybackfee + leftovers

        emit SwapAndLiquify(contractTokenBalance, swappedBalance, forLiquidity / 2);
    }

    function toggleTrading() public onlyOwner {
        pauseTrade = !pauseTrade;
    }
    function togglePaused() public onlyOwner {
        paused = !paused;
    }
     
    function swapTokensForEth(uint256 tokenAmount) private {
        // generate the pancake pair path of token -> weth
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = pancakeRouter.WETH();

        _approve(address(this), address(pancakeRouter), tokenAmount);

        // make the swap
        pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0, // accept any amount of ETH
            path,
            address(this),
            block.timestamp
        );
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        // approve token transfer to cover all possible scenarios
        _approve(address(this), address(pancakeRouter), tokenAmount);

        // add the liquidity
        pancakeRouter.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0, // slippage is unavoidable
            0, // slippage is unavoidable
            _liquidityPoolAddress,
            block.timestamp
        );
    }

    function swapAndSendDividends(uint256 ethAmount) private {
        uint256 psiBalanceBefore = IERC20(_psiAddress).balanceOf(address(dividendTracker));
        swapETHForPSI(ethAmount, address(dividendTracker));
        uint256 dividends = IERC20(_psiAddress).balanceOf(address(dividendTracker)) - psiBalanceBefore;

        dividendTracker.distributeDividends(dividends);
        emit SendDividends(ethAmount, dividends);
    }

    function swapETHForPSI(uint256 ethAmount, address recipient) private {
        // generate the uniswap pair path of weth -> PSI
        address[] memory path = new address[](2);
        path[0] = pancakeRouter.WETH();
        path[1] = _psiAddress;

        // make the swap
        pancakeRouter.swapExactETHForTokensSupportingFeeOnTransferTokens{value: ethAmount}(
            0, // accept any amount of PSI
            path,
            recipient,
            block.timestamp
        );
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        require(_msgSender() == tx.origin, "Invalid Request");
        _mint(account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");
        require(_balances[_msgSender()] >= amount,'insufficient balance!');

        _beforeTokenTransfer(account, address(0x000000000000000000000000000000000000dEaD), amount);

        require(_balances[account] >= amount, "ERC20: burn amount exceeds balance");
        unchecked { _balances[account] -= amount; }
        _totalSupply -= amount;

        emit Transfer(account, address(0x000000000000000000000000000000000000dEaD), amount);
    }

    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Sets {decimals} to a value other than the default one of 18.
     *
     * WARNING: This function should only be called from the constructor. Most
     * applications that interact with token contracts will not expect
     * {decimals} to ever change, and may work incorrectly if it does.
     */
    function _setupDecimals(uint8 decimals_) internal {
        _decimals = decimals_;
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { }
}

contract AstroBirdsV2 is Initializable, ERC20Upgradeable {
    function initialize(
        string memory _name,
        string memory _symbol,
        address payable marketingAddress_,
        address payable teamAddress_,
        address psiAddress_,
        address buybackAddress_,
        address router_
    ) public initializer {
        ERC20Upgradeable._ERC20_init(
            _name,
            _symbol,
            marketingAddress_,
            teamAddress_,
            psiAddress_,
            buybackAddress_,
            router_
        );
        
        _mint(_msgSender(), 470000000 ether);
    }
}