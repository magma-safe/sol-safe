import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { useContext } from 'react'

const useIsSwapFeatureEnabled = () => {
  // const isBlockedCountry = useContext(GeoblockingContext)
  return false
}

export default useIsSwapFeatureEnabled
