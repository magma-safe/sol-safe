import ActivateAccountButton from '@/features/counterfactual/ActivateAccountButton'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { type ReactElement, useContext } from 'react'
import Button from '@mui/material/Button'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'

const NewTxButton = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const onClick = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent({ ...OVERVIEW_EVENTS.NEW_TRANSACTION, label: 'sidebar' })
  }

  if (isCounterfactualSafe) {
    return <ActivateAccountButton />
  }

  return (
    <Button
      data-testid="new-tx-btn"
      onClick={onClick}
      variant="contained"
      size="small"
      fullWidth
      disableElevation
      sx={{ py: 1.3 }}
    >
      New transaction
    </Button>
  )
}

export default NewTxButton