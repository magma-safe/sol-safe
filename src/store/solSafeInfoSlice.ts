import { makeLoadableSlice } from './common'

export type SafeInfo = {
  address: string
  chainId: string
  nonce: number
  threshold: number
  owners: string[]
}
export type ExtendedSafeInfo = SafeInfo & { deployed: boolean }

export const defaultSolSafeInfo: ExtendedSafeInfo = {
  address: '',
  chainId: '',
  nonce: -1,
  threshold: 0,
  owners: [],
  deployed: true,
}

const { slice, selector } = makeLoadableSlice('safeInfo', undefined as ExtendedSafeInfo | undefined)

export const safeSolInfoSlice = slice
export const selectSolSafeInfo = selector
