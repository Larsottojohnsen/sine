import { useState, createContext, useContext } from 'react'
import { AppProvider } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatView } from './components/chat/ChatView'
import { SettingsModal } from './components/settings/SettingsModal'
import { useApp } from './store/AppContext'

export type AppPage = 'chat' | 'agents' | 'search' | 'library'

// Delt navigasjonskontekst
interface NavContextType {
  currentPage: AppPage
  setCurrentPage: (p: AppPage) => void
  // null = ingen pending, string = aktiver agent-modus (tom streng = bare aktiver)
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
  useApp()

  // Alltid vis chat – agent er nå en modus i ChatView, ikke en egen side
  const effectivePage: AppPage = 'chat'

  const handleNavigate = (p: string) => {
    if (p === 'agents') {
      // Naviger til chat og aktiver agent-modus
      setPendingAgentTask('')
      setCurrentPage('chat')
    } else {
      setCurrentPage(p as AppPage)
    }
  }

  return (
    <NavContext.Provider value={{ currentPage: effectivePage, setCurrentPage, pendingAgentTask, setPendingAgentTask }}>
      <div className="app-layout">
        <Sidebar onNavigate={handleNavigate} currentPage={currentPage === 'agents' ? 'agents' : effectivePage} />
        <div className="main-content">
          <Header />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatView />
          </div>
        </div>
        <SettingsModal />
      </div>
    </NavContext.Provider>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  )
}
