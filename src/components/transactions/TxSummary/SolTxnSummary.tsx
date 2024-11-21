import StatusLabel from '@/features/swap/components/StatusLabel'
import useIsExpiredSwap from '@/features/swap/hooks/useIsExpiredSwap'
import { Box } from '@mui/material'
import type { ReactElement } from 'react'
import { type Transaction } from '@safe-global/safe-gateway-typescript-sdk'
import type {
  Creation,
  Custom,
  MultiSend,
  SettingsChange,
  TransactionInfo,
  Transfer,
} from '@safe-global/safe-gateway-typescript-sdk'
import css from './styles.module.css'
import DateTime from '@/components/common/DateTime'
import TxInfo from '@/components/transactions/TxInfo'
import { isMultisigExecutionInfo, isTxQueued } from '@/utils/transaction-guards'
import TxType, { SolTxType } from '@/components/transactions/TxType'
import classNames from 'classnames'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import MaliciousTxWarning from '../MaliciousTxWarning'
import QueueActions from './QueueActions'
import useIsPending from '@/hooks/useIsPending'
import TxConfirmations from '../TxConfirmations'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import TxStatusLabel from '@/components/transactions/TxStatusLabel'
import { SolVaultTxnType } from '@/utils/solvaulthelper'
import SolTxInfo from '../TxInfo/SolTxnInfo'
import { useWallet } from '@solana/wallet-adapter-react'
import SignTxButton, { SignSolTxButton } from '../SignTxButton'

type TxSummaryProps = {
  isConflictGroup?: boolean
  isBulkGroup?: boolean
  item: SolVaultTxnType
}

const SolTxSummary = ({ item, isConflictGroup, isBulkGroup }: TxSummaryProps): ReactElement => {

  // const tx = item.transaction
  const isQueue = item.status === "Active"
  const nonce = item.index
  // const isTrusted = !hasDefaultTokenlist || isTrustedTx(tx)
  // const isImitationTransaction = isImitation(tx)
  // const isPending = useIsPending(tx.id)


  // const isPending = isQueue

  // const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  // const expiredSwap = useIsExpiredSwap(tx.txInfo)

  return (
    <Box
      data-testid="transaction-item"
      className={classNames(css.gridContainer, {
        [css.history]: !isQueue,
        [css.conflictGroup]: isConflictGroup,
        [css.bulkGroup]: isBulkGroup,
      })}
      id={nonce.toString()}
    >
      {nonce !== undefined && !isConflictGroup && !isBulkGroup && (
        <Box gridArea="nonce" data-testid="nonce" className={css.nonce}>
          {nonce}
        </Box>
      )}
      {/* 
      {(isImitationTransaction || !isTrusted) && (
        <Box data-testid="warning" gridArea="nonce">
          <MaliciousTxWarning withTooltip={!isImitationTransaction} />
        </Box>
      )} */}

      <Box gridArea="type" data-testid="tx-type">
        <SolTxType tx={item} />
      </Box>

      <Box gridArea="info" data-testid="tx-info">
        <SolTxInfo item={item} />
      </Box>

      <Box gridArea="date" data-testid="tx-date" className={css.date}>
        <DateTime value={Number(item.timestamp) * 1000} />
      </Box>

      {isQueue && (
        <Box gridArea="confirmations">
          <TxConfirmations
            submittedConfirmations={item.approved.length}
            requiredConfirmations={item.threshold}
          />
        </Box>
      )}

      {!isQueue ? (
        <Box gridArea="status" justifyContent="flex-end" display="flex" className={css.status}>
          {/* <TxStatusLabel tx={tx} /> */}
        </Box>
      ) : (
        ''
      )}

      {/* {isQueue && (
        <Box gridArea="actions">

          <SignSolTxButton item={item} compact />
        </Box>
      )} */}
    </Box>
  )
}

export default SolTxSummary
