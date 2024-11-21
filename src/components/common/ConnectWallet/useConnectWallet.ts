import { useCallback } from 'react'
import useOnboard, { connectWallet } from '@/hooks/wallets/useOnboard'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

const useConnectWallet = () => {
  const { setVisible } = useWalletModal()

  const onboard = useOnboard()

  // return useCallback(() => {
  //   if (!onboard) {
  //     return Promise.resolve(undefined)
  //   }

  //   return connectWallet(onboard)
  // }, [onboard])

  return useCallback(() => {
    setVisible(true)
  }, [])
}

export default useConnectWallet
