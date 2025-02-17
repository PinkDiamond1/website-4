import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { MetaTags } from 'ts/components/meta_tags';
import { RedirectExternal } from 'ts/components/RedirectExternal';
import { RegisterWizard } from 'ts/containers/governance/register/wizard';
import { NotFound } from 'ts/containers/not_found';
import { StakingWizard } from 'ts/containers/staking/wizard/wizard';
// import { createLazyComponent } from 'ts/lazy_component';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { Governance } from 'ts/pages/governance/governance';
import { Treasury } from 'ts/pages/governance/treasury';
import { VoterLeaderboard } from 'ts/pages/governance/voter_leaderboard';
import { store } from 'ts/redux/store';
import { WebsiteLegacyPaths, WebsitePaths } from 'ts/types';
import { muiTheme } from 'ts/utils/mui_theme';

// Next (new website) routes. We should rename them later
import { NextAboutJobs } from 'ts/pages/about/jobs';
import { NextAboutMission } from 'ts/pages/about/mission';
import { NextAboutPress } from 'ts/pages/about/press';
// import { Credits } from 'ts/pages/credits';
// import { Explore } from 'ts/pages/explore';

import { AccountActivity } from 'ts/pages/account/activity';
import { Account } from 'ts/pages/account/dashboard';
import { StakingPoolActivity } from 'ts/pages/staking/history';

// import { CFL } from 'ts/pages/cfl';
// import { NextEcosystem } from 'ts/pages/ecosystem';
import { Extensions } from 'ts/pages/extensions';
import { TreasuryBreakdown } from 'ts/pages/governance/treasury_breakdown';
import { VoteIndex } from 'ts/pages/governance/vote_index';
// import { Next0xInstant } from 'ts/pages/instant';
import { NextLanding } from 'ts/pages/landing';
// import { NextLaunchKit } from 'ts/pages/launch_kit';
// import { NextMarketMaker } from 'ts/pages/market_maker';
import { PrivacyPolicy } from 'ts/pages/privacy';
import { StakingIndex } from 'ts/pages/staking/home';
import { StakingPool } from 'ts/pages/staking/staking_pool';
import { RemoveStake } from 'ts/pages/staking/wizard/remove';

import { TermsOfService } from 'ts/pages/terms';
import { NextWhy } from 'ts/pages/why';

// import { Mesh } from 'ts/pages/mesh';

// Check if we've introduced an update that requires us to clear the tradeHistory local storage entries
tradeHistoryStorage.clearIfRequired();
trackedTokenStorage.clearIfRequired();

import { Web3Wrapper } from '@0x/web3-wrapper';
import { Web3ReactProvider } from '@web3-react/core';
import 'less/all.less';
import 'sass/modal_video.scss';
import { constants } from 'ts/utils/constants';

// We pass modulePromise returning lambda instead of module promise,
// cause we only want to import the module when the user navigates to the page.
// At the same time webpack statically parses for import() to determine bundle chunk split points
// so each lazy import needs it's own `import()` declaration.

// const LazyPortal = createLazyComponent('Portal', async () =>
// import(/* webpackChunkName: "portal" */ 'ts/containers/portal'),
// );
const DOCUMENT_TITLE = '0x: The Protocol for Trading Tokens';
const DOCUMENT_DESCRIPTION = 'An Open Protocol For Decentralized Exchange On The Ethereum Blockchain';

function getLibrary(provider: any): Web3Wrapper {
    const library = new Web3Wrapper(provider, {});
    return library;
}

// Create a client
const queryClient = new QueryClient();

