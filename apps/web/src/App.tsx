import { useState } from 'react'
import { AppProvider } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatView } from './components/chat/ChatView'
import { AgentsPage } from './components/agent/AgentsPage'
import { SettingsModal } from './components/settings/SettingsModal'
import { useApp } from './store/AppContext'

type AppPage = 'chat' | 'agents' | 'search' | 'library'

function AppLayout() {
  const [currentPage, setCurrentPage] = useState<AppPage>('chat')
  const { activeConversationId } = useApp()

  // When a conversation is selected, always show chat
  const effectivePage = activeConversationId ? 'chat' : currentPage

  return (
    <div className="flex h-full" style={{ background: '#1C1C1C' }}>
      <SidebarWithNav onNavigate={setCurrentPage} currentPage={effectivePage} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col">
          {effectivePage === 'chat' && <ChatView />}
          {effectivePage === 'agents' && <AgentsPage />}
          {effectivePage === 'search' && <SearchPage />}
          {effectivePage === 'library' && <LibraryPage />}
        </main>
      </div>
      <SettingsModal />
    </div>
  )
}

function SidebarWithNav({
  onNavigate,
  currentPage,
}: {
  onNavigate: (page: AppPage) => void
  currentPage: AppPage
}) {
  return <Sidebar onNavigate={(p) => onNavigate(p as AppPage)} currentPage={currentPage} />
}

function SearchPage() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#1C1C1C' }}>
      <div className="text-center">
        <p className="text-[14px] text-[#555]">Søk kommer snart</p>
      </div>
    </div>
  )
}

function LibraryPage() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#1C1C1C' }}>
      <div className="text-center">
        <p className="text-[14px] text-[#555]">Bibliotek kommer snart</p>
      </div>
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
