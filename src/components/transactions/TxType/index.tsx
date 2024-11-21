import { useTransactionType } from '@/hooks/useTransactionType'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box } from '@mui/material'
import css from './styles.module.css'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { isValidElement } from 'react'
import { SolVaultTxnType } from '@/utils/solvaulthelper'

type TxTypeProps = {
  tx: TransactionSummary
}

const TxType = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return (
    <Box className={css.txType}>
      {isValidElement(type.icon) ? (
        type.icon
      ) : typeof type.icon == 'string' ? (
        <SafeAppIconCard
          src={type.icon}
          alt={type.text}
          width={16}
          height={16}
          fallback="/images/transactions/custom.svg"
        />
      ) : null}

      <span className={css.txTypeText}>{type.text}</span>
    </Box>
  )
}




export const SolTxType = ({ tx }: { tx: SolVaultTxnType }) => {

  const getType = () => {
    const payload = {
      icon: "",
      text: ""
    }

    switch (tx.type) {
      case "SEND":
        payload.icon = "/images/transactions/outgoing.svg"
        payload.text = "Send"
        break

    }

    return payload

  }

  return (
    <Box className={css.txType}>
      {isValidElement(getType().icon) ? (
        getType().icon
      ) : typeof getType().icon == 'string' ? (
        <SafeAppIconCard
          src={getType().icon}
          alt={getType().text}
          width={16}
          height={16}
          fallback="/images/transactions/custom.svg"
        />
      ) : null}

      <span className={css.txTypeText}>{getType().text}</span>
    </Box>
  )
}


// '/images/transactions/outgoing.svg'

export default TxType
