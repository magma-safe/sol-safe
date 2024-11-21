import { useEffect, useState } from 'react'
import { getTransactionQueue, type TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { getSolVaultTxns, SolVaultTxnType } from '@/utils/solvaulthelper'
import { useConnection } from '@solana/wallet-adapter-react'
import { useSafeCreateKey } from '../useSafeAddress'
import { useAppSelector } from '@/store'

export const useLoadSolVaultTxns = (): AsyncResult<SolVaultTxnType[]> => {
  const { safe, safeLoaded } = useSafeInfo()

  const createKey = useSafeCreateKey()
  const { connection } = useConnection()

  const tokensList = useAppSelector((state) => {
    return state.tokens.data.items
  })
  // Re-fetch when chainId/address, or txQueueTag change
  const [data, error, loading] = useAsync<SolVaultTxnType[]>(
    () => {
      if (!safeLoaded) return
      if (!safe.deployed) return Promise.resolve([])
      return getSolVaultTxns(connection, createKey, tokensList)
      // return getTransactionQueue('11155111', '0xe55A1EF640Cf41f53491A2F0aEf681107Eab9de4')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createKey, connection, safeLoaded, tokensList],
    false,
  )

  // Track proposed and deleted txs so that we can reload the queue
  // useEffect(() => {
  //   const unsubscribeProposed = txSubscribe(TxEvent.PROPOSED, ({ txId }) => {
  //     setUpdatedTxId(txId)
  //   })
  //   const unsubscribeDeleted = txSubscribe(TxEvent.DELETED, ({ safeTxHash }) => {
  //     setUpdatedTxId(safeTxHash)
  //   })
  //   return () => {
  //     unsubscribeProposed()
  //     unsubscribeDeleted()
  //   }
  // }, [])

  // Log errors
  useEffect(() => {
    if (!error) return
    logError(Errors._603, error.message)
  }, [error])

  return [data, error, loading]
}

export default useLoadSolVaultTxns
