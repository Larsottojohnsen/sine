import { useState, createContext, useContext, useEffect } from 'react'
import { AppProvider } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatView } from './components/chat/ChatView'
import { SettingsModal } from './components/settings/SettingsModal'
import { useApp } from './store/AppContext'
import { SearchModal } from './components/search/SearchModal'
import { LibraryView } from './components/library/LibraryView'

export type AppPage = 'chat' | 'agents' | 'search' | 'library'

// Delt navigasjonskontekst
interface NavContextType {
  currentPage: AppPage
  setCurrentPage: (p: AppPage) => void
  // null = ingen pending, string = aktiver agent-modus (tom streng = bare aktiver)
  pendingAgentTask: string | null
  setPendingAgentTask: (task: string | null) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

export const NavContext = createContext<NavContextType>({
  currentPage: 'chat',
  setCurrentPage: () => {},
  pendingAgentTask: null,
  setPendingAgentTask: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
})

export function useNav() {
  return useContext(NavContext)
}

function AppLayout() {
  const [currentPage, setCurrentPage] = useState<AppPage>('chat')
  const [pendingAgentTask, setPendingAgentTask] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const { setActiveConversationId, createConversation } = useApp()

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleNavigate = (p: string) => {
    if (p === 'agents') {
      setPendingAgentTask('')
      setCurrentPage('chat')
    } else if (p === 'search') {
      setSearchOpen(true)
    } else {
      setCurrentPage(p as AppPage)
    }
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setCurrentPage('chat')
  }

  const handleNewChat = () => {
    createConversation()
    setCurrentPage('chat')
  }

  return (
    <NavContext.Provider value={{ currentPage, setCurrentPage, pendingAgentTask, setPendingAgentTask, searchOpen, setSearchOpen }}>
      <div className="app-layout">
        <Sidebar onNavigate={handleNavigate} currentPage={currentPage} />
        <div className="main-content">
          <Header />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {currentPage === 'library' ? (
              <LibraryView />
            ) : (
              <ChatView />
            )}
          </div>
        </div>
        <SettingsModal />
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />
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
