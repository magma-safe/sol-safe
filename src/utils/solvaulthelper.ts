// import tokenList, { TokenConfigType } from '@/config/tokens'
import { TokenInfo } from '@/store/tokensSlice'
import {
  TransactionDetails,
  TransactionInfoType,
  TransactionStatus,
  TransactionSummary,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/safe-gateway-typescript-sdk'
import { getAccount, transferInstructionData } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'
import * as multisig from '@sqds/multisig'

type TransferDecodedTxn = {
  type: 'SOL_TRANSFER' | 'TOKEN_TRANSFER'
  programId?: string
  amount: string
  to: string
}

export type SolTxnStatusType = 'Draft' | 'Active' | 'Rejected' | 'Approved' | 'Executing' | 'Executed' | 'Cancelled'
export type SolTxnType = 'SEND'

// TransactionStatus
export type SolVaultTxnType = {
  index: number
  status: SolTxnStatusType
  type: SolTxnType
  threshold: number
  createKey: string
  timestamp: string
  approved: string[]
  rejected: string[]
  cancelled: string[]
  txnSummary?: TransactionSummary
  txnDetails?: TransactionDetails

  decodedAction?: TransferDecodedTxn
}

function readBigUInt64LE(buffer: Buffer, offset = 0) {
  const low = buffer.readUInt32LE(offset)
  const high = buffer.readUInt32LE(offset + 4)
  return (BigInt(high) << 32n) | BigInt(low)
}

export const getSolVaultTxns = async (
  connection: Connection,
  createKey: string,
  tokenList: TokenInfo[],
): Promise<SolVaultTxnType[]> => {
  const vaultKey = new PublicKey(createKey)

  const [multisigPda] = multisig.getMultisigPda({
    createKey: vaultKey,
  })

  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda)

  const info = multisigAccount.pretty()

  const txns: SolVaultTxnType[] = []

  for (let i = 0; i < Number(info.transactionIndex); i++) {
    const index = i + 1

    const [txnPda] = multisig.getTransactionPda({
      multisigPda,
      index: BigInt(index),
    })

    const vaultTxn = await multisig.accounts.VaultTransaction.fromAccountAddress(connection, txnPda)
    const message = vaultTxn.pretty().message

    const [proposalPda] = multisig.getProposalPda({
      multisigPda,
      transactionIndex: BigInt(index),
    })

    const proposal = await multisig.accounts.Proposal.fromAccountAddress(connection, proposalPda)
    const decodedAction = await decodeVaultTxn(message, connection)

    const txnSummary = getVaultTxnSummary({
      txnstatus: proposal.status.__kind,
      threshold: info.threshold,
      totalApproved: proposal.approved.length,
      txnId: index,
      //@ts-ignore
      timestamp: proposal.status['timestamp'].toString(),
      vaultAddress: multisigPda.toBase58(),
      txn: decodedAction,
      tokenList,
    })

    const txnDetails = getVaultTxnDetails(txnSummary!, multisigPda.toString())
    txns.push({
      index,
      createKey,
      decodedAction,
      type: 'SEND',
      threshold: info.threshold,
      status: proposal.status.__kind,
      //@ts-ignore
      timestamp: proposal.status['timestamp'].toString(),
      approved: proposal.approved.map((i) => {
        return i.toBase58()
      }),
      rejected: proposal.rejected.map((i) => {
        return i.toBase58()
      }),
      cancelled: proposal.cancelled.map((i) => {
        return i.toBase58()
      }),
      txnSummary: txnSummary ? txnSummary : undefined,
      txnDetails: txnDetails ? txnDetails : undefined,
    })
  }

  return txns.sort((item1, item2) => {
    return Number(item2.timestamp) - Number(item1.timestamp)
  })
}

export const decodeVaultTxn = async (
  message: multisig.generated.VaultTransactionMessage,
  connection: Connection,
): Promise<TransferDecodedTxn | undefined> => {
  const tokenTxn = await parseTokenTransferTxn(message, connection)
  if (tokenTxn) {
    return tokenTxn
  }

  const solTxn = parseSolTransferTxn(message)
  if (solTxn) {
    return solTxn
  }
  return undefined
}

