import { useState, createContext, useContext } from 'react'
import { AppProvider } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatView } from './components/chat/ChatView'
import { AgentsPage } from './components/agent/AgentsPage'
import { SettingsModal } from './components/settings/SettingsModal'
import { useApp } from './store/AppContext'

export type AppPage = 'chat' | 'agents' | 'search' | 'library'

// Delt navigasjonskontekst slik at AgentsPage kan navigere til chat og sende oppgave
interface NavContextType {
  currentPage: AppPage
  setCurrentPage: (p: AppPage) => void
  pendingAgentTask: string | null
  setPendingAgentTask: (task: string | null) => void
}

export const NavContext = createContext<NavContextType>({
  currentPage: 'chat',
  setCurrentPage: () => {},
  pendingAgentTask: null,
  setPendingAgentTask: () => {},
})

export function useNav() {
  return useContext(NavContext)
}

function AppLayout() {
  const [currentPage, setCurrentPage] = useState<AppPage>('chat')
  const [pendingAgentTask, setPendingAgentTask] = useState<string | null>(null)
  const { activeConversationId } = useApp()

  const effectivePage = activeConversationId ? 'chat' : currentPage

  return (
    <NavContext.Provider value={{ currentPage: effectivePage, setCurrentPage, pendingAgentTask, setPendingAgentTask }}>
      <div className="app-layout">
        <Sidebar onNavigate={(p) => setCurrentPage(p as AppPage)} currentPage={effectivePage} />
        <div className="main-content">
          <Header />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {effectivePage === 'chat' && <ChatView />}
            {effectivePage === 'agents' && <AgentsPage />}
            {effectivePage === 'search' && <PlaceholderPage label="Søk kommer snart" />}
            {effectivePage === 'library' && <PlaceholderPage label="Bibliotek kommer snart" />}
          </div>
        </div>
        <SettingsModal />
      </div>
    </NavContext.Provider>
  )
}

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1C1C1C',
    }}>
      <p style={{ fontSize: 14, color: '#3A3A3A' }}>{label}</p>
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
