import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parsePrefixedAddress } from '@/utils/addresses'
import { useAppSelector } from '@/store'

const useSafeAddress = (): string => {
  const router = useRouter()
  const { safe = '' } = router.query
  const fullAddress = Array.isArray(safe) ? safe[0] : safe

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return checksummedAddress
}

export const useSafeCreateKey = (): string => {
  const safeAddress = useSafeAddress()

  const safes = useAppSelector((state) => {
    return state.solSafeSlice.safes
  })
  const createKey = useMemo(() => {
    if (!safeAddress || !safes) return ''

    const safe = safes.find((s) => {
      return s.safeAddress.toLowerCase() === safeAddress.toLowerCase()
    })
    if (safe) {
      return safe.createKey
    }
    return ''
  }, [safeAddress, safes])

  return createKey
}

export default useSafeAddress