const parseTokenTransferTxn = async (message: multisig.generated.VaultTransactionMessage, connection: Connection) => {
  for (const instruction of message.instructions) {
    try {
      const decodedTxn = transferInstructionData.decode(instruction.data)
      const source = message.accountKeys[instruction.accountIndexes[0]]
      const destination = message.accountKeys[instruction.accountIndexes[1]]
      const programId = message.accountKeys[instruction.programIdIndex].toString()

      const tokenAccount = await getAccount(connection, source, undefined, new PublicKey(programId))
      const destinationResp = await getAccount(connection, destination, undefined, new PublicKey(programId))

      const payload: TransferDecodedTxn = {
        type: 'TOKEN_TRANSFER',
        programId: tokenAccount.mint.toBase58(),
        amount: decodedTxn.amount.toString(),
        to: destinationResp.owner.toBase58(),
      }
      return payload
    } catch (ss) {}
  }
}

const parseSolTransferTxn = (message: multisig.generated.VaultTransactionMessage) => {
  for (const instruction of message.instructions) {
    const programId = message.accountKeys[instruction.programIdIndex].toString()

    if (programId === '11111111111111111111111111111111') {
      const dataBuffer = Buffer.from(instruction.data)
      const instructionType = dataBuffer[0]
      if (instructionType === 2) {
        const lamports = dataBuffer.readBigUInt64LE(4)

        const destinationAccount = message.accountKeys[instruction.accountIndexes[1]]

        const payload: TransferDecodedTxn = {
          type: 'SOL_TRANSFER',
          amount: lamports.toString(),
          to: destinationAccount.toBase58(),
        }

        return payload
      }
    }
  }
}

const getVaultTxnDetails = (summary: TransactionSummary, safeAddress: string) => {
  if (!summary) {
    return null
  }
  const details: TransactionDetails = {
    safeAddress: safeAddress,
    txId: summary.id,
    txStatus: summary.txStatus,
    txInfo: summary.txInfo,
  }
  return details
}
const getVaultTxnSummary = ({
  txnstatus,
  threshold,
  totalApproved,
  txnId,
  timestamp,
  vaultAddress,
  txn,
  tokenList,
}: {
  txnstatus: SolTxnStatusType
  threshold: number
  totalApproved: number
  txnId: number
  timestamp: number
  vaultAddress: string
  tokenList: TokenInfo[]
  txn?: TransferDecodedTxn
}) => {
  let status: TransactionStatus

  if (!txn) {
    return null
  }
  switch (txnstatus) {
    case 'Active':
      if (totalApproved > threshold) {
        status = TransactionStatus.AWAITING_EXECUTION
      } else {
        status = TransactionStatus.AWAITING_CONFIRMATIONS
      }
      break
    case 'Cancelled':
      status = TransactionStatus.CANCELLED
      break
    case 'Approved':
    case 'Executed':
      status = TransactionStatus.SUCCESS
      break
    case 'Rejected':
      status = TransactionStatus.FAILED
      break
  }

  let token: TokenInfo | undefined = tokenList.find((token) => {
    if (txn.type === 'SOL_TRANSFER') {
      return token.address === '0x0000000000000000000000000000000000000000'
    } else {
      return txn.programId === token.address
    }
  })

  let humanDescription = '-'

  if (token === undefined) {
    token = {
      type: 'TOKEN',
      address: txn.programId!,
      decimals: 9,
      symbol: 'Unknown Token',
      name: 'Unknown Token',
      logoUri: '',
    }
  } else {
    humanDescription = `Transfer ${Number(txn.amount) / 10 ** token.decimals} ${token.symbol} To ${txn.to}`
  }
  const summary: TransactionSummary = {
    id: txnId.toString(),
    timestamp: Number(timestamp) * 1000,
    txStatus: status!,
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      sender: {
        value: vaultAddress,
        name: '',
        logoUri: undefined,
      },
      recipient: {
        value: txn.to,
        name: '',
        logoUri: undefined,
      },
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        type: txn.type === 'SOL_TRANSFER' ? TransactionTokenType.NATIVE_COIN : TransactionTokenType.ERC20,
        tokenAddress: token.address,
        tokenName: token.name,
        tokenSymbol: token.symbol,
        logoUri: token.logoUri,
        decimals: token.decimals,
        value: txn.amount,
        trusted: true,
        imitation: false,
      },
      humanDescription,
      richDecodedInfo: undefined,
    },
    txHash: null,
  }
  return summary
}
