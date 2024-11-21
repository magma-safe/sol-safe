
import type { SafeOverview } from '@safe-global/safe-gateway-typescript-sdk'
import { useMemo } from 'react'
import { ListItemButton, Typography, } from '@mui/material'
import Link from 'next/link'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'

import css from './styles.module.css'

import SafeListContextMenu from '@/components/sidebar/SafeListContextMenu'
import useSafeAddress from '@/hooks/useSafeAddress'

import classnames from 'classnames'
import { useRouter } from 'next/router'

import QueueActions from './QueueActions'
import { useGetHrefSol } from './useGetHref'

import { SolSafeItem } from '@/types/safetypes'
type AccountItemProps = {
  safeItem: SolSafeItem
  safeOverview?: SafeOverview
  onLinkClick?: () => void
}

const AccountItem = ({ onLinkClick, safeItem }: AccountItemProps) => {
  const { safeAddress: solSafeAddress, linkedAddress, createKey } = safeItem
  const router = useRouter()
  const isWelcomePage = router.pathname === AppRoutes.welcome.accounts

  const trackingLabel = isWelcomePage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const getHref = useGetHrefSol(router)

  const href = useMemo(() => {
    return getHref(solSafeAddress)
  }, [getHref, solSafeAddress])


  // const isActivating = undeployedSafe?.status.status !== 'AWAITING_EXECUTION'


  // const isReplayable =
  //   addNetworkFeatureEnabled &&
  //   !safeItem.isWatchlist &&
  //   (!undeployedSafe || !isPredictedSafeProps(undeployedSafe.props))

  // const { data: safeOverview } = useGetSafeOverviewQuery(
  //   undeployedSafe
  //     ? skipToken
  //     : {
  //       chainId: safeItem.chainId,
  //       safeAddress: safeItem.address,
  //       walletAddress,
  //     },
  // )


  return (
    <ListItemButton
      data-testid="safe-list-item"
      selected={false}
      className={classnames(css.listItem, { [css.currentListItem]: false })}
    >
      <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
        <Link onClick={onLinkClick} href={href} className={css.safeLink}>


          <Typography variant="body2" component="div" >


            <Typography variant="subtitle2" component="p" fontWeight="bold" >
              {solSafeAddress}
            </Typography> <br />
            <Typography color="var(--color-primary-light)" component="span" fontSize="inherit">

              By:{linkedAddress}
            </Typography> <br />


            <Typography color="var(--color-primary-light)" component="span" fontSize="inherit">

              Create Key:{createKey}
            </Typography>




          </Typography>


        </Link>
      </Track>

      <SafeListContextMenu name={"remove"} address={solSafeAddress} chainId={"1"} addNetwork={false} remove />

      <QueueActions
        queued={0}
        awaitingConfirmation={0}
        safeAddress={solSafeAddress}
        chainShortName={"SOL"}
      />
    </ListItemButton>
  )
}

export default AccountItem
