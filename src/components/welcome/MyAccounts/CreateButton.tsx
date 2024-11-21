import { Button } from '@mui/material'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { SolSafeItem } from '@/types/safetypes'

const buttonSx = { width: ['100%', 'auto'] }

const CreateButton = ({ isPrimary }: { isPrimary: boolean }) => {
  return (
    <Link href={AppRoutes.newSafe.create} passHref legacyBehavior>
      <Button
        data-testid="create-safe-btn"
        disableElevation
        size="small"
        variant={isPrimary ? 'contained' : 'outlined'}
        sx={buttonSx}
        component="a"
      >
        Create account
      </Button>
    </Link>
  )
}

export default CreateButton





export const DownloadSafesConfigsButton = ({ isPrimary, allSafes }: { isPrimary: boolean, allSafes: SolSafeItem[] }) => {

  const downloadSafeConfigs = () => {


    const payload: any[] = []

    for (const safe of allSafes) {
      payload.push({
        createKey: safe.createKey,
        linkedAddress: safe.linkedAddress,
        safeAddress: safe.safeAddress
      })
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.download = "safes_config.json";

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
  };
  return (
    <Button
      onClick={() => downloadSafeConfigs()}
      data-testid="create-safe-btn"
      disableElevation
      size="small"
      variant={isPrimary ? 'contained' : 'outlined'}
      sx={buttonSx}
      component="a"
    >
      Backup Safes
    </Button>
  )
}
