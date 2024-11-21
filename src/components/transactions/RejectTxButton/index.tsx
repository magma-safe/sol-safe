import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Button } from '@mui/material'

import type { ReactElement, SyntheticEvent } from 'react'
import { useCallback, useContext, useState } from 'react'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import useIsPending from '@/hooks/useIsPending'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { TxModalContext } from '@/components/tx-flow'
import { ReplaceTxFlow } from '@/components/tx-flow/flows'
import { useWallet as useSolWallet } from '@solana/wallet-adapter-react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import useSolVaultActions from '@/hooks/useSolVaultAction'
import { showNotification } from '@/store/notificationsSlice'
import { useRouter } from 'next/navigation'

const RejectTxButton = ({
  txSummary,
  safeTxHash,
  proposer,
}: {
  txSummary: TransactionSummary
  safeTxHash?: string
  proposer?: string
}): ReactElement | null => {
  const { safe } = useSafeInfo()

  const txn = useAppSelector((state) => { return state.solVaultTxn.data?.find((i) => { return i.index.toString() === txSummary.id.toString() }) })

  const wallet = useSolWallet()
  const isSignable = useCallback(() => {
    if (!safe || !wallet || !wallet.publicKey || !txn) {
      return false
    }

    if (wallet.publicKey && !safe.owners.find((i) => {
      return wallet.publicKey!.toBase58() === i.value
    })) {
      return false
    }
    const isUserInApproval = !!txn.approved.find((i) => { return i === wallet.publicKey?.toBase58() })
    const isUserInRejected = !!txn.rejected.find((i) => { return i === wallet.publicKey?.toBase58() })
    const isUserInCancelled = !!txn.cancelled.find((i) => { return i === wallet.publicKey?.toBase58() })

    const hasAlreadySigned = isUserInApproval || isUserInCancelled || isUserInRejected
    if (hasAlreadySigned) {
      return false
    }
    return true
  }, [safe, wallet, txn])

  const [isLoading, setLoading] = useState(false)

  const isTxnSignable = isSignable()
  const isDisabled = !isTxnSignable || isLoading

  const { handleAction } = useSolVaultActions()
  const dispatch = useAppDispatch()


  const router = useRouter()
  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLoading(true)

    try {
      await handleAction(txSummary.id, true)
      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'global-import-success',
          message: 'Successfully Rejected Transaction',
        }),
      )
      router.refresh()
    } catch (err) {
      console.log("RejectTxButton", err)
      dispatch(
        showNotification({
          variant: 'error',
          groupKey: 'global-import-success',
          message: "Failed"
        }),
      )
    }

    setLoading(false)
  }
  return (
    <Button
      data-testid="reject-btn"
      onClick={onClick}
      variant="danger"
      disabled={isDisabled}
      size="stretched"
    >
      Reject
    </Button>
  )
}

export default RejectTxButton
