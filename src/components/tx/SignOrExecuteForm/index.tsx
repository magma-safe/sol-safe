import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from './SignOrExecuteForm'
import type { SignOrExecuteProps, SubmitCallback } from './SignOrExecuteForm'
import SignOrExecuteSkeleton from './SignOrExecuteSkeleton'
import { useProposeTx } from './hooks'
import { useContext } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWallet } from '@solana/wallet-adapter-react'

type SignOrExecuteExtendedProps = Omit<SignOrExecuteProps, 'txId'> & {
  onSubmit?: SubmitCallback
  txId?: string
  children?: React.ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  isBatch?: boolean
  isBatchable?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  isCreation?: boolean
  showMethodCall?: boolean
}

const SignOrExecute = (props: SignOrExecuteExtendedProps) => {
  const { safeTx, safeSolTxInstructions } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const [txDetails, error] = useProposeTx(safe.deployed ? safeTx : undefined, props.txId, props.origin)

  // Show the loader only the first time the tx is being loaded
  if (!safeSolTxInstructions) {
    return <div>
      <SignOrExecuteSkeleton />

    </div>

  }

  return (
    <SignOrExecuteForm {...props} isCreation={!props.txId} txId={props.txId || txDetails?.txId} txDetails={txDetails}>
      {props.children}
    </SignOrExecuteForm>
  )
}

export default SignOrExecute
