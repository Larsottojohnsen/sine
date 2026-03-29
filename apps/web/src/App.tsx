import { useState, createContext, useContext, useEffect, useCallback } from 'react'
import { AppProvider } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatView } from './components/chat/ChatView'
import { SettingsModal } from './components/settings/SettingsModal'
import { useApp } from './store/AppContext'
import { SearchModal } from './components/search/SearchModal'
import { LibraryView } from './components/library/LibraryView'
import { CalendarPage } from './components/calendar/CalendarPage'
import { LoginPage } from './components/auth/LoginPage'
import { LandingPage } from './components/LandingPage'
import { AdminPanel } from './components/admin/AdminPanel'
import { useAuth } from './hooks/useAuth'

export type AppPage = 'chat' | 'agents' | 'search' | 'library' | 'calendar' | 'admin'

// Delt navigasjonskontekst
interface NavContextType {
  currentPage: AppPage
  setCurrentPage: (p: AppPage) => void
  pendingAgentTask: string | null
  setPendingAgentTask: (task: string | null) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  // Mobile navigation
  mobileShowChat: boolean
  setMobileShowChat: (show: boolean) => void
}

export const NavContext = createContext<NavContextType>({
  currentPage: 'chat',
  setCurrentPage: () => {},
  pendingAgentTask: null,
  setPendingAgentTask: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
  mobileShowChat: false,
  setMobileShowChat: () => {},
})

export function useNav() {
  return useContext(NavContext)
}

function AppLayout() {
  const [currentPage, setCurrentPage] = useState<AppPage>('chat')
  const [pendingAgentTask, setPendingAgentTask] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  // Mobile: false = show sidebar/conv list, true = show chat
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const { setActiveConversationId, createConversation, settings } = useApp()

  // Apply theme to document root
  useEffect(() => {
    const applyTheme = (theme: string) => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      } else {
        document.documentElement.setAttribute('data-theme', theme)
      }
    }
    applyTheme(settings.theme)
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.theme])

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

  const handleNavigate = useCallback((p: string) => {
    if (p === 'agents') {
      setPendingAgentTask('')
      setCurrentPage('chat')
      setMobileShowChat(true)
    } else if (p === 'search') {
      setSearchOpen(true)
    } else if (p === 'calendar') {
      setCurrentPage('calendar')
      setMobileShowChat(true)
    } else if (p === 'admin') {
      setCurrentPage('admin')
      setMobileShowChat(true)
    } else {
      setCurrentPage(p as AppPage)
    }
  }, [])

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setCurrentPage('chat')
    setMobileShowChat(true)
  }, [setActiveConversationId])

  const handleNewChat = useCallback(() => {
    createConversation()
    setCurrentPage('chat')
    setMobileShowChat(true)
  }, [createConversation])

  const handleMobileBack = useCallback(() => {
    setMobileShowChat(false)
  }, [])

  return (
    <NavContext.Provider value={{
      currentPage, setCurrentPage,
      pendingAgentTask, setPendingAgentTask,
      searchOpen, setSearchOpen,
      mobileShowChat, setMobileShowChat,
    }}>
      <div className="app-layout">
        {/* Sidebar: hidden on mobile when chat is active */}
        <div className={`sidebar-wrapper${mobileShowChat ? ' mobile-hidden' : ''}`}>
          <Sidebar
            onNavigate={handleNavigate}
            currentPage={currentPage}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </div>
        {/* Main content: hidden on mobile when sidebar is active */}
        <div className={`main-content${!mobileShowChat ? ' mobile-hidden' : ''}`}>
          {currentPage !== 'calendar' && currentPage !== 'admin' && (
            <Header onMobileBack={handleMobileBack} />
          )}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {currentPage === 'library' ? (
              <LibraryView />
            ) : currentPage === 'calendar' ? (
              <CalendarPage />
            ) : currentPage === 'admin' ? (
              <AdminPanel />
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

type AppView = 'landing' | 'login' | 'app'

function AuthGate() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<AppView>('landing')

  // When user is authenticated, always show the app
  useEffect(() => {
    if (!loading && user) {
      setView('app')
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    )
  }

  // If authenticated, show the app directly
  if (user) {
    return (
      <AppProvider>
        <AppLayout />
      </AppProvider>
    )
  }

  // Not authenticated — show landing or login
  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('login')} />
  }

  return <LoginPage />
}

export default function App() {
  return <AuthGate />
}
