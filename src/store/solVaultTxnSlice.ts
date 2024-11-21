import type { listenerMiddlewareInstance } from '@/store'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { makeLoadableSlice } from './common'

import { SolTxnStatusType, SolVaultTxnType } from '@/utils/solvaulthelper'

const { slice, selector } = makeLoadableSlice('solVaultTxn', undefined as SolVaultTxnType[] | undefined)

export const solVaultTxnSlice = slice
export const selectSolTxQueue = selector

export const selectQueuedSolTransactions = createSelector(selectSolTxQueue, (txQueue) => {
  return txQueue.data?.filter((txn) => {
    return txn.status === 'Active'
  })
  // return txQueue.data.filter(isTransactionListItem)
})

export const selectSolTransactions = createSelector(selectSolTxQueue, (txQueue) => {
  return txQueue.data
})

export const selectSolTransactionsByStatus = createSelector(
  selectSolTransactions,
  (_: RootState, status: SolTxnStatusType) => status,
  (allTxns, status: SolTxnStatusType) => {
    return (allTxns || []).filter((item) => {
      return item.status === status
    })
  },
)

// export const selectQueuedTransactionsByNonce = createSelector(
//   selectQueuedTransactions,
//   (_: RootState, nonce?: number) => nonce,
//   (queuedTransactions, nonce?: number) => {
//     return (queuedTransactions || []).filter((item) => {
//       return isMultisigExecutionInfo(item.transaction.executionInfo) && item.transaction.executionInfo.nonce === nonce
//     })
//   },
// )

export const solTxListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // listenerMiddleware.startListening({
  //   actionCreator: solVaultTxnSlice.actions.set,
  //   effect: (action, listenerApi) => {
  //     if (!action.payload.data) {
  //       return
  //     }
  //     const pendingTxs = selectPendingTxs(listenerApi.getState())
  //     for (const result of action.payload.data.results) {
  //       if (!isTransactionListItem(result)) {
  //         continue
  //       }
  //       const txId = result.transaction.id
  //       const pendingTx = pendingTxs[txId]
  //       if (!pendingTx || pendingTx.status !== PendingStatus.SIGNING) {
  //         continue
  //       }
  //       // The transaction is waiting for a signature of awaitingSigner
  //       if (
  //         isMultisigExecutionInfo(result.transaction.executionInfo) &&
  //         !result.transaction.executionInfo.missingSigners?.some((address) =>
  //           sameAddress(address.value, pendingTx.signerAddress),
  //         )
  //       ) {
  //         txDispatch(TxEvent.SIGNATURE_INDEXED, { txId })
  //       }
  //     }
  //   },
  // })
}

// export const selectPendingSolTxIdsBySafe = createSelector(
//   selectSolTransactions,
//   (_: RootState, createKey: string) => createKey,
//   (allTxns, status: SolTxnStatusType) => {
//     return (allTxns || []).filter((item) => {
//       return item.status === status
//     })
//   },
// )

export const selectSolTxBySafe = createSelector(
  selectSolTransactions,
  (_: RootState, createKey?: string, userWalletAddress?: string, onlyPending?: boolean) => {
    return { createKey, userWalletAddress, onlyPending }
  },
  (allTxns, info: { createKey?: string; userWalletAddress?: string; onlyPending?: boolean }) => {
    const items = (allTxns || []).filter((item) => {
      if (!info.createKey) {
        return []
      }

      const checkForStatus = info.onlyPending ? item.status === 'Active' : item.status !== 'Active'

      // const hasNotDoneAnyAction =
      //   (item.approved.indexOf(info.userWalletAddress) === -1 &&
      //     item.cancelled.indexOf(info.userWalletAddress) === -1) ||
      //   item.rejected.indexOf(info.userWalletAddress) === -1
      return checkForStatus && item.createKey === info.createKey
    })

    return items
  },
)
