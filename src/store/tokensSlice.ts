import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from './common'

export type TokenInfo = {
  type: 'TOKEN' | 'NFT' | 'NATIVE_TOKEN'
  address: string
  decimals: number
  symbol: string
  name: string
  logoUri: string
}

export type TokenSliceType = {
  items: TokenInfo[]
}

export const initTokensSlice: TokenSliceType = {
  items: [],
}

const { slice, selector } = makeLoadableSlice('tokens', initTokensSlice)

export const tokenSlice = slice
export const selectTokensSelector = selector

export const selectTokens = createSelector(selectTokensSelector, (tokenSlice): TokenInfo[] => tokenSlice.data.items)
