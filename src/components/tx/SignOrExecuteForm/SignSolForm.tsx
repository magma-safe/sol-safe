import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useEffect, useState } from 'react'
import { CircularProgress, Box, Button, CardActions, Divider } from '@mui/material'
import Stack from '@mui/system/Stack'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { useAlreadySigned, useSolTxActions, useTxActions } from './hooks'
import type { SignOrExecuteProps } from './SignOrExecuteForm'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TxModalContext } from '@/components/tx-flow'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxSecurityContext } from '../security/shared/TxSecurityContext'
import NonOwnerError from '@/components/tx/SignOrExecuteForm/NonOwnerError'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import BatchButton from './BatchButton'
import { asError } from '@/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import {

  TransactionInstruction,

} from '@solana/web3.js'
import { useWallet as useSolWallet, useConnection } from '@solana/wallet-adapter-react'
import useSafeAddress, { useSafeCreateKey } from '@/hooks/useSafeAddress'
import { useRouter } from 'next/navigation'

export const SignSolForm = ({
  // safeTx,
  safeSolTxInstructions,
  txId,
  onSubmit,
  disableSubmit = false,
  origin,
  isBatch,
  isBatchable,
  isCreation,
  isOwner,
  txActions,
  txSecurity,
}: SignOrExecuteProps & {
  safeSolTxInstructions?: TransactionInstruction[]
  isOwner: ReturnType<typeof useIsSafeOwner>

  txActions: ReturnType<typeof useSolTxActions>
  txSecurity: ReturnType<typeof useTxSecurityContext>
  isCreation?: boolean
  // safeTx?: SafeTransaction
}): ReactElement => {


  const { connection } = useConnection()
  const { publicKey: connectedAddress, signTransaction, sendTransaction } = useSolWallet()

  const safeAddress = useSafeAddress()

  const safeCreateKey = useSafeCreateKey()
  // Form state
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)

  const router = useRouter()
  // Hooks
  const { signTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  // const { needsRiskConfirmation, isRiskConfirmed, setIsRiskIgnored } = txSecurity
  // const hasSigned = useAlreadySigned(safeTx)
  const hasSigned = false
  // 
  // On modal submit
  const handleSubmit = async (e: SyntheticEvent, isAddingToBatch = false) => {
    e.preventDefault()

    // if (needsRiskConfirmation && !isRiskConfirmed) {
    //   setIsRiskIgnored(true)
    //   return
    // }

    if (!safeSolTxInstructions) return

    setIsSubmittable(false)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    let resultTxId: string
    try {

      resultTxId = await signTx(safeSolTxInstructions, connection, safeCreateKey, connectedAddress!, signTransaction!, sendTransaction!)
      router.refresh()
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._804, err)
        setSubmitError(err)
      }
      setIsSubmittable(true)
      return
    }

    // On successful sign
    if (!isAddingToBatch) {
      onSubmit?.(resultTxId)
    }

    setTxFlow(undefined)
  }

  const onBatchClick = (e: SyntheticEvent) => {
    handleSubmit(e, true)
  }



  const cannotPropose = !isOwner
  const submitDisabled = !safeSolTxInstructions || !isSubmittable || disableSubmit || cannotPropose



  return (
    <form onSubmit={handleSubmit}>
      {hasSigned && <ErrorMessage level="warning">You have already signed this transaction.</ErrorMessage>}

      {/* {cannotPropose ? (
        <NonOwnerError />
      ) : (
        submitError && (
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
        )
      )} */}

      {isRejectedByUser && (
        <Box mt={1}>
          <WalletRejectionError />
        </Box>
      )}

      <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

      <CardActions>
        <Stack
          sx={{
            width: ['100%', '100%', '100%', 'auto'],
          }}
          direction={{ xs: 'column-reverse', lg: 'row' }}
          spacing={{ xs: 2, md: 2 }}
        >
          {/* Batch button */}
          {/* {isCreation && !isBatch && (
            <BatchButton
              onClick={onBatchClick}
              disabled={submitDisabled || !isBatchable}
              tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
            />
          )} */}

          {/* Submit button */}
          <Button
            data-testid="sign-btn"
            variant="contained"
            type="submit"
            disabled={submitDisabled}
            sx={{ minWidth: '82px', order: '1', width: ['100%', '100%', '100%', 'auto'] }}
          >
            {!isSubmittable ? <CircularProgress size={20} /> : 'Sign'}
          </Button>
        </Stack>
      </CardActions>
    </form>
  )
}

const useTxSecurityContext = () => useContext(TxSecurityContext)

export default madProps(SignSolForm, {
  isOwner: useIsSafeOwner,
  txActions: useSolTxActions,
  txSecurity: useTxSecurityContext,
})
