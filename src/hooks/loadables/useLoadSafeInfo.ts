import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getUndeployedSafeInfo } from '@/features/counterfactual/utils'
import { useAppSelector } from '@/store'
import { useEffect } from 'react'
import {
  AddressEx,
  getSafeInfo,
  ImplementationVersionState,
  type SafeInfo,
} from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeAddress from '../useSafeAddress'
import { useChainId } from '../useChainId'
import useIntervalCounter from '../useIntervalCounter'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCurrentChain } from '../useChains'
import * as multisig from '@sqds/multisig'
import {
  PublicKey,
  Keypair,
  Connection,
  Signer,
  SendOptions,
  TransactionSignature,
  TransactionMessage,
  ComputeBudgetProgram,
  VersionedTransaction,
} from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'

export const useLoadSafeInfo = (): AsyncResult<SafeInfo> => {
  const address = useSafeAddress()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  const { safe } = useSafeInfo()
  const isStoredSafeValid = safe.chainId === chainId && safe.address.value === address
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))
  const { connection } = useConnection()

  const [data, error, loading] = useAsync<SafeInfo | undefined>(async () => {
    if (!address || !connection) return

    const rawSafes = localStorage.getItem('safes')

    if (!rawSafes) {
      return
    }

    let rawCreateKey: string = ''

    try {
      const safes = JSON.parse(rawSafes)
      const safe = safes.find((s: any) => {
        return s['safeAddress'].toLowerCase() === address.toLowerCase()
      })

      if (safe) {
        rawCreateKey = safe['createKey']
      }
    } catch (err) {
      return
    }

    if (!rawCreateKey) {
      return
    }
    const createKey = new PublicKey(rawCreateKey)
    const [multisigPda] = multisig.getMultisigPda({
      createKey,
    })

    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda)

    // /**
    //  * This is the one place where we can't check for `safe.deployed` as we want to update that value
    //  * when the local storage is cleared, so we have to check undeployedSafe
    //  */
    // if (undeployedSafe) return getUndeployedSafeInfo(undeployedSafe, address, chain)

    // // const safeInfo = await getSafeInfo(chainId, address)

    const owners: AddressEx[] = []

    for (const owner of multisigAccount.members) {
      owners.push({
        value: owner.key.toBase58(),
      })
    }

    const safeInfo: SafeInfo = {
      address: {
        value: createKey.toBase58(),
        name: undefined,
        logoUri: undefined,
      },
      chainId: '',
      nonce: Number(multisigAccount.transactionIndex.toString()) + 1,
      threshold: multisigAccount.threshold,
      owners,
      implementation: {
        value: '',
        name: undefined,
        logoUri: undefined,
      },
      implementationVersionState: ImplementationVersionState.UP_TO_DATE,
      modules: null,
      guard: null,
      fallbackHandler: null,
      version: null,
      collectiblesTag: null,
      txQueuedTag: null,
      txHistoryTag: null,
      messagesTag: null,
    }
    return { ...safeInfo, deployed: true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, connection])

  // Reset the counter when safe address/chainId changes
  // useEffect(() => {
  //   resetPolling()
  // }, [resetPolling, address])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._600, error.message)
    }
  }, [error])

  return [
    // Return stored SafeInfo between polls
    data ?? (isStoredSafeValid ? safe : data),
    error,
    loading,
  ]
}

export default useLoadSafeInfo
