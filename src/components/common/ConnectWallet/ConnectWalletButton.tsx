import { Button } from '@mui/material'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

const ConnectWalletButton = ({
  onConnect,
  contained = true,
  small = false,
  text,
}: {
  onConnect?: () => void
  contained?: boolean
  small?: boolean
  text?: string
}): React.ReactElement => {
  const connectWallet = useConnectWallet()

  const { setVisible } = useWalletModal()
  const handleConnect = () => {
    onConnect?.()
    setVisible(true)
    // connectWallet()
  }

  return (
    <Button
      data-testid="connect-wallet-btn"
      onClick={handleConnect}
      variant={contained ? 'contained' : 'text'}
      size={small ? 'small' : 'medium'}
      disableElevation
      fullWidth
      sx={{ fontSize: small ? ['12px', '13px'] : '' }}
    >
      {text || 'Connect'}
    </Button>
  )
}

export default ConnectWalletButton
