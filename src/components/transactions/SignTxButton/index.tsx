import type { SyntheticEvent } from 'react'
import { useCallback, useContext, useState, type ReactElement } from 'react'
import { type TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Button, Tooltip } from '@mui/material'


import { TxModalContext } from '@/components/tx-flow'
import { SolVaultTxnType } from '@/utils/solvaulthelper'
import { useWallet as useSolWallet } from '@solana/wallet-adapter-react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import useSolVaultActions from '@/hooks/useSolVaultAction'
import { useRouter } from 'next/navigation'
import { showNotification } from '@/store/notificationsSlice'

const SignTxButton = ({
  txSummary,
  compact = false,
}: {
  txSummary: TransactionSummary
  compact?: boolean
}): ReactElement => {

  const { safe } = useSafeInfo()
  const { setTxFlow } = useContext(TxModalContext)
  // const wallet = useWallet()
  const wallet = useSolWallet()
  const txn = useAppSelector((state) => { return state.solVaultTxn.data?.find((i: SolVaultTxnType) => { return i.index.toString() === txSummary.id.toString() }) })

  const isSignable = useCallback(() => {
    if (!safe || !wallet || !wallet.publicKey || !txn) {
      return false
    }

    if (wallet.publicKey && !safe.owners.find((i) => {
      return wallet.publicKey!.toBase58() === i.value
    })) {
      return false
    }
    const isUserInApproval = !!txn.approved.find((i: string) => { return i === wallet.publicKey?.toBase58() })
    const isUserInRejected = !!txn.rejected.find((i: string) => { return i === wallet.publicKey?.toBase58() })
    const isUserInCancelled = !!txn.cancelled.find((i: string) => { return i === wallet.publicKey?.toBase58() })

    const hasAlreadySigned = isUserInApproval || isUserInCancelled || isUserInRejected
    if (hasAlreadySigned) {
      return false
    }
    return true
  }, [safe, wallet, txn])
  // const isSignable = isSignableBy(txSummary, wallet?.address || '')
  const [isLoading, setLoading] = useState(false)

  const isTxnSignable = isSignable()
  const isDisabled = !isTxnSignable || isLoading

  const { handleAction } = useSolVaultActions()

  const router = useRouter()
  const dispatch = useAppDispatch()

  const onClick = async (e: SyntheticEvent) => {


    e.stopPropagation()
    e.preventDefault()
    if (!txn) {
      return
    }
    setLoading(true)
    try {

      const alsoExecute = safe.threshold <= (txn.approved.length + 1)

      await handleAction(txSummary.id, false, alsoExecute)
      router.refresh()
      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'global-import-success',
          message: 'Successfully Approved Transaction',
        }),
      )
    } catch (err) {
      dispatch(
        showNotification({
          variant: 'error',
          groupKey: 'global-import-success',
          message: "Failed"
        }),
      )
      console.log("SignTxButtonSignTxButton", err)
    }

    setLoading(false)

    // setTxFlow(<ConfirmTxFlow txSummary={txSummary} />, undefined, false)
  }

  return (
    <Tooltip title={!isTxnSignable ? "You've already signed this transaction" : ''}>
      <Button

        onClick={onClick}
        variant={compact ? 'outlined' : 'contained'}
        disabled={isDisabled}
        size={compact ? 'small' : 'stretched'}
        sx={compact ? { py: 0.6 } : undefined}
      >
        {isLoading ? "Confirming" : "Confirm"}
      </Button>
    </Tooltip>
  )
}

export default SignTxButton






export const SignSolTxButton = ({
  item,
  compact = false,
}: {
  item: SolVaultTxnType
  compact?: boolean
}): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  // const wallet = useWallet()
  const { publicKey } = useSolWallet()

  const isSignable = (publicKey && ((item.approved.indexOf(publicKey.toBase58()) === -1 &&
    item.cancelled.indexOf(publicKey.toBase58()) === -1) &&
    item.rejected.indexOf(publicKey.toBase58()) === -1))
  const isDisabled = !isSignable


  const onClick = (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // setTxFlow(<ConfirmTxFlow txSummary={txSummary} />, undefined, false)
  }

  return (
    <Tooltip title={!isSignable ? "You've already signed this transaction" : ''}>
      <span>
        <Button
          onClick={onClick}
          variant={compact ? 'outlined' : 'contained'}
          disabled={isDisabled}
          size={compact ? 'small' : 'stretched'}
          sx={compact ? { py: 0.6 } : undefined}
        >
          {isSignable ? "Confirm" : "Signed"}
        </Button>
      </span>
    </Tooltip>
  )
}

