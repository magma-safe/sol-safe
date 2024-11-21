import { type ReactElement, type ReactNode, useState, useCallback, useEffect, useMemo } from 'react'
import { Paper, Typography } from '@mui/material'
import AccountItem from './AccountItem'
import { type SafeItem } from './useAllSafes'
import css from './styles.module.css'
import InfiniteScroll from '@/components/common/InfiniteScroll'
import { type MultiChainSafeItem } from './useAllSafesGrouped'
import MultiAccountItem from './MultiAccountItem'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { SolSafeItem } from '@/types/safetypes'

type PaginatedSafeListProps = {
  safes?: (SolSafeItem)[]
  title: ReactNode
  noSafesMessage?: ReactNode
  action?: ReactElement
  onLinkClick?: () => void
}

type SafeListPageProps = {
  safes: SolSafeItem[]
  onLinkClick: PaginatedSafeListProps['onLinkClick']
}


type SolSafeListPageProps = {
  safes: (SolSafeItem)[]
  onLinkClick: PaginatedSafeListProps['onLinkClick']
}
const DEFAULT_PAGE_SIZE = 10

export const SafeListPage = ({ safes, onLinkClick }: SafeListPageProps) => {
  return (
    <>
      {safes.map((item) =>
        // isMultiChainSafeItem(item) ? (
        //   <MultiAccountItem onLinkClick={onLinkClick} key={item.address} multiSafeAccountItem={item} />
        // ) : (
        //   <AccountItem onLinkClick={onLinkClick} safeItem={item} key={item.chainId + item.address} />
        // ),
        <AccountItem onLinkClick={onLinkClick} safeItem={item} key={item.safeAddress} />

      )}
    </>
  )
}

const AllSafeListPages = ({
  safes,
  onLinkClick,
  pageSize = DEFAULT_PAGE_SIZE,
}: SolSafeListPageProps & { pageSize?: number }) => {
  const totalPages = Math.ceil(safes.length / pageSize)
  const [pages, setPages] = useState<(SolSafeItem | MultiChainSafeItem)[][]>([])

  const onNextPage = useCallback(() => {
    setPages((prev) => {
      const pageIndex = prev.length
      const nextPage = safes.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
      return prev.concat([nextPage])
    })
  }, [safes, pageSize])

  useEffect(() => {
    if (safes.length > 0) {
      setPages([safes.slice(0, pageSize)])
    }
  }, [safes, pageSize])

  return (
    <>
      {pages.map((pageSafes, index) => (
        <SafeListPage key={index} safes={pageSafes as SolSafeItem[]} onLinkClick={onLinkClick} />
      ))}

      {totalPages > pages.length && <InfiniteScroll onLoadMore={onNextPage} key={pages.length} />}
    </>
  )
}

const PaginatedSafeList = ({ safes, title, action, noSafesMessage, onLinkClick }: PaginatedSafeListProps) => {

  const totalSafes = safes ? safes.length : 0

  return (
    <Paper className={css.safeList}>
      <div className={css.listHeader}>
        <Typography variant="h5" fontWeight={700} mb={2} className={css.listTitle}>
          {title}

          {safes && safes.length > 0 && (
            <Typography component="span" color="var(--color-primary-light)" fontSize="inherit" fontWeight="normal">
              {' '}
              ({safes.length})
            </Typography>
          )}
        </Typography>

        {action}
      </div>

      {totalSafes > 0 ? (
        <>

          <AllSafeListPages safes={safes ? safes : []} onLinkClick={onLinkClick} pageSize={10} />
        </>
      ) : (
        <Typography
          component="div"
          variant="body2"
          color="text.secondary"
          textAlign="center"
          py={3}
          mx="auto"
          width={250}
        >
          {noSafesMessage}
        </Typography>
      )}
    </Paper>
  )
}

export default PaginatedSafeList
