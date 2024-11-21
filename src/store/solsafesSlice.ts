import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AddressEx, SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { RootState } from '.'
import { SolSafeItem, SolSafeItems } from '@/types/safetypes'

export type SafeState = {
  safes: SolSafeItem[]
}

const initialState: SafeState = {
  safes: [],
}

export const solSafeSlice = createSlice({
  name: 'solSafeSlice',
  initialState,
  reducers: {
    migrate: (state, action: PayloadAction<SafeState>) => {
      // Don't migrate if there's data already
      if (Object.keys(state).length > 0) return state
      // Otherwise, migrate
      return action.payload
    },
    setSolSafes: (state, action: PayloadAction<SolSafeItem[]>) => {
      state.safes = action.payload
      // return action.payload
    },
    addOrUpdateSolSafe: (state, { payload }: PayloadAction<{ safe: SolSafeItem }>) => {
      let foundIndex = -1
      let isFound = state.safes.find((item, index) => {
        const _isFound = item.safeAddress.toLowerCase() === payload.safe.safeAddress.toLowerCase()
        if (_isFound) {
          foundIndex = index
        }
        return _isFound
      })

      if (isFound) {
        state.safes[foundIndex] = {
          ...payload.safe,
        }
      } else {
        state.safes.push(payload.safe)
      }

      // localStorage.setItem('safes', JSON.stringify(state.safes))
    },
    removeSolSafe: (state, { payload }: PayloadAction<{ address: string }>) => {
      let foundIndex = -1
      state.safes.find((item, index) => {
        const _isFound = item.safeAddress.toLowerCase() === payload.address.toLowerCase()
        if (_isFound) {
          foundIndex = index
        }
        return _isFound
      })

      if (foundIndex !== -1) {
        delete state.safes[foundIndex]
      }
      // localStorage.setItem('safes', JSON.stringify(state.safes))
    },
  },
})

export const { addOrUpdateSolSafe, removeSolSafe, setSolSafes } = solSafeSlice.actions

export const selectAllSolSafes = (state: RootState) => {
  return state[solSafeSlice.name].safes
}

export const selectTotalSolAdded = (state: RootState): number => {
  return Object.values(state[solSafeSlice.name])
    .map((item) => Object.keys(item))
    .flat().length
}

// export const selectAddedSolSafes = createSelector(
//   [selectAllAddedSolSafes, (_: RootState, chainId: string) => chainId],
//   (allAddedSafes, chainId): SafeState | undefined => {
//     return allAddedSafes?.[chainId]
//   },
// )
