import { useAppSelector } from '@/store'

import { selectSolTransactionsByStatus } from '@/store/solVaultTxnSlice'
import { SolTxnStatusType } from '@/utils/solvaulthelper'

export const useSolVaultTxns = (status: SolTxnStatusType) => {
  return useAppSelector((state) => selectSolTransactionsByStatus(state, status))
}
