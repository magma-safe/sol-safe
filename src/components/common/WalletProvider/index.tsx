import { createContext, type ReactElement, type ReactNode, useEffect, useState } from 'react'
import useOnboard, { type ConnectedWallet, getConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Eip1193Provider } from 'ethers'

export const WalletContext = createContext<ConnectedWallet | null>(null)

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  // connectedWallet
  const { connected, publicKey: connectedAddress, wallet: connectedWallet } = useSolanaWallet()
  const onboard = useOnboard()
  const onboardWallets = onboard?.state.get().wallets || []
  const [wallet, setWallet] = useState<ConnectedWallet | null>(getConnectedWallet(onboardWallets))

  useEffect(() => {
    if (connected && connectedAddress && connectedWallet) {
      const wallet: ConnectedWallet = {
        chainId: "",
        address: connectedAddress.toBase58(),
        balance: "0",
        icon: connectedWallet?.adapter.icon,
        label: connectedWallet?.adapter.name,
      }
      setWallet(wallet)
    } else {
      setWallet(null)
    }
  }, [connected, connectedAddress, connectedWallet])



  // useEffect(() => {
  //   if (!onboard) return

  //   const walletSubscription = onboard.state.select('wallets').subscribe((wallets) => {
  //     const newWallet = getConnectedWallet(wallets)

  //     setWallet(newWallet)
  //   })

  //   return () => {
  //     walletSubscription.unsubscribe()
  //   }
  // }, [onboard])

  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export default WalletProvider
