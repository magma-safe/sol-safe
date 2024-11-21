import { type ReactElement } from 'react'
import type {
  Creation,
  Custom,
  MultiSend,
  SettingsChange,
  TransactionInfo,
  Transfer,
} from '@safe-global/safe-gateway-typescript-sdk'
import { SettingsInfoType, TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import TokenAmount from '@/components/common/TokenAmount'
import {
  isOrderTxInfo,
  isCreationTxInfo,
  isCustomTxInfo,
  isERC20Transfer,
  isERC721Transfer,
  isMultiSendTxInfo,
  isNativeTokenTransfer,
  isSettingsChangeTxInfo,
  isTransferTxInfo,
  isMigrateToL2TxInfo,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
} from '@/utils/transaction-guards'
import { ellipsis, shortenAddress } from '@/utils/formatters'
import { useCurrentChain } from '@/hooks/useChains'
import { SwapTx } from '@/features/swap/components/SwapTxInfo/SwapTx'
import StakingTxExitInfo from '@/features/stake/components/StakingTxExitInfo'
import StakingTxWithdrawInfo from '@/features/stake/components/StakingTxWithdrawInfo'
import { Box } from '@mui/material'
import css from './styles.module.css'
import StakingTxDepositInfo from '@/features/stake/components/StakingTxDepositInfo'
import { SolVaultTxnType } from '@/utils/solvaulthelper'
import { useAppSelector } from '@/store'

export const TransferTx = ({
  item,
  omitSign = false,
  withLogo = true,
  preciseAmount = false,
}: {
  item: SolVaultTxnType
  omitSign?: boolean
  withLogo?: boolean
  preciseAmount?: boolean
}): ReactElement => {
  // const chainConfig = useCurrentChain()
  // const { nativeCurrency } = chainConfig || {}
  // const transfer = info.transferInfo
  // const direction = omitSign ? undefined : info.direction

  const tokens = useAppSelector((state) => { return state.tokens.data.items })

  if (item.decodedAction && item.decodedAction.type === "SOL_TRANSFER") {
    return (
      <TokenAmount
        direction={item.type === "SEND" ? TransferDirection.OUTGOING : TransferDirection.INCOMING}
        value={item.decodedAction.amount}
        decimals={9}
        tokenSymbol={"SOL"}
        logoUri={"https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png"}
        preciseAmount={preciseAmount}
      />
    )
  } else if (item.decodedAction && item.decodedAction.type === "TOKEN_TRANSFER") {

    const token = tokens.find((i: any) => {
      return i.address === item.decodedAction?.programId
    })
    if (!token) {
      return <></>
    }
    return (
      <TokenAmount
        direction={item.type === "SEND" ? TransferDirection.OUTGOING : TransferDirection.INCOMING}
        value={item.decodedAction.amount}
        decimals={token?.decimals}
        tokenSymbol={token?.symbol}
        logoUri={token?.logoUri}
        preciseAmount={preciseAmount}
      />
    )
  }

  // if (isERC20Transfer(transfer)) {
  //   return (
  //     <TokenAmount
  //       {...transfer}
  //       direction={direction}
  //       logoUri={withLogo ? transfer?.logoUri : undefined}
  //       preciseAmount={preciseAmount}
  //     />
  //   )
  // }

  // if (isERC721Transfer(transfer)) {
  //   return (
  //     <TokenAmount
  //       {...transfer}
  //       tokenSymbol={ellipsis(
  //         `${transfer.tokenSymbol ? transfer.tokenSymbol : 'Unknown NFT'} #${transfer.tokenId}`,
  //         withLogo ? 16 : 100,
  //       )}
  //       value="1"
  //       decimals={0}
  //       direction={undefined}
  //       logoUri={withLogo ? transfer?.logoUri : undefined}
  //       fallbackSrc="/images/common/nft-placeholder.png"
  //     />
  //   )
  // }

  return <></>
}

const CustomTx = ({ info }: { info: Custom }): ReactElement => {
  return <Box className={css.txInfo}>{info.methodName}</Box>
}

const CreationTx = ({ info }: { info: Creation }): ReactElement => {
  return <Box className={css.txInfo}>Created by {shortenAddress(info.creator.value)}</Box>
}

const MultiSendTx = ({ info }: { info: MultiSend }): ReactElement => {
  return (
    <Box className={css.txInfo}>
      {info.actionCount} {`action${info.actionCount > 1 ? 's' : ''}`}
    </Box>
  )
}

const SettingsChangeTx = ({ info }: { info: SettingsChange }): ReactElement => {
  if (
    info.settingsInfo?.type === SettingsInfoType.ENABLE_MODULE ||
    info.settingsInfo?.type === SettingsInfoType.DISABLE_MODULE
  ) {
    return <Box className={css.txInfo}>{info.settingsInfo.module.name}</Box>
  }
  return <></>
}

const MigrationToL2Tx = (): ReactElement => {
  return <>Migrate base contract</>
}

const SolTxInfo = ({ item, ...rest }: { item: SolVaultTxnType; omitSign?: boolean; withLogo?: boolean }): ReactElement => {

  // if (isSettingsChangeTxInfo(info)) {
  //   return <SettingsChangeTx info={info} />
  // }

  // if (isMultiSendTxInfo(info)) {
  //   return <MultiSendTx info={info} />
  // }

  if (item.type === "SEND") {
    return <TransferTx item={item} {...rest} />
  }

  // if (isMigrateToL2TxInfo(info)) {
  //   return <MigrationToL2Tx />
  // }

  // if (isCreationTxInfo(info)) {
  //   return <CreationTx info={info} />
  // }

  // if (isOrderTxInfo(info)) {
  //   return <SwapTx info={info} />
  // }

  // if (isStakingTxDepositInfo(info)) {
  //   return <StakingTxDepositInfo info={info} />
  // }

  // if (isStakingTxExitInfo(info)) {
  //   return <StakingTxExitInfo info={info} />
  // }

  // if (isStakingTxWithdrawInfo(info)) {
  //   return <StakingTxWithdrawInfo info={info} />
  // }

  // if (isCustomTxInfo(info)) {
  //   return <CustomTx info={info} />
  // }

  return <></>
}

export default SolTxInfo
