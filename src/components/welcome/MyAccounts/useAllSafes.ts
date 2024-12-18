import { useMemo, useState } from 'react'
import uniq from 'lodash/uniq'
import isEmpty from 'lodash/isEmpty'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import useAllOwnedSafes from './useAllOwnedSafes'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { selectAllSolSafes, selectTotalSolAdded, selectUndeployedSafes } from '@/store/slices'

// import { cookies } from 'next/headers'

import { sameAddress } from '@/utils/addresses'
export type SafeItem = {
  chainId?: string
  address: string
  linkedAddress?: string
  isWatchlist: boolean
}

export type SafeItems = SafeItem[]

const useAddedSafes = () => {
  const allAdded = useAppSelector(selectAllAddedSafes)
  return allAdded
}

export const useHasSafes = () => {
  const { address = '' } = useWallet() || {}
  const allAdded = useAddedSafes()
  const hasAdded = !isEmpty(allAdded)
  const [allOwned] = useAllOwnedSafes(!hasAdded ? address : '') // pass an empty string to not fetch owned safes

  if (hasAdded) return { isLoaded: true, hasSafes: hasAdded }
  if (!allOwned) return { isLoaded: false }

  const hasOwned = !isEmpty(Object.values(allOwned).flat())
  return { isLoaded: true, hasSafes: hasOwned }
}

export const useAllSolanaSafes = () => {
  const allSafesSelector = useAppSelector(selectAllSolSafes)

  return useMemo(() => {
    return allSafesSelector
  }, [allSafesSelector])
}

const useAllSafes = (): SafeItems | undefined => {
  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned, , allOwnedLoading] = useAllOwnedSafes(walletAddress)
  const allAdded = useAddedSafes()
  const { configs } = useChains()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)

  return useMemo<SafeItems | undefined>(() => {
    if (walletAddress && (allOwned === undefined || allOwnedLoading)) {
      return undefined
    }
    const chains = uniq(Object.keys(allAdded).concat(Object.keys(allOwned || {})))

    return chains.flatMap((chainId) => {
      if (!configs.some((item) => item.chainId === chainId)) return []
      const addedOnChain = Object.keys(allAdded[chainId] || {})
      const ownedOnChain = (allOwned || {})[chainId]
      const undeployedOnChain = Object.keys(undeployedSafes[chainId] || {})
      const uniqueAddresses = uniq(addedOnChain.concat(ownedOnChain)).filter(Boolean)

      return uniqueAddresses.map((address) => {
        const owners = allAdded?.[chainId]?.[address]?.owners
        const isOwner = owners?.some(({ value }) => sameAddress(walletAddress, value))
        const isUndeployed = undeployedOnChain.includes(address)
        const isOwned = (ownedOnChain || []).includes(address) || isOwner
        return {
          address,
          chainId,
          isWatchlist: !isOwned && !isUndeployed,
        }
      })
    })
  }, [allAdded, allOwned, allOwnedLoading, configs, undeployedSafes, walletAddress])
}

export default useAllSafes
