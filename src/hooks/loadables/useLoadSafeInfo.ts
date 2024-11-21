import { useEffect } from 'react'
import { AddressEx, ImplementationVersionState, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeAddress from '../useSafeAddress'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import * as multisig from '@sqds/multisig'
import { PublicKey } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { useAppSelector } from '@/store'
import { SolSafeItem } from '@/types/safetypes'
import { POLLING_INTERVAL } from '@/config/constants'
import useIntervalCounter from '../useIntervalCounter'

export const useLoadSafeInfo = (): AsyncResult<SafeInfo> => {
  const address = useSafeAddress()
  const { safe } = useSafeInfo()
  const { connection } = useConnection()
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)

  const safes = useAppSelector((state) => {
    return state.solSafeSlice.safes
  })

  const [data, error, loading] = useAsync<SafeInfo | undefined>(async () => {
    if (!address || !connection || !safes) return

    let rawCreateKey: string = ''

    try {
      const safe = safes.find((s: SolSafeItem) => {
        return s.safeAddress.toLowerCase() === address.toLowerCase()
      })

      if (safe) {
        rawCreateKey = safe.createKey
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
  }, [address, safes, connection, pollCount])

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, address])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._600, error.message)
    }
  }, [error])

  return [data ? data : safe, error, loading]
}

export default useLoadSafeInfo
