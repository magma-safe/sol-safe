import { useEffect } from 'react'

import useAsync, { type AsyncResult } from '../useAsync'
import { Errors, logError } from '@/services/exceptions'

import axios from 'axios'
import { TokenSliceType } from '@/store/tokensSlice'

async function getTokenList(): Promise<TokenSliceType> {
  const url = `${process.env.NEXT_PUBLIC_PORTFOLIO_API}/tokens`
  const resp = await axios.get(url)
  return {
    items: resp.data,
  }
}
export const useLoadTokenList = (): AsyncResult<TokenSliceType> => {
  const [data, error, loading] = useAsync<TokenSliceType>(
    () => {
      return getTokenList()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
    false, // don't clear data between polls
  )

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._601, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadTokenList
