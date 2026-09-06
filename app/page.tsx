import { ConnectProvider } from '@/components/connect/connect-context'
import { AppShell } from '@/components/app-shell'

export default function Page() {
  return (
    <ConnectProvider>
      <AppShell />
    </ConnectProvider>
  )
}
