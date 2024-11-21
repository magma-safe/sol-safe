import useIsExpiredSwap from '@/features/swap/hooks/useIsExpiredSwap'
import React, { type ReactElement, useEffect } from 'react'
import type { TransactionDetails, TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, CircularProgress, Typography } from '@mui/material'

import TxSigners from '@/components/transactions/TxSigners'
import Summary from '@/components/transactions/TxDetails/Summary'
import TxData from '@/components/transactions/TxDetails/TxData'
import useChainId from '@/hooks/useChainId'
import {
  isAwaitingExecution,
  isOrderTxInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isMultisigDetailedExecutionInfo,
  isMultisigExecutionInfo,
  isOpenSwapOrder,
  isTxQueued,
} from '@/utils/transaction-guards'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import css from './styles.module.css'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxShareLink from '../TxShareLink'
import { ErrorBoundary } from '@sentry/react'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import SignTxButton from '@/components/transactions/SignTxButton'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import { UnsignedWarning } from '@/components/transactions/Warning'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsPending from '@/hooks/useIsPending'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { asError } from '@/services/exceptions/utils'
import { POLLING_INTERVAL } from '@/config/constants'

export const NOT_AVAILABLE = 'n/a'

type TxDetailsProps = {
  txSummary: TransactionSummary
  txDetails: TransactionDetails
}

const TxDetailsBlock = ({ txSummary, txDetails }: TxDetailsProps): ReactElement => {
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const isQueue = isTxQueued(txSummary.txStatus)
  const isUnsigned =
    isMultisigExecutionInfo(txSummary.executionInfo) && txSummary.executionInfo.confirmationsSubmitted === 0


  // If we have no token list we always trust the transfer
  const isTrustedTransfer = !hasDefaultTokenlist || isTrustedTx(txSummary)
  const isImitationTransaction = isImitation(txSummary)

  let proposer, safeTxHash
  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    proposer = txDetails.detailedExecutionInfo.proposer?.value
    safeTxHash = txDetails.detailedExecutionInfo.safeTxHash
  }



  return (
    <>
      {/* /Details */}
      <div className={`${css.details} ${isUnsigned ? css.noSigners : ''}`}>
        <div className={css.shareLink}>
          <TxShareLink id={txSummary.id} />
        </div>

        <div className={css.txData}>
          <ErrorBoundary fallback={<div>Error parsing data</div>}>
            <TxData txDetails={txDetails} trusted={isTrustedTransfer} imitation={isImitationTransaction} />
          </ErrorBoundary>
        </div>

        {/* Module information*/}
        {/* {moduleAddress && (
          <div className={css.txModule}>
            <InfoDetails title="Executed via module:">
              <NamedAddressInfo
                address={moduleAddress.value}
                name={moduleAddressInfo?.name || moduleAddress.name}
                customAvatar={moduleAddressInfo?.logoUri || moduleAddress.logoUri}
                shortAddress={false}
                showCopyButton
                hasExplorer
              />
            </InfoDetails>
          </div>
        )} */}

        {/* <div className={css.txSummary}>
          {isUntrusted && !isPending && <UnsignedWarning />}
          <Summary txDetails={txDetails} />
        </div> */}

        {/* {(isMultiSendTxInfo(txDetails.txInfo) || isOrderTxInfo(txDetails.txInfo)) && (
          <div className={css.multiSend}>
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              <Multisend txData={txDetails.txData} />
            </ErrorBoundary>
          </div>
        )} */}
      </div>

      {/* Signers */}
      {!isUnsigned && (
        <div className={css.txSigners}>
          <TxSigners txDetails={txDetails} txSummary={txSummary} />

          {isQueue && (
            <Box className={css.buttons}>
              <SignTxButton txSummary={txSummary} />
              <RejectTxButton txSummary={txSummary} safeTxHash={safeTxHash} proposer={proposer} />
            </Box>
          )}
          {/* 
          {isQueue && expiredSwap && (
            <Typography color="text.secondary" mt={2}>
              This order has expired. Reject this transaction and try again.
            </Typography>
          )} */}
        </div>
      )}
    </>
  )
}

const TxDetails = ({
  txSummary,
  txDetails,
}: {
  txSummary: TransactionSummary
  txDetails?: TransactionDetails // optional
}): ReactElement => {

  return (
    <div className={css.container}>


      <TxDetailsBlock txSummary={txSummary} txDetails={txDetails!} />
    </div>
  )
}

export default TxDetails