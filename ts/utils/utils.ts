import { ContractError } from '@0x/contract-wrappers';
import {
    // assetDataUtils,
    TypedDataError,
} from '@0x/order-utils';
import { ExchangeContractErrs } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as bowser from 'bowser';
import * as changeCase from 'change-case';
import deepEqual from 'deep-equal';
import { providers } from 'ethers';
import isMobile from 'is-mobile';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as numeral from 'numeral';
import { scroller } from 'react-scroll';

import { ZeroExProvider } from 'ethereum-types';
import {
    AccountState,
    BlockchainCallErrs,
    BrowserType,
    EtherscanLinkSuffixes,
    Network,
    Networks,
    OperatingSystemType,
    // PortalOrder,
    Providers,
    ProviderType,
    ScreenWidths,
    // Side,
    // SideToAssetToken,
    Token,
    TokenByAddress,
    TokenState,
} from 'ts/types';
import { ALCHEMY_API_KEY, configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { environments } from 'ts/utils/environments';
import * as u2f from 'ts/vendor/u2f_api';

const ethersProvider = providers.getDefaultProvider(null, {
    alchemy: ALCHEMY_API_KEY,
});

export const utils = {
    assert(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(message);
        }
    },
    isNumeric(n: string): boolean {
        return !isNaN(parseFloat(n)) && isFinite(Number(n));
    },
    // This default unix timestamp is used for orders where the user does not specify an expiry date.
    // It is a fixed constant so that both the redux store's INITIAL_STATE and components can check for
    // whether a user has set an expiry date or not. It is set unrealistically high so as not to collide
    // with actual values a user would select.
    initialOrderExpiryUnixTimestampSec(): BigNumber {
        const m = moment('2050-01-01');
        return new BigNumber(m.unix());
    },
    convertToUnixTimestampSeconds(date: moment.Moment, time?: moment.Moment): BigNumber {
        const finalMoment = date;
        if (time !== undefined) {
            finalMoment.hours(time.hours());
            finalMoment.minutes(time.minutes());
        }
        return new BigNumber(finalMoment.unix());
    },
    convertToMomentFromUnixTimestamp(unixTimestampSec: BigNumber): moment.Moment {
        return moment.unix(unixTimestampSec.toNumber());
    },
    convertToReadableDateTimeFromUnixTimestamp(unixTimestampSec: BigNumber): string {
        const m = utils.convertToMomentFromUnixTimestamp(unixTimestampSec);
        const formattedDate: string = m.format('h:MMa MMMM D YYYY');
        return formattedDate;
    },
    /*
    generateOrder(
        exchangeAddress: string,
        sideToAssetToken: SideToAssetToken,
        expirationTimeSeconds: BigNumber,
        orderTakerAddress: string,
        orderMakerAddress: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        feeRecipientAddress: string,
        signature: string,
        tokenByAddress: TokenByAddress,
        orderSalt: BigNumber,
    ): PortalOrder {
        const makerToken = tokenByAddress[sideToAssetToken[Side.Deposit].address];
        const takerToken = tokenByAddress[sideToAssetToken[Side.Receive].address];
        const order = {
            signedOrder: {
                senderAddress: constants.NULL_ADDRESS,
                makerAddress: orderMakerAddress,
                takerAddress: orderTakerAddress,
                makerFee,
                takerFee,
                makerAssetAmount: sideToAssetToken[Side.Deposit].amount,
                takerAssetAmount: sideToAssetToken[Side.Receive].amount,
                makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
                expirationTimeSeconds,
                feeRecipientAddress,
                salt: orderSalt,
                signature,
                exchangeAddress,
            },
            metadata: {
                makerToken: {
                    name: makerToken.name,
                    symbol: makerToken.symbol,
                    decimals: makerToken.decimals,
                },
                takerToken: {
                    name: takerToken.name,
                    symbol: takerToken.symbol,
                    decimals: takerToken.decimals,
                },
            },
        };
        return order;
    },
    */
    async sleepAsync(ms: number): Promise<NodeJS.Timer> {
        return new Promise<NodeJS.Timer>((resolve) => setTimeout(resolve, ms));
    },
    deepEqual(actual: any, expected: any, opts?: { strict: boolean }): boolean {
        return deepEqual(actual, expected, opts);
    },
    getColSize(items: number): number {
        const bassCssGridSize = 12; // Source: http://basscss.com/#basscss-grid
        const colSize = bassCssGridSize / items;
        if (!_.isInteger(colSize)) {
            throw new Error(`Number of cols must be divisible by ${bassCssGridSize}`);
        }
        return colSize;
    },
    getScreenWidth(): ScreenWidths {
        const documentEl = document.documentElement;
        const body = document.getElementsByTagName('body')[0];
        const widthInPx = window.innerWidth || documentEl.clientWidth || body.clientWidth;
        const bodyStyles: any = window.getComputedStyle(document.querySelector('body'));
        const widthInEm = widthInPx / parseFloat(bodyStyles['font-size']);

        // This logic mirrors the CSS media queries in BassCSS for the `lg-`, `md-` and `sm-` CSS
        // class prefixes. Do not edit these.
        if (widthInEm > ScreenWidths.Lg) {
            return ScreenWidths.Lg;
        } else if (widthInEm > ScreenWidths.Md) {
            return ScreenWidths.Md;
        } else {
            return ScreenWidths.Sm;
        }
    },
    async isU2FSupportedAsync(): Promise<boolean> {
        const w = window as any;
        return new Promise((resolve: (isSupported: boolean) => void) => {
            if (w.u2f && !w.u2f.getApiVersion) {
                // u2f object was found (Firefox with extension)
                resolve(true);
            } else {
                // u2f object was not found. Using Google polyfill
                // HACK: u2f.getApiVersion will simply not return a version if the
                // U2F call fails for any reason. Because of this, we set a hard 3sec
                // timeout to the request on our end.
                const getApiVersionTimeoutMs = 3000;
                const intervalId = setTimeout(() => {
                    resolve(false);
                }, getApiVersionTimeoutMs);
                (u2f as any).getApiVersion((_version: number) => {
                    clearTimeout(intervalId);
                    resolve(true);
                });
            }
        });
    },
    // This checks the error message returned from an injected Web3 instance on the page
    // after a user was prompted to sign a message or send a transaction and decided to
    // reject the request.
    didUserDenyWeb3Request(errMsg: string): boolean {
        const metamaskDenialErrMsg = 'User denied';
        const paritySignerDenialErrMsg = 'Request has been rejected';
        const ledgerDenialErrMsg = 'Invalid status 6985';
        const isUserDeniedErrMsg =
            _.includes(errMsg, metamaskDenialErrMsg) ||
            _.includes(errMsg, paritySignerDenialErrMsg) ||
            _.includes(errMsg, ledgerDenialErrMsg);
        return isUserDeniedErrMsg;
    },
    getAddressBeginAndEnd(address: string, beginCharCount: number = 6, endCharCount: number = 4): string {
        const truncatedAddress = `${address.substring(0, beginCharCount)}...${address.substr(-endCharCount)}`; // 0x3d5a...b287
        return truncatedAddress;
    },
    getReadableAccountState(accountState: AccountState, userAddress: string): string {
        switch (accountState) {
            case AccountState.Loading:
                return 'Loading...';
            case AccountState.Ready:
                return utils.getAddressBeginAndEnd(userAddress);
            case AccountState.Locked:
                return 'Please Unlock';
            case AccountState.Disconnected:
                return 'Connect a Wallet';
            default:
                return '';
        }
    },
    getAccountState(
        isBlockchainReady: boolean,
        providerType: ProviderType,
        injectedProviderName: string,
        userAddress?: string,
    ): AccountState {
        const isAddressAvailable = userAddress !== undefined && !_.isEmpty(userAddress);
        const isExternallyInjectedProvider = utils.isExternallyInjected(providerType, injectedProviderName);
        if (!isBlockchainReady) {
            return AccountState.Loading;
        } else if (isAddressAvailable) {
            return AccountState.Ready;
            // tslint:disable-next-line: prefer-conditional-expression
        } else if (isExternallyInjectedProvider) {
            return AccountState.Locked;
        } else {
            return AccountState.Disconnected;
        }
    },
    hasUniqueNameAndSymbol(tokens: Token[], token: Token): boolean {
        if (token.isRegistered) {
            return true; // Since it's registered, it is the canonical token
        }
        const registeredTokens = _.filter(tokens, (t) => t.isRegistered);
        const tokenWithSameNameIfExists = _.find(registeredTokens, {
            name: token.name,
        });
        const isUniqueName = tokenWithSameNameIfExists === undefined;
        const tokenWithSameSymbolIfExists = _.find(registeredTokens, {
            name: token.symbol,
        });
        const isUniqueSymbol = tokenWithSameSymbolIfExists === undefined;
        return isUniqueName && isUniqueSymbol;
    },
    zeroExErrToHumanReadableErrMsg(error: ContractError | ExchangeContractErrs, takerAddress: string): string {
        const ContractErrorToHumanReadableError: { [error: string]: string } = {
            [BlockchainCallErrs.UserHasNoAssociatedAddresses]: 'User has no addresses available',
            [TypedDataError.InvalidSignature]: 'Order signature is not valid',
            [ContractError.ContractNotDeployedOnChain]: 'Contract is not deployed on the detected chain',
            [ContractError.InvalidJump]: 'Invalid jump occured while executing the transaction',
            [ContractError.OutOfGas]: 'Transaction ran out of gas',
        };
        const exchangeContractErrorToHumanReadableError: {
            [error: string]: string;
        } = {
            [ExchangeContractErrs.OrderFillExpired]: 'This order has expired',
            [ExchangeContractErrs.OrderCancelExpired]: 'This order has expired',
            [ExchangeContractErrs.OrderCancelled]: 'This order has been cancelled',
            [ExchangeContractErrs.OrderFillAmountZero]: "Order fill amount can't be 0",
            [ExchangeContractErrs.OrderRemainingFillAmountZero]: 'This order has already been completely filled',
            [ExchangeContractErrs.OrderFillRoundingError]:
                'Rounding error will occur when filling this order. Please try filling a different amount.',
            [ExchangeContractErrs.InsufficientTakerBalance]:
                'Taker no longer has a sufficient balance to complete this order',
            [ExchangeContractErrs.InsufficientTakerAllowance]:
                'Taker no longer has a sufficient allowance to complete this order',
            [ExchangeContractErrs.InsufficientMakerBalance]:
                'Maker no longer has a sufficient balance to complete this order',
            [ExchangeContractErrs.InsufficientMakerAllowance]:
                'Maker no longer has a sufficient allowance to complete this order',
            [ExchangeContractErrs.InsufficientTakerFeeBalance]: 'Taker no longer has a sufficient balance to pay fees',
            [ExchangeContractErrs.InsufficientTakerFeeAllowance]:
                'Taker no longer has a sufficient allowance to pay fees',
            [ExchangeContractErrs.InsufficientMakerFeeBalance]: 'Maker no longer has a sufficient balance to pay fees',
            [ExchangeContractErrs.InsufficientMakerFeeAllowance]:
                'Maker no longer has a sufficient allowance to pay fees',
            [ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker]: `This order can only be filled by ${takerAddress}`,
            [ExchangeContractErrs.InsufficientRemainingFillAmount]: 'Insufficient remaining fill amount',
        };
        const humanReadableErrorMsg =
            exchangeContractErrorToHumanReadableError[error] || ContractErrorToHumanReadableError[error];
        return humanReadableErrorMsg;
    },
    isParityNode(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'Parity');
    },
    isTestRpc(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'TestRPC');
    },
    isTestNetwork(networkId: number): boolean {
        const isTestNetwork = _.includes(
            [
                constants.NETWORK_ID_BY_NAME[Networks.Kovan],
                constants.NETWORK_ID_BY_NAME[Networks.Rinkeby],
                constants.NETWORK_ID_BY_NAME[Networks.Ropsten],
            ],
            networkId,
        );
        return isTestNetwork;
    },
    getGoogleSheetLeadUrl(form: string): string {
        return configs.GOOGLE_SHEETS_LEAD_FORMS[form];
    },
    getCurrentBaseUrl(): string {
        const port = window.location.port;
        const hasPort = port !== undefined;
        const baseUrl = `https://${window.location.hostname}${hasPort ? `:${port}` : ''}`;
        return baseUrl;
    },
    onPageLoadPromise: new Promise<void>((resolve, _reject) => {
        if (document.readyState === 'complete') {
            resolve();
            return;
        }
        window.onload = () => resolve();
    }),
    checkWindowProviderProperty(propertyName: string): boolean {
        if ((window.ethereum && window.ethereum[propertyName]) || (window.web3 && window.web3[propertyName])) {
            return true;
        } else if (_.get(window, propertyName) !== undefined) {
            return true;
        } else if (_.get(window, propertyName) !== undefined) {
            return true;
        } else if (utils.getBrowserType() === propertyName && !window.ethereum) {
            return true;
        } else {
            return false;
        }
    },
    // Copied from Instant
    getProviderType(provider: ZeroExProvider): Providers | undefined {
        const anyProvider = provider as any;
        if (provider.constructor.name === 'EthereumProvider') {
            return Providers.Mist;
        } else if (_.get(window, 'Bitpie')) {
            // NOTE: Bitpie is TrustWallet based so isTrust is also true
            return Providers.Bitpie;
        } else if (anyProvider.isTrust) {
            return Providers.TrustWallet;
        } else if (anyProvider.isParity) {
            return Providers.Parity;
        } else if (anyProvider.isMetaMask) {
            return Providers.Metamask;
        } else if (anyProvider.isImToken) {
            return Providers.ImToken;
        } else if (_.get(window, 'SOFA') !== undefined) {
            return Providers.CoinbaseWallet;
        } else if (_.get(window, '__CIPHER__') !== undefined) {
            return Providers.Cipher;
        } else if (utils.getBrowserType() === BrowserType.Opera && !anyProvider.isMetaMask) {
            return Providers.Opera;
        }

        return undefined;
    },
    getProviderName(provider: ZeroExProvider): string {
        const providerTypeIfExists = utils.getProviderType(provider);
        if (providerTypeIfExists === undefined) {
            return provider.constructor.name;
        }
        return constants.PROVIDER_TYPE_TO_NAME[providerTypeIfExists];
    },

    getProviderDisplayName(provider: ZeroExProvider): string {
        const providerTypeIfExists = utils.getProviderType(provider);
        if (providerTypeIfExists === undefined) {
            return 'Wallet';
        }
        return constants.PROVIDER_TYPE_TO_NAME[providerTypeIfExists];
    },
    getProviderIcon(type: string): string | undefined {
        if (type === 'METAMASK') {
            return constants.PROVIDER_TYPE_TO_ICON.METAMASK;
        } else if (type === 'WALLET_CONNECT') {
            return constants.PROVIDER_TYPE_TO_ICON.WALLET_CONNECT;
        } else if (type === 'WALLET_LINK') {
            return constants.PROVIDER_TYPE_TO_ICON.WALLET_LINK;
        } else if (type === 'imToken') {
            return constants.PROVIDER_TYPE_TO_ICON.IMTOKEN;
        } else if (type === 'isTrust') {
            return constants.PROVIDER_TYPE_TO_ICON.TRUST_WALLET;
        } else if (type === 'CIPHER') {
            return constants.PROVIDER_TYPE_TO_ICON.CIPHER;
        } else if (type === 'SOFA') {
            return constants.PROVIDER_TYPE_TO_ICON.COINBASE_WALLET;
        } else if (type === 'BITPIE') {
            return constants.PROVIDER_TYPE_TO_ICON.BITPIE;
        } else if (type === 'OPERA') {
            return constants.PROVIDER_TYPE_TO_ICON.OPERA;
        } else {
            return undefined;
        }
    },
    // End of copy from Instant
    getProviderTypeIcon(providerType?: Providers): string | undefined {
        if (providerType === undefined) {
            return undefined;
        }

        return constants.PROVIDER_TYPE_TO_ICON[providerType];
    },
    getBackendBaseUrl(): string {
        if (environments.isDogfood()) {
            return configs.BACKEND_BASE_STAGING_URL;
        } else if (environments.isDevelopment()) {
            return configs.BACKEND_BASE_DEV_URL;
        }
        return configs.BACKEND_BASE_PROD_URL;
    },
    getAPIBaseUrl(networkId: Network): string {
        if (environments.isDevelopment()) {
            return configs.API_BASE_DEV_URL;
        } else if (networkId === Network.Kovan) {
            return configs.API_BASE_KOVAN_URL;
        } else if (networkId === Network.Ropsten) {
            return configs.API_BASE_ROPSTEN_URL;
        } else if (environments.isDogfood()) {
            return configs.API_BASE_STAGING_URL;
        }
        return configs.API_BASE_PROD_URL;
    },
    isExternallyInjected(providerType: ProviderType, injectedProviderName: string): boolean {
        return providerType === ProviderType.Injected && injectedProviderName !== constants.PROVIDER_NAME_PUBLIC;
    },
    getEthToken(tokenByAddress: TokenByAddress): Token {
        return utils.getTokenBySymbol(constants.ETHER_TOKEN_SYMBOL, tokenByAddress);
    },
    getZrxToken(tokenByAddress: TokenByAddress): Token {
        return utils.getTokenBySymbol(constants.ZRX_TOKEN_SYMBOL, tokenByAddress);
    },
    getTokenBySymbol(symbol: string, tokenByAddress: TokenByAddress): Token {
        const tokens = _.values(tokenByAddress);
        const token = _.find(tokens, { symbol });
        return token;
    },
    getTrackedTokens(tokenByAddress: TokenByAddress): Token[] {
        const allTokens = _.values(tokenByAddress);
        const trackedTokens = _.filter(allTokens, (t) => utils.isTokenTracked(t));
        return trackedTokens;
    },
    getFormattedAmountFromToken(token: Token, tokenState: TokenState): string {
        return utils.getFormattedAmount(tokenState.balance, token.decimals);
    },
    format(value: BigNumber, format: string): string {
        const formattedAmount = numeral(value).format(format);
        if (_.isNaN(formattedAmount) || formattedAmount === 'NaN') {
            // https://github.com/adamwdraper/Numeral-js/issues/596
            return numeral(new BigNumber(0)).format(format);
        }
        return formattedAmount;
    },
    getFormattedAmount(amount: BigNumber, decimals: number): string {
        const unitAmount = Web3Wrapper.toUnitAmount(amount, decimals);

        return utils.getFormattedUnitAmount(unitAmount);
    },
    getFormattedUnitAmount(unitAmount: BigNumber): string {
        // if the unit amount is less than 1, show the natural number of decimal places with a max of 4
        // if the unit amount is greater than or equal to 1, show only 2 decimal places
        const lessThanOnePrecision = Math.min(constants.TOKEN_AMOUNT_DISPLAY_PRECISION, unitAmount.decimalPlaces());
        const greaterThanOnePrecision = 2;
        const precision = unitAmount.lt(1) ? lessThanOnePrecision : greaterThanOnePrecision;
        const format = `0,0.${_.repeat('0', precision)}`;
        return utils.format(unitAmount, format);
    },
    getUsdValueFormattedAmount(amount: BigNumber, decimals: number, price: BigNumber): string {
        const unitAmount = Web3Wrapper.toUnitAmount(amount, decimals);
        const value = unitAmount.multipliedBy(price);
        return utils.format(value, constants.NUMERAL_USD_FORMAT);
    },
    openUrl(url: string): void {
        window.open(url, '_blank');
    },
    isMobileWidth(screenWidth: ScreenWidths): boolean {
        return screenWidth === ScreenWidths.Sm;
    },
    isMobileOperatingSystem(): boolean {
        return bowser.mobile;
    },
    getBrowserType(): BrowserType {
        if (bowser.chrome) {
            return BrowserType.Chrome;
        } else if (bowser.firefox) {
            return BrowserType.Firefox;
        } else if (bowser.opera) {
            return BrowserType.Opera;
        } else if (bowser.msedge) {
            return BrowserType.Edge;
        } else if (bowser.safari) {
            return BrowserType.Safari;
        } else {
            return BrowserType.Other;
        }
    },
    getOperatingSystem(): OperatingSystemType {
        if (bowser.android) {
            return OperatingSystemType.Android;
        } else if (bowser.ios) {
            return OperatingSystemType.iOS;
        } else if (bowser.mac) {
            return OperatingSystemType.Mac;
        } else if (bowser.windows) {
            return OperatingSystemType.Windows;
        } else if (bowser.windowsphone) {
            return OperatingSystemType.WindowsPhone;
        } else if (bowser.linux) {
            return OperatingSystemType.Linux;
        } else {
            return OperatingSystemType.Other;
        }
    },
    isTokenTracked(token: Token): boolean {
        return token.trackedTimestamp !== undefined;
    },
    // Returns a [downloadLink, isOnMobile] tuple.
    getBestWalletDownloadLinkAndIsMobile(): [string, boolean] {
        const browserType = utils.getBrowserType();
        const isOnMobile = utils.isMobileOperatingSystem();
        const operatingSystem = utils.getOperatingSystem();
        let downloadLink;
        if (isOnMobile) {
            switch (operatingSystem) {
                case OperatingSystemType.Android:
                    downloadLink = constants.URL_COINBASE_WALLET_ANDROID_APP_STORE;
                    break;
                case OperatingSystemType.iOS:
                    downloadLink = constants.URL_COINBASE_WALLET_IOS_APP_STORE;
                    break;
                default:
                    // Coinbase wallet is only supported on these mobile OSes - just default to iOS
                    downloadLink = constants.URL_COINBASE_WALLET_IOS_APP_STORE;
            }
        } else {
            switch (browserType) {
                case BrowserType.Chrome:
                    downloadLink = constants.URL_METAMASK_CHROME_STORE;
                    break;
                case BrowserType.Firefox:
                    downloadLink = constants.URL_METAMASK_FIREFOX_STORE;
                    break;
                case BrowserType.Opera:
                    downloadLink = constants.URL_METAMASK_OPERA_STORE;
                    break;
                default:
                    downloadLink = constants.URL_METAMASK_HOMEPAGE;
            }
        }
        return [downloadLink, isOnMobile];
    },
    getTokenIconUrl(symbol: string): string {
        const result = `/images/token_icons/${symbol}.png`;
        return result;
    },
    setUrlHash(anchorId: string): void {
        window.location.hash = anchorId;
    },
    scrollToHash(hash: string, containerId: string): void {
        let finalHash = hash;
        if (_.isEmpty(hash)) {
            finalHash = constants.SCROLL_TOP_ID; // scroll to the top
        }

        scroller.scrollTo(finalHash, {
            duration: 0,
            offset: 0,
            containerId,
        });
    },
    isUserOnMobile(): boolean {
        const isUserOnMobile = isMobile();
        return isUserOnMobile;
    },
    getIdFromName(name: string): string {
        const id = name.replace(/ /g, '-');
        return id;
    },
    convertDashesToSpaces(text: string): string {
        return text.replace(/-/g, ' ');
    },
    convertCamelCaseToSpaces(text: string): string {
        return changeCase.snake(text).replace(/_/g, ' ');
    },
    getEtherScanLinkIfExists(
        addressOrTxHash: string,
        networkId: number,
        suffix: EtherscanLinkSuffixes,
    ): string | undefined {
        const networkName = constants.NETWORK_NAME_BY_ID[networkId];
        if (networkName === undefined) {
            return undefined;
        }
        const etherScanPrefix = networkName === Networks.Mainnet ? '' : `${networkName.toLowerCase()}.`;
        return `https://${etherScanPrefix}etherscan.io/${suffix}/${addressOrTxHash}`;
    },
    // TODO(kimpers): Consolidate with https://github.com/0xProject/0x-monorepo/pull/2373
    toPaddedHex(n: number | string | BigNumber): string {
        if (typeof n === 'string' && /^0x[0-9a-f]+$/i.test(n) && n.length === 66) {
            // Already a padded hex.
            return n;
        }
        const _n = new BigNumber(n);

        return `0x${_n.toString(16).padStart(64, '0')}`;
    },
    _avgBlockTime: 0,
    _currentBlock: 0,
    async getCurrentBlockAsync(): Promise<number> {
        if (!utils._currentBlock) {
            utils._currentBlock = await ethersProvider.getBlockNumber();
        }
        return utils._currentBlock;
    },
    async getAvgBlockTimeAsync(): Promise<number> {
        if (!utils._avgBlockTime) {
            if (!utils._currentBlock) {
                await utils.getCurrentBlockAsync();
            }
            const blockTimestamps = await Promise.all([
                ethersProvider.getBlock(utils._currentBlock),
                ethersProvider.getBlock(utils._currentBlock - 10000),
            ]);

            utils._avgBlockTime =
                moment(blockTimestamps[0].timestamp).diff(moment(blockTimestamps[1].timestamp)) / 10000;
        }

        return utils._avgBlockTime;
    },
    async getFutureBlockTimestampAsync(blockNumber: number): Promise<number> {
        if (!utils._currentBlock) {
            await utils.getCurrentBlockAsync();
        }

        if (blockNumber > utils._currentBlock) {
            const avgBlockTime = utils._avgBlockTime || (await utils.getAvgBlockTimeAsync());

            return parseInt((Date.now() / 1000 + (blockNumber - utils._currentBlock) * avgBlockTime).toFixed(0), 10);
        }
        return 0;
    },
    maybeWrapInError(e: unknown): Error {
        if (e instanceof Error) {
            return e;
        }
        if (e === undefined || e === null) {
            return new Error('Unknown error');
        }
        return new Error(`${e}`);
    },
    validateContactForm(entries: { [s: string]: string }): { [s: string]: string } {
        const newErrors: { [s: string]: string } = {};
        const requiredFields = [
            'email',
            'firstName',
            'lastName',
            'companyName',
            'linkToProductOrWebsite',
            'usageDescription',
            'referral',
            'typeOfBusiness',
            'timelineForIntegration',
            'role',
            'chainOfInterest',
        ] as const;

        for (const field of requiredFields) {
            if (entries[field] === '') {
                newErrors[field] = 'Field is required';
            }
        }

        if (!newErrors.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(entries.email)) {
            newErrors.email = 'No valid email address';
        }

        if (entries.chainOfInterest === 'Other' && entries.chainOfInterestOther === '') {
            newErrors.chainOfInterestOther = 'Field is required';
        }
        return newErrors;
    },
}; // tslint:disable:max-file-line-count
