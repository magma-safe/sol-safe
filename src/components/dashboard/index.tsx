import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement } from 'react'
import { Grid } from '@mui/material'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import css from './styles.module.css'
import { InconsistentSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/InconsistentSignerSetupWarning'


const Dashboard = (): ReactElement => {


  const { safe } = useSafeInfo()

  return (
    <>
      <Grid container spacing={3}>
        {/* {supportsRecovery && <RecoveryHeader />} */}

        <Grid item xs={12}>
          <InconsistentSignerSetupWarning />
        </Grid>

        <Grid item xs={12}>
          <Overview />
        </Grid>

        <Grid item xs={12} className={css.hideIfEmpty}>
          <FirstSteps />
        </Grid>

        {safe.deployed && (
          <>

            <Grid item xs={12} />

            <Grid item xs={12} lg={6}>
              <AssetsWidget />
            </Grid>

            <Grid item xs={12} lg={6}>
              <PendingTxsList />
            </Grid>




          </>
        )}
      </Grid>
    </>
  )
}

export default Dashboard
