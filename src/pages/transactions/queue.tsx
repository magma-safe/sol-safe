import type { NextPage } from 'next'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { Box } from '@mui/material'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue, usePendingTxs, useHasPendingTxs } from '@/hooks/usePendingTxs'
import RecoveryList from '@/features/recovery/components/RecoveryList'
import PaginatedSolTxns from '@/components/common/PaginatedSolTxns'

const Queue: NextPage = () => {
  const showPending = useHasPendingTxs()

  return (
    <>
      <Head>
        <title>{'Safe{Wallet} – Transaction queue'}</title>
      </Head>

      <BatchExecuteHoverProvider>
        <TxHeader />


        <main>
          <Box mb={4}>
            <RecoveryList />

            {/* Pending unsigned transactions */}
            {showPending && <PaginatedSolTxns useTxns={usePendingTxs} />}

            {/* The main queue of signed transactions */}
            <PaginatedTxns useTxns={useTxQueue} />
          </Box>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
