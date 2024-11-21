import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import { useWeb3 } from '@/hooks/wallets/web3'
import { useEffect, useMemo } from 'react'
import { getBalances, TokenType, type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync, { type AsyncResult } from '../useAsync'
import { Errors, logError } from '@/services/exceptions'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain } from '../useChains'
import { FEATURES, hasFeature } from '@/utils/chains'
import { POLLING_INTERVAL } from '@/config/constants'
import useIntervalCounter from '../useIntervalCounter'
import useSafeInfo from '../useSafeInfo'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import axios from 'axios'
import useSafeAddress from '../useSafeAddress'

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

async function getBalance(safeAddress: string): Promise<SafeBalanceResponse> {
  const url = `${process.env.NEXT_PUBLIC_PORTFOLIO_API}/balances/${safeAddress}`
  const resp = await axios.get(url)

  return resp.data
}
export const useLoadBalances = (): AsyncResult<SafeBalanceResponse> => {
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  // const currency = useAppSelector(selectCurrency)
  // const isTrustedTokenList = useTokenListSetting()
  const safeAddress = useSafeAddress()
  // const { safe } = useSafeInfo()
  // const web3 = useWeb3()
  // const chain = useCurrentChain()
  // const chainId = safe.chainId
  // Re-fetch assets when the entire SafeInfo updates
  const [data, error, loading] = useAsync<SafeBalanceResponse | undefined>(
    () => {
      if (!safeAddress) return

      // if (!safe.deployed) {
      //   return getCounterfactualBalance(safeAddress, web3, chain)
      // }

      //todo

      return getBalance(safeAddress)

      // return getBalances(chainId, safeAddress, currency, {
      //   trusted: isTrustedTokenList,
      // })

      // return getBalance
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeAddress, pollCount],
    false, // don't clear data between polls
  )

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, safeAddress])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._601, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadBalances
