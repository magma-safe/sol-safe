import * as multisig from '@sqds/multisig'
import { useWallet as useSolWallet, useConnection } from '@solana/wallet-adapter-react'
import {
  PublicKey,
  Keypair,
  Connection,
  Signer,
  SendOptions,
  TransactionSignature,
  TransactionMessage,
  ComputeBudgetProgram,
  VersionedTransaction,
} from '@solana/web3.js'
import { Member } from '@sqds/multisig/lib/types'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { SolSafeItem } from '@/types/safetypes'
import { useAppDispatch } from '@/store'
import { addOrUpdateSolSafe } from '@/store/slices'

const useCreateSafe = () => {
  const { connection } = useConnection()
  const { publicKey: connectedAddress, signTransaction } = useSolWallet()

  const dispatch = useAppDispatch()

  async function multisigCreateV2({
    connection,
    treasury,
    createKey,
    multisigPda,
    configAuthority,
    threshold,
    members,
    timeLock,
    rentCollector,
    memo,
    sendOptions,
    programId,
  }: {
    connection: Connection
    treasury: PublicKey
    createKey: Signer
    multisigPda: PublicKey
    configAuthority: PublicKey | null
    threshold: number
    members: Member[]
    timeLock: number
    rentCollector: PublicKey | null
    memo?: string
    sendOptions?: SendOptions
    programId?: PublicKey
  }): Promise<TransactionSignature> {
    const blockhash = (await connection.getLatestBlockhash()).blockhash

    // const tx = multisig.transactions.multisigCreateV2({
    //   blockhash,
    //   treasury,
    //   createKey: createKey.publicKey,
    //   creator: connectedAddress!,
    //   multisigPda,
    //   configAuthority,
    //   threshold,
    //   members,
    //   timeLock,
    //   rentCollector,
    //   memo,
    //   programId,
    // });

    const priorityInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1000, // Set priority fee in micro-lamports (adjust as needed)
    })

    const ix = multisig.instructions.multisigCreateV2({
      treasury,
      creator: connectedAddress!,
      multisigPda,
      configAuthority,
      threshold,
      members,
      timeLock,
      createKey: createKey.publicKey,
      rentCollector,
      memo,
      programId,
    })

    const message = new TransactionMessage({
      payerKey: connectedAddress!,
      recentBlockhash: blockhash,

      //todo papa remove priority
      instructions: [priorityInstruction, ix],
    }).compileToV0Message()

    const tx = new VersionedTransaction(message)

    if (!signTransaction) {
      alert('signer not found')
      return ''
    }

    const sign = await signTransaction(tx)

    tx.sign([createKey])
    tx.addSignature(connectedAddress!, sign.signatures[0])

    try {
      return await connection.sendTransaction(tx, sendOptions)
    } catch (err) {
      throw err
      // translateAndThrowAnchorError(err);
    }
  }

  const createSolSafe = async (data: { threshold: number; owners: NamedAddress[] }) => {
    const createKey = Keypair.generate()

    const [multisigPda] = multisig.getMultisigPda({
      createKey: createKey.publicKey,
    })

    const programConfigPda = multisig.getProgramConfigPda({})[0]

    const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(connection, programConfigPda)

    const configTreasury = programConfig.treasury
    const { Permission, Permissions } = multisig.types

    const members = []

    for (const owner of data.owners) {
      // const isOwner = owner.address === connectedAddress?.toBase58()
      members.push({
        key: new PublicKey(owner.address),
        permissions: Permissions.all(),
        // permissions: isOwner ? Permissions.all() : Permissions.fromPermissions([Permission.Execute]),
      })
    }

    const signature = await multisigCreateV2({
      connection,
      // One time random Key
      createKey,
      // The creator & fee payer
      multisigPda,
      configAuthority: null,
      timeLock: 0,
      members,
      threshold: data.threshold,
      rentCollector: null,
      treasury: configTreasury,
      sendOptions: { skipPreflight: true },
    })

    const latestBlockHash = await connection.getLatestBlockhash()

    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    })
    const createKeyStr = createKey.publicKey.toBase58()
    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    })

    const safeAddress = vaultPda.toBase58()
    const finalSafe: SolSafeItem = {
      safeAddress,
      createKey: createKeyStr,
      linkedAddress: connectedAddress?.toBase58()!,
    }

    dispatch(addOrUpdateSolSafe({ safe: finalSafe }))

    return safeAddress
  }

  return {
    createSolSafe,
  }
}

export default useCreateSafe