render(
    <>
        <MetaTags title={DOCUMENT_TITLE} description={DOCUMENT_DESCRIPTION} />
        <Web3ReactProvider getLibrary={getLibrary}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <MuiThemeProvider muiTheme={muiTheme}>
                        <Provider store={store}>
                            <Switch>
                                {/* Next (new site) routes */}
                                <Route exact={true} path="/" component={NextLanding} />
                                <Route exact={true} path={WebsitePaths.Why} component={NextWhy} />
                                {/* <Route exact={true} path={WebsitePaths.MarketMaker} component={NextMarketMaker} /> */}
                                {/* <Route exact={true} path={WebsitePaths.Explore} component={Explore} /> */}
                                {/* <Route exact={true} path={WebsitePaths.Credits} component={Credits} /> */}
                                {/* <Route exact={true} path={WebsitePaths.Instant} component={Next0xInstant} /> */}
                                {/* <Route exact={true} path={WebsitePaths.LaunchKit} component={NextLaunchKit} /> */}
                                {/* <Route exact={true} path={WebsitePaths.Ecosystem} component={NextEcosystem} /> */}

                                <Route exact={true} path={WebsitePaths.Account} component={Account} />
                                <Route exact={true} path={WebsitePaths.AccountActivity} component={AccountActivity} />
                                <Route exact={true} path={WebsitePaths.Staking} component={StakingIndex} />
                                <Route exact={true} path={WebsitePaths.StakingWizard} component={StakingWizard} />
                                <Route exact={true} path={WebsitePaths.StakingWizardRemove} component={RemoveStake} />
                                <Route exact={true} path={WebsitePaths.StakingPool} component={StakingPool} />
                                <Route
                                    exact={true}
                                    path={WebsitePaths.StakingPoolActivity}
                                    component={StakingPoolActivity}
                                />
                                <Route exact={true} path={`${WebsitePaths.Register}`} component={RegisterWizard} />
                                <Route exact={true} path={`${WebsitePaths.Treasury}`} component={TreasuryBreakdown} />
                                <Route exact={true} path={`${WebsitePaths.Vote}/proposal/:id`} component={Treasury} />
                                <Route
                                    exact={true}
                                    path={`${WebsitePaths.Vote}/proposal/voter-leaderboard/:id`}
                                    component={VoterLeaderboard}
                                />
                                <Route exact={true} path={`${WebsitePaths.Vote}/:zeip`} component={Governance} />
                                <Route exact={true} path={WebsitePaths.Vote} component={VoteIndex} />

                                <Route exact={true} path={WebsitePaths.Extensions} component={Extensions} />
                                {/* <Route exact={true} path={WebsitePaths.AssetSwapperPage} component={CFL} /> */}
                                <Route exact={true} path={WebsitePaths.PrivacyPolicy} component={PrivacyPolicy} />
                                <Route exact={true} path={WebsitePaths.TermsOfService} component={TermsOfService} />
                                <Route exact={true} path={WebsitePaths.AboutMission} component={NextAboutMission} />
                                <Route exact={true} path={WebsitePaths.AboutPress} component={NextAboutPress} />
                                <Route exact={true} path={WebsitePaths.AboutJobs} component={NextAboutJobs} />
                                {/* <Route exact={true} path={WebsitePaths.Mesh} component={Mesh} /> */}
                                {/*
                                  Note(ez): We remove/replace all old routes with next routes
                                  once we're ready to put a ring on it. for now let's keep em there for reference

                            Portal does currently does not support V3 architecture
                            //<Route path={WebsitePaths.Portal} component={LazyPortal} />
                                */}
                                {/* 0x API page deprecated, redirect any inbound requests to homepage */}
                                <Redirect from={WebsitePaths.ZeroExApi} to={WebsitePaths.Home} />
                                <Redirect from={WebsitePaths.StakingShortLink} to={WebsitePaths.Vote} />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.ZeroExJs}/:version?`}
                                    to={constants.URL_NPMJS_ZEROEXJS}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.ContractWrappers}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/contract-wrappers/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.Migrations}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/migrations/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.Connect}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/connect/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.SolCompiler}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/sol-compiler/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.SolCoverage}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/sol-coverage/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.SolTrace}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/sol-trace/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.SolProfiler}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/sol-profiler/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.JSONSchemas}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/json-schemas/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.Subproviders}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/subproviders/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.OrderUtils}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/order-utils/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.Web3Wrapper}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/web3-wrapper/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.EthereumTypes}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/ethereum-types/:version?`}
                                />
                                <Redirect
                                    from={`${WebsiteLegacyPaths.AssetSwapperDocs}/:version?`}
                                    to={`${WebsitePaths.Docs}/tools/asset-swapper/:version?`}
                                />

                                {/* Legacy endpoints */}
                                <RedirectExternal
                                    from={WebsiteLegacyPaths.Wiki}
                                    to="https://docs.0x.org/introduction/guides"
                                />
                                <Redirect from={WebsiteLegacyPaths.Jobs} to={WebsitePaths.AboutJobs} />
                                <Redirect from={WebsitePaths.Careers} to={WebsitePaths.AboutJobs} />
                                <RedirectExternal from={WebsitePaths.Docs} to="https://docs.0x.org" />
                                <Route component={NotFound as any} />
                            </Switch>
                        </Provider>
                    </MuiThemeProvider>
                </Router>
            </QueryClientProvider>
        </Web3ReactProvider>
    </>,
    document.getElementById('app'),
);
