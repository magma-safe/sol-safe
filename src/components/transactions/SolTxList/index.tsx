import GroupedTxListItems from '@/components/transactions/GroupedTxListItems'
import { groupTxs } from '@/utils/tx-list'
import { Box } from '@mui/material'
import type { Transaction, TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'
import type { ReactElement, ReactNode } from 'react'
import { useMemo } from 'react'
import TxListItem from '../TxListItem'
import css from './styles.module.css'
import uniq from 'lodash/uniq'
import BulkTxListGroup from '@/components/transactions/BulkTxListGroup'
import { SolVaultTxnType } from '@/utils/solvaulthelper'
import ExpandableTransactionItem from '../TxListItem/ExpandableTransactionItem'
import SolExpandableTransactionItem from '../TxListItem/SolExpandableItem'

type TxListProps = {
  items: SolVaultTxnType[]

}

const getBulkGroupTxHash = (group: Transaction[]) => {
  const hashList = group.map((item) => item.transaction.txHash)
  return uniq(hashList).length === 1 ? hashList[0] : undefined
}

export const TxListGrid = ({ children }: { children: ReactNode }): ReactElement => {
  return <Box className={css.container}>{children}</Box>
}

const SolTxList = ({ items }: TxListProps): ReactElement => {
  // const groupedTransactions = useMemo(() => groupTxs(items), [items])

  const transactions = items.map((item, index) => {
    if (!Array.isArray(item)) {
      return <SolExpandableTransactionItem key={index} item={item} />
    }

    const bulkTransactionHash = getBulkGroupTxHash(item)
    if (bulkTransactionHash) {
      return <BulkTxListGroup key={index} groupedListItems={item} transactionHash={bulkTransactionHash} />
    }

    return <GroupedTxListItems key={index} groupedListItems={item} />
  })

  return <TxListGrid>{transactions}</TxListGrid>
}

export default SolTxList
