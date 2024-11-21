import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import { getTransactionDetails, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { asError } from '@/services/exceptions/utils'
import { getDelegates } from '@safe-global/safe-gateway-typescript-sdk'
import type { DelegateResponse } from '@safe-global/safe-gateway-typescript-sdk/dist/types/delegates'
import { safeOverviewEndpoints } from './safeOverviews'
import { getSubmission } from '@safe-global/safe-client-gateway-sdk'

async function buildQueryFn<T>(fn: () => Promise<T>) {
  try {
    return { data: await fn() }
  } catch (error) {
    return { error: asError(error) }
  }
}

export const gatewayApi = createApi({
  reducerPath: 'gatewayApi',
  baseQuery: fakeBaseQuery<Error>(),
  endpoints: (builder) => ({
    getTransactionDetails: builder.query<TransactionDetails, { chainId: string; txId: string }>({
      queryFn({ chainId, txId }) {
        return buildQueryFn(() => getTransactionDetails(chainId, txId))
      },
    }),
    getMultipleTransactionDetails: builder.query<TransactionDetails[], { chainId: string; txIds: string[] }>({
      queryFn({ chainId, txIds }) {
        return buildQueryFn(() => Promise.all(txIds.map((txId) => getTransactionDetails(chainId, txId))))
      },
    }),
    getDelegates: builder.query<DelegateResponse, { chainId: string; safeAddress: string }>({
      queryFn({ chainId, safeAddress }) {
        return buildQueryFn(() => getDelegates(chainId, { safe: safeAddress }))
      },
    }),
    getSubmission: builder.query<
      getSubmission,
      { outreachId: number; chainId: string; safeAddress: string; signerAddress: string }
    >({
      queryFn({ outreachId, chainId, safeAddress, signerAddress }) {
        return buildQueryFn(() =>
          getSubmission({
            params: {
              path: {
                outreachId,
                chainId: '11155111',
                safeAddress: '0xe55A1EF640Cf41f53491A2F0aEf681107Eab9de4',
                signerAddress: '0x22b856cb8e6F074173C238Be35174A122be095bb',
              },
            },
          }),
        )
      },
    }),
    ...safeOverviewEndpoints(builder),
  }),
})

export const {
  useGetTransactionDetailsQuery,
  useGetMultipleTransactionDetailsQuery,
  useLazyGetTransactionDetailsQuery,
  useGetDelegatesQuery,
  useGetSubmissionQuery,
  useGetSafeOverviewQuery,
  useGetMultipleSafeOverviewsQuery,
} = gatewayApi
