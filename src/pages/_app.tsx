import { SentryErrorBoundary } from '@/services/sentry' // needs to be imported first
import type { ReactNode } from 'react'
import { useEffect, useMemo, type ReactElement } from 'react'
import { type AppProps } from 'next/app'
import Head from 'next/head'
import { Provider } from 'react-redux'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import { setBaseUrl as setGatewayBaseUrl } from '@safe-global/safe-gateway-typescript-sdk'
import { setBaseUrl as setNewGatewayBaseUrl } from '@safe-global/safe-client-gateway-sdk'
import { CacheProvider, type EmotionCache } from '@emotion/react'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import '@/styles/globals.css'
import { IS_PRODUCTION, GATEWAY_URL_STAGING, GATEWAY_URL_PRODUCTION } from '@/config/constants'
import { makeStore, useHydrateStore } from '@/store'
import PageLayout from '@/components/common/PageLayout'
import useLoadableStores from '@/hooks/useLoadableStores'
import { useInitOnboard } from '@/hooks/wallets/useOnboard'
import { useInitWeb3 } from '@/hooks/wallets/useInitWeb3'
import { useInitSafeCoreSDK } from '@/hooks/coreSDK/useInitSafeCoreSDK'
import useTxNotifications from '@/hooks/useTxNotifications'
import useSafeNotifications from '@/hooks/useSafeNotifications'
import useTxPendingStatuses from '@/hooks/useTxPendingStatuses'
import { useInitSession } from '@/hooks/useInitSession'
import Notifications from '@/components/common/Notifications'
import CookieAndTermBanner from 'src/components/common/CookieAndTermBanner'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cgwDebugStorage } from '@/components/sidebar/DebugToggle'
import { useTxTracking } from '@/hooks/useTxTracking'
import { useSafeMsgTracking } from '@/hooks/messages/useSafeMsgTracking'
import useGtm from '@/services/analytics/useGtm'
import useBeamer from '@/hooks/Beamer/useBeamer'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import createEmotionCache from '@/utils/createEmotionCache'
import MetaTags from '@/components/common/MetaTags'
import useAdjustUrl from '@/hooks/useAdjustUrl'
import useSafeMessageNotifications from '@/hooks/messages/useSafeMessageNotifications'
import useSafeMessagePendingStatuses from '@/hooks/messages/useSafeMessagePendingStatuses'
import useChangedValue from '@/hooks/useChangedValue'
import { TxModalProvider } from '@/components/tx-flow'
import { useNotificationTracking } from '@/components/settings/PushNotifications/hooks/useNotificationTracking'
import Recovery from '@/features/recovery/components/Recovery'
import WalletProvider from '@/components/common/WalletProvider'
import CounterfactualHooks from '@/features/counterfactual/CounterfactualHooks'
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import GeoblockingProvider from '@/components/common/GeoblockingProvider'
import OutreachPopup from '@/features/targetedOutreach/components/OutreachPopup'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider as SolanaWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useAppDispatch } from '@/store'
import { solSafeSlice } from '@/store/solsafesSlice'
import { SolSafeItem } from '@/types/safetypes'

require('@solana/wallet-adapter-react-ui/styles.css');

export const GATEWAY_URL = IS_PRODUCTION || cgwDebugStorage.get() ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

const reduxStore = makeStore()

const InitApp = (): null => {
  setGatewayBaseUrl(GATEWAY_URL)
  setNewGatewayBaseUrl(GATEWAY_URL)
  useHydrateStore(reduxStore)
  useAdjustUrl()
  useGtm()
  useNotificationTracking()
  useInitSession()
  useLoadableStores()
  useInitOnboard()
  useInitWeb3()
  useInitSafeCoreSDK()
  useTxNotifications()
  useSafeMessageNotifications()
  useSafeNotifications()
  useTxPendingStatuses()
  useSafeMessagePendingStatuses()
  useTxTracking()
  useSafeMsgTracking()
  useBeamer()

  return null
}

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

export const AppProviders = ({ children }: { children: ReactNode | ReactNode[] }) => {
  const isDarkMode = useDarkMode()
  const themeMode = isDarkMode ? 'dark' : 'light'


  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const dispatch = useAppDispatch()

  const wallets = useMemo(
    () => [

      // new UnsafeBurnerWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );


  // useLoadableStores()


  useEffect(() => {
    // loadSafes()
  }, [])


  const loadSafes = async () => {
    const safeFromStorage = localStorage.getItem("safes")
    if (safeFromStorage) {
      const safes: SolSafeItem[] = JSON.parse(safeFromStorage)
      dispatch(solSafeSlice.actions.setSolSafes(safes))
    }
  }

  return (
    <SafeThemeProvider mode={themeMode}>
      {(safeTheme: Theme) => (
        <ThemeProvider theme={safeTheme}>
          <SolanaWalletProvider wallets={wallets} autoConnect>
            <SolanaWalletModalProvider>
              <WalletProvider>

                <ConnectionProvider endpoint={endpoint}>

                  <TxModalProvider>{children}</TxModalProvider>

                </ConnectionProvider>

              </WalletProvider>
            </SolanaWalletModalProvider>
          </SolanaWalletProvider>
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  )
}

interface WebCoreAppProps extends AppProps {
  emotionCache?: EmotionCache
}

const WebCoreApp = ({
  Component,
  pageProps,
  router,
  emotionCache = clientSideEmotionCache,
}: WebCoreAppProps): ReactElement => {
  const safeKey = useChangedValue(router.query.safe?.toString())


  return (
    <Provider store={reduxStore}>
      <Head>
        <title key="default-title">{'Safe{Wallet}'}</title>
        <MetaTags prefetchUrl={GATEWAY_URL} />
      </Head>

      <CacheProvider value={emotionCache}>
        <AppProviders>
          <CssBaseline />

          <InitApp />

          <PageLayout pathname={router.pathname}>
            <Component {...pageProps} key={safeKey} />
          </PageLayout>

          <CookieAndTermBanner />

          <OutreachPopup />

          <Notifications />

          <Recovery />

          <CounterfactualHooks />

          <PkModulePopup />
        </AppProviders>
      </CacheProvider>
    </Provider>
  )
}

export default WebCoreApp
