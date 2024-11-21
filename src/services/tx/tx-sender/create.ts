import { getReadOnlyGnosisSafeContract } from '@/services/contracts/safeContracts'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { ChainInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { AddOwnerTxParams, RemoveOwnerTxParams, SwapOwnerTxParams } from '@safe-global/protocol-kit'
import type { MetaTransactionData, SafeTransaction, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import extractTxInfo from '../extractTxInfo'
import { getAndValidateSafeSDK } from './sdk'
import { PublicKey, SystemProgram, TransactionInstruction, Connection } from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'

/**
 * Create a transaction from raw params
 */

export const createSolanaTx = async (
  connectedWalletAddress: string,
  connection: Connection,
  vaultAddress: string,
  txParams: SafeTransactionDataPartial,
  nonce?: number,
): Promise<TransactionInstruction[] | undefined> => {
  if (nonce !== undefined) txParams = { ...txParams, nonce }

  const txnData = JSON.parse(txParams.data)
  if (txnData.type === 'soltxn') {
    const instruction = createSolanaTransferTxn(vaultAddress, txParams.to, txParams.value)
    return instruction
  } else if (txnData.type === 'tokenTxn') {
    const instructions = await createSolanaTokenTransferTxn(
      connectedWalletAddress,
      connection,
      vaultAddress,
      txParams.to,
      txParams.value,
      txnData['tokenAddress'],
    )

    return instructions
  }
  return undefined
}

export const createTx = async (txParams: SafeTransactionDataPartial, nonce?: number): Promise<SafeTransaction> => {
  if (nonce !== undefined) txParams = { ...txParams, nonce }

  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createTransaction({ transactions: [txParams] })
}

const createSolanaTransferTxn = (vaultAddress: string, toAddress: string, amount: string) => {
  const vaultKey = new PublicKey(vaultAddress)
  // const [vaultPda] = multisig.getMultisigPda({
  //   createKey,
  // })
  const instruction = SystemProgram.transfer({
    fromPubkey: vaultKey,
    toPubkey: new PublicKey(toAddress),
    lamports: Number(amount),
  })

  return [instruction]
}

const getTokenPDA = async (
  connectedWalletAddress: string,
  tokenAddress: string,
  userAddress: string,
  connection: Connection,
  isVault: boolean,
) => {
  const associatedToken = getAssociatedTokenAddressSync(new PublicKey(tokenAddress), new PublicKey(userAddress), true)

  try {
    const account = await getAccount(connection, associatedToken, undefined, TOKEN_PROGRAM_ID)

    return {
      account: account.address,
      instruction: null,
    }
  } catch (error: unknown) {
    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
      return {
        account: associatedToken,
        instruction: createAssociatedTokenAccountInstruction(
          new PublicKey(connectedWalletAddress),
          associatedToken,
          new PublicKey(userAddress),
          new PublicKey(tokenAddress),
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      }
    } else {
      throw error
    }
  }
}

const createSolanaTokenTransferTxn = async (
  connectedWalletAddress: string,
  connection: Connection,
  vaultAddress: string,
  toAddress: string,
  amount: string,
  tokenAddress: string,
) => {
  try {
    const { account: senderPDA, instruction: senderCreatePDA } = await getTokenPDA(
      connectedWalletAddress,
      tokenAddress,
      vaultAddress,
      connection,
      true,
    )

    const { account: recevierPDA, instruction: recevierCreatePDA } = await getTokenPDA(
      connectedWalletAddress,
      tokenAddress,
      toAddress,
      connection,
      false,
    )

    const instructions: TransactionInstruction[] = []

    if (senderCreatePDA) {
      instructions.push(senderCreatePDA)
    }

    if (recevierCreatePDA) {
      instructions.push(recevierCreatePDA)
    }

    instructions.push(createTransferInstruction(senderPDA, recevierPDA, new PublicKey(vaultAddress), BigInt(amount)))
    return instructions
  } catch (err) {
    console.log('createSolanaTokenTransferTxncreateSolanaTokenTransferTxn', err)
    throw err
  }
}

/**
 * Create a multiSendCallOnly transaction from an array of MetaTransactionData and options
 * If only one tx is passed it will be created without multiSend and without onlyCalls.
 */
export const createMultiSendCallOnlyTx = async (txParams: MetaTransactionData[]): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createTransaction({ transactions: txParams, onlyCalls: true })
}

/**
 * Create a multiSend transaction from an array of MetaTransactionData and options
 * If only one tx is passed it will be created without multiSend and without onlyCalls.
 *
 * This function can create delegateCalls, which is usually not necessary
 */
export const __unsafe_createMultiSendTx = async (txParams: MetaTransactionData[]): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createTransaction({ transactions: txParams, onlyCalls: false })
}

export const createRemoveOwnerTx = async (txParams: RemoveOwnerTxParams): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createRemoveOwnerTx(txParams)
}

export const createAddOwnerTx = async (
  chain: ChainInfo,
  isDeployed: boolean,
  txParams: AddOwnerTxParams,
): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  if (isDeployed) return safeSDK.createAddOwnerTx(txParams)

  const safeVersion = await safeSDK.getContractVersion()

  const contract = await getReadOnlyGnosisSafeContract(chain, safeVersion)
  // @ts-ignore
  const data = contract.encode('addOwnerWithThreshold', [txParams.ownerAddress, txParams.threshold])

  const tx = {
    to: await safeSDK.getAddress(),
    value: '0',
    data,
  }

  return safeSDK.createTransaction({
    transactions: [tx],
  })
}

export const createSwapOwnerTx = async (
  chain: ChainInfo,
  isDeployed: boolean,
  txParams: SwapOwnerTxParams,
): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  if (isDeployed) return safeSDK.createSwapOwnerTx(txParams)

  const safeVersion = await safeSDK.getContractVersion()

  const contract = await getReadOnlyGnosisSafeContract(chain, safeVersion)
  // @ts-ignore SwapOwnerTxParams is a union type and the method expects a specific one
  const data = contract.encode('swapOwner', [SENTINEL_ADDRESS, txParams.oldOwnerAddress, txParams.newOwnerAddress])

  const tx = {
    to: await safeSDK.getAddress(),
    value: '0',
    data,
  }

  return safeSDK.createTransaction({
    transactions: [tx],
  })
}

export const createUpdateThresholdTx = async (threshold: number): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createChangeThresholdTx(threshold)
}

export const createRemoveModuleTx = async (moduleAddress: string): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createDisableModuleTx(moduleAddress)
}

export const createRemoveGuardTx = async (): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createDisableGuardTx()
}

/**
 * Create a rejection tx
 */
export const createRejectTx = async (nonce: number): Promise<SafeTransaction> => {
  const safeSDK = getAndValidateSafeSDK()
  return safeSDK.createRejectionTransaction(nonce)
}

/**
 * Prepare a SafeTransaction from Client Gateway / Tx Queue
 */
export const createExistingTx = async (
  chainId: string,
  safeAddress: string,
  txId: string,
  txDetails?: TransactionDetails,
): Promise<SafeTransaction> => {
  // Get the tx details from the backend if not provided
  txDetails = txDetails || (await getTransactionDetails(chainId, txId))

  // Convert them to the Core SDK tx params
  const { txParams, signatures } = extractTxInfo(txDetails, safeAddress)

  // Create a tx and add pre-approved signatures
  const safeTx = await createTx(txParams, txParams.nonce)
  Object.entries(signatures).forEach(([signer, data]) => {
    safeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
  })

  return safeTx
}
