import { useWallet as useSolWallet, useConnection } from '@solana/wallet-adapter-react'
import * as multisig from '@sqds/multisig'
import { useSafeCreateKey } from './useSafeAddress'
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'

const useSolVaultActions = () => {
  const { connection } = useConnection()
  const { publicKey: connectedAddress, sendTransaction } = useSolWallet()
  const createKey = useSafeCreateKey()
  const handleAction = async (txnId: string, isReject: boolean, isAlsoExecute?: boolean) => {
    if (!connectedAddress || !createKey) {
      throw new Error('Wallet not connected')
    }

    const blockhash = (await connection.getLatestBlockhash()).blockhash

    const [multisigPda] = multisig.getMultisigPda({
      createKey: new PublicKey(createKey),
    })
    const instruction = multisig.instructions[isReject ? 'proposalReject' : 'proposalApprove']({
      multisigPda,
      transactionIndex: BigInt(txnId),
      member: connectedAddress,
    })

    const instructions: TransactionInstruction[] = [instruction]
    const lookupTableAccounts: AddressLookupTableAccount[] = []
    if (isAlsoExecute) {
      const execution = await multisig.instructions.vaultTransactionExecute({
        connection,
        multisigPda,
        transactionIndex: BigInt(txnId),
        member: connectedAddress,
      })
      lookupTableAccounts.push(...execution.lookupTableAccounts)
      instructions.push(execution.instruction)
    }
    const message = new TransactionMessage({
      payerKey: connectedAddress,
      recentBlockhash: blockhash,
      instructions: instructions,
    }).compileToV0Message(lookupTableAccounts)

    const tx = new VersionedTransaction(message)
    try {
      const txn = await sendTransaction(tx, connection)
    } catch (err) {
      throw err
    }
  }

  return {
    handleAction,
  }
}

export default useSolVaultActions
