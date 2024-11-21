import type { NamedAddress } from '@/components/new-safe/create/types'
import SolHashInfo from '@/components/common/EthHashInfo/SolHashInfo'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import { getTotalFeeFormatted } from '@/hooks/useGasPrice'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'



import {
  createNewUndeployedSafeWithoutSalt,
} from '@/components/new-safe/create/logic'
import css from '@/components/new-safe/create/steps/ReviewStep/styles.module.css'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import ReviewRow from '@/components/new-safe/ReviewRow'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExecutionMethod } from '@/components/tx/ExecutionMethodSelector'
import PayNowPayLater, { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useGasPrice from '@/hooks/useGasPrice'
import { useLeastRemainingRelays } from '@/hooks/useRemainingRelays'
import useWalletCanPay from '@/hooks/useWalletCanPay'
import useWallet from '@/hooks/wallets/useWallet'

import { FEATURES } from '@/utils/chains'
import { hasRemainingRelays } from '@/utils/relaying'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, CircularProgress, Divider, Grid, Tooltip, Typography } from '@mui/material'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'

import { AppRoutes } from '@/config/routes'
import useCreateSolSafe from '@/hooks/useCreateSolSafe'
import { useAppDispatch } from '@/store'
import { addOrUpdateSolSafe } from '@/store/solsafesSlice'


export const NetworkFee = ({
  totalFee,
  chain,
  isWaived,
  inline = false,
}: {
  totalFee: string
  chain: ChainInfo | undefined
  isWaived: boolean
  inline?: boolean
}) => {
  return (
    <Box className={classnames(css.networkFee, { [css.networkFeeInline]: inline })}>
      <Typography className={classnames({ [css.strikethrough]: isWaived })}>
        <b>
          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
        </b>
      </Typography>
    </Box>
  )
}

export const SafeSetupOverview = ({
  name,
  owners,
  threshold,
  networks,
}: {
  name?: string
  owners: NamedAddress[]
  threshold: number
  networks: ChainInfo[]
}) => {
  return (
    <Grid container spacing={3}>
      <ReviewRow
        name={networks.length > 1 ? 'Networks' : 'Network'}
        value={
          <Tooltip
            title={
              <Box>
                {networks.map((safeItem) => (
                  <Box p="4px 0px" key={safeItem.chainId}>
                    <ChainIndicator chainId={safeItem.chainId} />
                  </Box>
                ))}
              </Box>
            }
            arrow
          >
            <Box display="inline-block">
              <NetworkLogosList networks={networks} />
            </Box>
          </Tooltip>
        }
      />
      {name && <ReviewRow name="Name" value={<Typography>{name}</Typography>} />}
      <ReviewRow
        name="Signers"
        value={
          <Box data-testid="review-step-owner-info" className={css.ownersArray}>
            {owners.map((owner, index) => (
              <SolHashInfo
                address={owner.address}
                name={owner.name || owner.ens}
                shortAddress={false}
                showPrefix={false}
                showName
                hasExplorer
                showCopyButton
                key={index}
              />
            ))}
          </Box>
        }
      />
      <ReviewRow
        name="Threshold"
        value={
          <Typography>
            {threshold} out of {owners.length} {owners.length > 1 ? 'signers' : 'signer'}
          </Typography>
        }
      />
    </Grid>
  )
}

