import { AppProvider } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatView } from './components/chat/ChatView'
import { SettingsModal } from './components/settings/SettingsModal'

function AppLayout() {
  return (
    <div className="flex h-full" style={{ background: '#1C1C1C' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ChatView />
        </main>
      </div>
      <SettingsModal />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  )
}
