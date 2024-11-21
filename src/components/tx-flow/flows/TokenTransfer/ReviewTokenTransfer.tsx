import { useContext, useEffect, useMemo } from 'react'
import useBalances from '@/hooks/useBalances'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createSolanaTx, createTx } from '@/services/tx/tx-sender'
import type { TokenTransferParams } from '.'
import { SafeTxContext } from '../../SafeTxProvider'
import { safeParseUnits } from '@/utils/formatters'
import type { SubmitCallback } from '@/components/tx/SignOrExecuteForm/SignOrExecuteForm'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

const ReviewTokenTransfer = ({
  params,
  onSubmit,
  txNonce,
}: {
  params: TokenTransferParams
  onSubmit: SubmitCallback
  txNonce?: number
}) => {
  const safeAddress = useSafeAddress()
  const { setSafeTx, setSafeTxError, setNonce, setSafeSolTxInstructions } = useContext(SafeTxContext)
  const { balances } = useBalances()
  const { connection } = useConnection()
  const token = balances.items.find((item) => item.tokenInfo.address === params.tokenAddress)
  const { publicKey } = useWallet()
  const amountInWei = useMemo(
    () => safeParseUnits(params.amount, token?.tokenInfo.decimals)?.toString() || '0',
    [params.amount, token?.tokenInfo.decimals],
  )

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }

    if (!token || !safeAddress || !publicKey) return

    const txParams = createTokenTransferParams(
      params.recipient,
      params.amount,
      token.tokenInfo.decimals,
      token.tokenInfo.address,
    )




    createSolanaTx(publicKey?.toBase58(), connection, safeAddress, txParams, txNonce).then((tx) => {
      //@ts-ignore
      setSafeSolTxInstructions(tx)
    }).catch((err) => {
      console.log("createSolanaTx", err)
      setSafeTxError(err)
    })


  }, [params, txNonce, token, setNonce, setSafeTx, setSafeTxError, safeAddress,])

  return (
    <SignOrExecuteForm onSubmit={onSubmit}>
      {token && <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} />}

      <SendToBlock address={params.recipient} />
    </SignOrExecuteForm>
  )
}

export default ReviewTokenTransfer