const ReviewStep = ({ data, onSubmit, onBack, setStep }: StepRenderProps<NewSafeFormData>) => {
  useSyncSafeCreationStep(setStep, data.networks)
  const chain = useCurrentChain()
  const wallet = useWallet()
  const router = useRouter()
  const [gasPrice] = useGasPrice()
  const [payMethod, setPayMethod] = useState(PayMethod.PayLater)
  const [executionMethod] = useState(ExecutionMethod.RELAY)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>()
  const isCounterfactualEnabled = useHasFeature(FEATURES.COUNTERFACTUAL)

  const ownerAddresses = useMemo(() => data.owners.map((owner) => owner.address), [data.owners])
  const [minRelays] = useLeastRemainingRelays(ownerAddresses)

  const isMultiChainDeployment = data.networks.length > 1

  // Every owner has remaining relays and relay method is selected
  const canRelay = hasRemainingRelays(minRelays)
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

  const newSafeProps = useMemo(
    () =>
      chain
        ? createNewUndeployedSafeWithoutSalt(
          data.safeVersion,
          {
            owners: data.owners.map((owner) => owner.address),
            threshold: data.threshold,
          },
          chain,
        )
        : undefined,
    [chain, data.owners, data.safeVersion, data.threshold],
  )

  const safePropsForGasEstimation = useMemo(() => {
    return newSafeProps
      ? {
        ...newSafeProps,
        saltNonce: Date.now().toString(),
      }
      : undefined
  }, [newSafeProps])

  // We estimate with a random nonce as we'll just slightly overestimates like this
  const { gasLimit } = useEstimateSafeCreationGas(safePropsForGasEstimation, data.safeVersion)
  const dispatch = useAppDispatch()

  const maxFeePerGas = gasPrice?.maxFeePerGas

  const walletCanPay = useWalletCanPay({ gasLimit, maxFeePerGas })

  const totalFee = getTotalFeeFormatted(maxFeePerGas, gasLimit, chain)

  const { createSolSafe } = useCreateSolSafe()

  const handleBack = () => {
    onBack(data)
  }




  const handleCreateSafeClick = async () => {
    try {
      if (!wallet || !chain || !newSafeProps) return

      setIsCreating(true)

      const safeAddress = await createSolSafe({ threshold: data.threshold, owners: data.owners })

      await router?.push({
        pathname: AppRoutes.home,
        query: { safe: `${safeAddress}` },
      })

    } catch (err) {
      console.error(err)
      setSubmitError('Error creating the Safe Account. Please try again later.')
    } finally {
      setIsCreating(false)
    }
  }


  const isDisabled = isCreating

  return (
    <>
      <Box className={layoutCss.row}>
        <SafeSetupOverview name={data.name} owners={data.owners} threshold={data.threshold} networks={data.networks} />
      </Box>

      {isCounterfactualEnabled && (
        <>
          <Divider />
          <Box className={layoutCss.row}>
            <PayNowPayLater
              totalFee={totalFee}
              isMultiChain={isMultiChainDeployment}
              canRelay={canRelay}
              payMethod={payMethod}
              setPayMethod={setPayMethod}
            />

            {/* {canRelay && payMethod === PayMethod.PayNow && (
              <>
                <Grid container spacing={3} pt={2}>
                  <ReviewRow
                    value={
                      <ExecutionMethodSelector
                        executionMethod={executionMethod}
                        setExecutionMethod={setExecutionMethod}
                        relays={minRelays}
                      />
                    }
                  />
                </Grid>
              </>
            )} */}

            {/* {showNetworkWarning && (
              <Box sx={{ '&:not(:empty)': { mt: 3 } }}>
                <NetworkWarning action="create a Safe Account" />
              </Box>
            )} */}

            {payMethod === PayMethod.PayNow && (
              <Grid item>
                <Typography component="div" mt={2}>
                  You will have to confirm a transaction and pay an estimated fee of{' '}
                  <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} inline /> with your connected
                  wallet
                </Typography>
              </Grid>
            )}
          </Box>
        </>
      )}

      {!isCounterfactualEnabled && (
        <>
          <Divider />
          <Box className={layoutCss.row} display="flex" flexDirection="column" gap={3}>
            {/* {canRelay && (
              <Grid container spacing={3}>
                <ReviewRow
                  name="Execution method"
                  value={
                    <ExecutionMethodSelector
                      executionMethod={executionMethod}
                      setExecutionMethod={setExecutionMethod}
                      relays={minRelays}
                    />
                  }
                />
              </Grid>
            )} */}

            <Grid data-testid="network-fee-section" container spacing={3}>
              <ReviewRow
                name="Est. network fee"
                value={
                  <>
                    <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} />

                    {!willRelay && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        You will have to confirm a transaction with your connected wallet.
                      </Typography>
                    )}
                  </>
                }
              />
            </Grid>


            {!walletCanPay && !willRelay && (
              <ErrorMessage>
                Your connected wallet doesn&apos;t have enough funds to execute this transaction
              </ErrorMessage>
            )}
          </Box>
        </>
      )}

      <Divider />

      <Box className={layoutCss.row}>
        {submitError && <ErrorMessage className={css.errorMessage}>{submitError}</ErrorMessage>}
        <Box display="flex" flexDirection="row" justifyContent="space-between" gap={3}>
          <Button
            data-testid="back-btn"
            variant="outlined"
            size="small"
            onClick={handleBack}
            startIcon={<ArrowBackIcon fontSize="small" />}
          >
            Back
          </Button>
          <Button
            data-testid="review-step-next-btn"
            onClick={handleCreateSafeClick}
            variant="contained"
            size="stretched"
            disabled={isDisabled}
          >
            {isCreating ? <CircularProgress size={18} /> : 'Create Account'}
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default ReviewStep
