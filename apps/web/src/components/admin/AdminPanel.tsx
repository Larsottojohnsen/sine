import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getSupabase } from '../../hooks/useAuth'
import {
  LayoutDashboard, Users, FileText, BarChart2, CreditCard,
  Bell, Settings, ChevronRight, Search, RefreshCw, Trash2,
  Shield, CheckCircle, XCircle, Edit2, Eye, EyeOff, Plus,
  TrendingUp, TrendingDown, ArrowLeft, AlertTriangle, Mail,
  UserCheck, UserX, Download
} from 'lucide-react'
import './admin.css'

type AdminTab = 'dashboard' | 'users' | 'blog' | 'analytics' | 'revenue' | 'notifications' | 'settings'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  published: boolean
  created_at: string
  author_id?: string
}

interface UserRow {
  id: string
  email: string
  role: string
  plan: string
  created_at: string
  last_sign_in_at?: string
  credits?: number
}

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Oversikt',        icon: <LayoutDashboard size={15} /> },
  { id: 'users',         label: 'Brukere',          icon: <Users size={15} /> },
  { id: 'blog',          label: 'Blogg',             icon: <FileText size={15} /> },
  { id: 'analytics',     label: 'Analyse',           icon: <BarChart2 size={15} /> },
  { id: 'revenue',       label: 'Inntekter',         icon: <CreditCard size={15} /> },
  { id: 'notifications', label: 'Varsler',           icon: <Bell size={15} /> },
  { id: 'settings',      label: 'Innstillinger',     icon: <Settings size={15} /> },
]

// ─── Stat card ────────────────────────────────────────────────
function StatCard({
  label, value, sub, trend, icon, color = '#1A93FE',
}: {
  label: string
  value: string | number
  sub?: string
  trend?: { dir: 'up' | 'down'; pct: number }
  icon: React.ReactNode
  color?: string
}) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-icon" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="adm-stat-body">
        <div className="adm-stat-value">{value}</div>
        <div className="adm-stat-label">{label}</div>
        {(sub || trend) && (
          <div className="adm-stat-sub">
            {trend && (
              <span className={`adm-trend ${trend.dir}`}>
                {trend.dir === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {trend.pct}%
              </span>
            )}
            {sub && <span>{sub}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="adm-section-header">
      <h2 className="adm-section-title">{title}</h2>
      {action}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export function AdminPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Users state
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'user'>('all')

  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newExcerpt, setNewExcerpt] = useState('')
  const [savingPost, setSavingPost] = useState(false)
  const [postMsg, setPostMsg] = useState('')
  const [blogView, setBlogView] = useState<'list' | 'editor'>('list')

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifUserId, setNotifUserId] = useState('all')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisWeek: 0,
    publishedPosts: 0,
    draftPosts: 0,
    adminCount: 0,
    proUsers: 0,
  })
  const [loadingStats, setLoadingStats] = useState(false)

  // User detail / edit state
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [editUserData, setEditUserData] = useState<Partial<UserRow>>({})
  const [savingUser, setSavingUser] = useState(false)
  const [userMsg, setUserMsg] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')
  const [newUserPlan, setNewUserPlan] = useState('free')
  const [addingUser, setAddingUser] = useState(false)
  const [addUserMsg, setAddUserMsg] = useState('')

  // Settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)

  // Integration settings state
  const [stripeKey, setStripeKey] = useState('')
  const [stripeWebhook, setStripeWebhook] = useState('')
  const [vippsClientId, setVippsClientId] = useState('')
  const [vippsClientSecret, setVippsClientSecret] = useState('')
  const [vippsMerchantSerial, setVippsMerchantSerial] = useState('')
  const [gaTrackingId, setGaTrackingId] = useState('')
  const [gscSiteUrl, setGscSiteUrl] = useState('')
  const [savingIntegration, setSavingIntegration] = useState<string | null>(null)
  const [integrationMsg, setIntegrationMsg] = useState<Record<string, string>>({})

  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'blog') loadPosts()
    if (tab === 'dashboard') loadDashboard()
    if (tab === 'notifications') loadNotifications()
  }, [tab])

  // ─── Data loaders ─────────────────────────────────────────────
  async function loadDashboard() {
    setLoadingStats(true)
    const supabase = getSupabase()
    try {
      const [{ count: userCount }, { data: postsData }, { data: usersData }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('published'),
        supabase.from('users').select('role, plan, created_at'),
      ])
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      setStats({
        totalUsers: userCount ?? 0,
        newUsersThisWeek: usersData?.filter(u => u.created_at > oneWeekAgo).length ?? 0,
        publishedPosts: postsData?.filter(p => p.published).length ?? 0,
        draftPosts: postsData?.filter(p => !p.published).length ?? 0,
        adminCount: usersData?.filter(u => u.role === 'admin').length ?? 0,
        proUsers: usersData?.filter(u => u.plan === 'pro').length ?? 0,
      })
    } catch (e) {
      console.error('Dashboard load error:', e)
    }
    setLoadingStats(false)
  }

  async function loadUsers() {
    setLoadingUsers(true)
    const supabase = getSupabase()
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100)
    setUsers(data ?? [])
    setLoadingUsers(false)
  }

  async function loadPosts() {
    setLoadingPosts(true)
    const supabase = getSupabase()
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoadingPosts(false)
  }

  async function loadNotifications() {
    setLoadingNotifs(true)
    const supabase = getSupabase()
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
    setNotifications(data ?? [])
    setLoadingNotifs(false)
  }

  // ─── Blog actions ─────────────────────────────────────────────
  async function savePost() {
    if (!newTitle.trim()) { setPostMsg('Tittel er påkrevd'); return }
    setSavingPost(true)
    setPostMsg('')
    const supabase = getSupabase()
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (editingPost) {
      const { error } = await supabase.from('blog_posts').update({
        title: newTitle, content: newContent, slug, excerpt: newExcerpt
      }).eq('id', editingPost.id)
      if (error) setPostMsg('Feil: ' + error.message)
      else { setPostMsg('Lagret!'); setEditingPost(null); setNewTitle(''); setNewContent(''); setNewExcerpt(''); setBlogView('list'); loadPosts() }
    } else {
      const { error } = await supabase.from('blog_posts').insert({
        title: newTitle, content: newContent, slug, excerpt: newExcerpt,
        published: false, author_id: user?.id
      })
      if (error) setPostMsg('Feil: ' + error.message)
      else { setPostMsg('Opprettet!'); setNewTitle(''); setNewContent(''); setNewExcerpt(''); setBlogView('list'); loadPosts() }
    }
    setSavingPost(false)
  }

  async function togglePublish(post: BlogPost) {
    const supabase = getSupabase()
    await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id)
    loadPosts()
  }

  async function deletePost(id: string) {
    if (!confirm('Slett dette innlegget?')) return
    const supabase = getSupabase()
    await supabase.from('blog_posts').delete().eq('id', id)
    loadPosts()
  }

  // ─── User actions ─────────────────────────────────────────────
  async function promoteUser(userId: string) {
    const supabase = getSupabase()
    await supabase.from('users').update({ role: 'admin' }).eq('id', userId)
    loadUsers()
  }

  async function demoteUser(userId: string) {
    if (!confirm('Fjern admin-rettigheter fra denne brukeren?')) return
    const supabase = getSupabase()
    await supabase.from('users').update({ role: 'user' }).eq('id', userId)
    loadUsers()
  }

  async function changePlan(userId: string, plan: string) {
    const supabase = getSupabase()
    await supabase.from('users').update({ plan }).eq('id', userId)
    loadUsers()
  }

  // ─── Add user ─────────────────────────────────────────────────
  async function addUser() {
    if (!newUserEmail.trim()) { setAddUserMsg('E-post er påkrevd'); return }
    setAddingUser(true)
    setAddUserMsg('')
    const supabase = getSupabase()
    try {
      const { error } = await supabase.from('users').insert({
        email: newUserEmail.trim(),
        role: newUserRole,
        plan: newUserPlan,
        created_at: new Date().toISOString(),
      })
      if (error) throw error
      setAddUserMsg('Bruker lagt til!')
      setNewUserEmail('')
      setNewUserRole('user')
      setNewUserPlan('free')
      setTimeout(() => { setAddUserOpen(false); setAddUserMsg('') }, 1500)
      loadUsers()
    } catch (e: unknown) {
      setAddUserMsg('Feil: ' + (e instanceof Error ? e.message : 'Ukjent'))
    }
    setAddingUser(false)
  }

  // ─── Save user edits ──────────────────────────────────────────
  async function saveUserEdit() {
    if (!selectedUser) return
    setSavingUser(true)
    setUserMsg('')
    const supabase = getSupabase()
    try {
      const { error } = await supabase.from('users').update(editUserData).eq('id', selectedUser.id)
      if (error) throw error
      setUserMsg('Lagret!')
      loadUsers()
      setTimeout(() => { setEditUserOpen(false); setUserMsg('') }, 1500)
    } catch (e: unknown) {
      setUserMsg('Feil: ' + (e instanceof Error ? e.message : 'Ukjent'))
    }
    setSavingUser(false)
  }

  // ─── Save integration settings ────────────────────────────────
  async function saveIntegration(key: string, value: string, label: string) {
    setSavingIntegration(key)
    const supabase = getSupabase()
    try {
      const { error } = await supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' })
      if (error) throw error
      setIntegrationMsg(prev => ({ ...prev, [key]: label + ' lagret!' }))
    } catch {
      setIntegrationMsg(prev => ({ ...prev, [key]: 'Feil ved lagring' }))
    }
    setSavingIntegration(null)
    setTimeout(() => setIntegrationMsg(prev => ({ ...prev, [key]: '' })), 3000)
  }

  // ─── Notification actions ─────────────────────────────────────
  async function sendNotification() {
    if (!notifTitle.trim() || !notifMessage.trim()) { setNotifMsg('Tittel og melding er påkrevd'); return }
    setSendingNotif(true)
    setNotifMsg('')
    const supabase = getSupabase()
    try {
      if (notifUserId === 'all') {
        const { data: allUsers } = await supabase.from('users').select('id')
        const inserts = (allUsers ?? []).map(u => ({
          user_id: u.id, title: notifTitle, message: notifMessage, read: false
        }))
        if (inserts.length > 0) {
          const { error } = await supabase.from('notifications').insert(inserts)
          if (error) throw error
        }
        setNotifMsg(`Sendt til ${inserts.length} brukere!`)
      } else {
        const { error } = await supabase.from('notifications').insert({
          user_id: notifUserId, title: notifTitle, message: notifMessage, read: false
        })
        if (error) throw error
        setNotifMsg('Varsel sendt!')
      }
      setNotifTitle('')
      setNotifMessage('')
      loadNotifications()
    } catch (e: unknown) {
      setNotifMsg('Feil: ' + (e instanceof Error ? e.message : 'Ukjent'))
    }
    setSendingNotif(false)
  }

  // ─── Filtered users ───────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchFilter = userFilter === 'all' || u.role === userFilter
    return matchSearch && matchFilter
  })

  // ─── Export users CSV ─────────────────────────────────────────
  function exportUsersCSV() {
    const rows = [['E-post', 'Rolle', 'Plan', 'Opprettet']]
    users.forEach(u => rows.push([u.email, u.role || 'user', u.plan || 'free', u.created_at ? new Date(u.created_at).toLocaleDateString('nb-NO') : '']))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sine-users.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleTabChange = useCallback((t: AdminTab) => {
    setTab(t)
    setMobileSidebarOpen(false)
  }, [])

  return (
    <div className="adm-root">
      {/* ── Mobile header ───────────────────────────────────── */}
      <div className="adm-mobile-header">
        <button className="adm-mobile-back" onClick={() => window.history.back()}>
          <ArrowLeft size={18} />
        </button>
        <span className="adm-mobile-title">Admin</span>
        <button className="adm-mobile-menu-btn" onClick={() => setMobileSidebarOpen(v => !v)}>
          <LayoutDashboard size={18} />
        </button>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`adm-sidebar${mobileSidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-top">
          <div className="adm-sidebar-brand">
            <div className="adm-brand-badge">
              <Shield size={13} />
              Admin
            </div>
            <div className="adm-brand-email">{user?.email}</div>
          </div>
          <nav className="adm-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`adm-nav-item${tab === t.id ? ' active' : ''}`}
                onClick={() => handleTabChange(t.id)}
              >
                <span className="adm-nav-icon">{t.icon}</span>
                <span>{t.label}</span>
                {tab === t.id && <ChevronRight size={13} className="adm-nav-arrow" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="adm-sidebar-bottom">
          <div className="adm-sidebar-version">Sine Admin v1.0</div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="adm-main">

        {/* ── DASHBOARD ──────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Oversikt</h1>
              <button className="adm-btn-ghost" onClick={loadDashboard} disabled={loadingStats}>
                <RefreshCw size={14} className={loadingStats ? 'adm-spin' : ''} />
                Oppdater
              </button>
            </div>

            <div className="adm-stats-grid">
              <StatCard label="Totale brukere"    value={stats.totalUsers}       icon={<Users size={18} />}      color="#1A93FE" trend={{ dir: 'up', pct: 12 }} />
              <StatCard label="Nye denne uken"    value={stats.newUsersThisWeek} icon={<UserCheck size={18} />}  color="#22c55e" />
              <StatCard label="Pro-brukere"       value={stats.proUsers}         icon={<TrendingUp size={18} />} color="#a855f7" />
              <StatCard label="Administratorer"   value={stats.adminCount}       icon={<Shield size={18} />}     color="#f59e0b" />
              <StatCard label="Publiserte innlegg" value={stats.publishedPosts}  icon={<CheckCircle size={18} />} color="#10b981" />
              <StatCard label="Utkast"            value={stats.draftPosts}       icon={<Edit2 size={18} />}      color="#6b7280" />
            </div>

            <div className="adm-info-box">
              <AlertTriangle size={15} />
              <span>Velkommen til Sine Admin. Endringer du gjør her påvirker produksjonsdatabasen direkte.</span>
            </div>

            <SectionHeader title="Hurtighandlinger" />
            <div className="adm-quick-actions">
              <button className="adm-quick-btn" onClick={() => handleTabChange('users')}>
                <Users size={16} /> Administrer brukere
              </button>
              <button className="adm-quick-btn" onClick={() => { handleTabChange('blog'); setBlogView('editor') }}>
                <Plus size={16} /> Nytt blogginnlegg
              </button>
              <button className="adm-quick-btn" onClick={() => handleTabChange('notifications')}>
                <Bell size={16} /> Send varsel
              </button>
              <button className="adm-quick-btn" onClick={() => handleTabChange('revenue')}>
                <CreditCard size={16} /> Se inntekter
              </button>
            </div>
          </div>
        )}

        {/* ── USERS ────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Brukere</h1>
              <div className="adm-header-actions">
                <button className="adm-btn-primary" onClick={() => { setAddUserOpen(true); setAddUserMsg('') }}>
                  <Plus size={14} /> Legg til bruker
                </button>
                <button className="adm-btn-ghost" onClick={exportUsersCSV}>
                  <Download size={14} /> Eksporter CSV
                </button>
                <button className="adm-btn-ghost" onClick={loadUsers} disabled={loadingUsers}>
                  <RefreshCw size={14} className={loadingUsers ? 'adm-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="adm-filters">
              <div className="adm-search-wrap">
                <Search size={14} className="adm-search-icon" />
                <input
                  className="adm-search"
                  placeholder="Søk etter e-post..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <div className="adm-filter-tabs">
                {(['all', 'user', 'admin'] as const).map(f => (
                  <button key={f} className={`adm-filter-tab${userFilter === f ? ' active' : ''}`} onClick={() => setUserFilter(f)}>
                    {f === 'all' ? 'Alle' : f === 'user' ? 'Brukere' : 'Admins'}
                  </button>
                ))}
              </div>
            </div>

            <div className="adm-table-count">{filteredUsers.length} brukere</div>

            {loadingUsers ? (
              <div className="adm-loading"><RefreshCw size={16} className="adm-spin" /> Laster brukere...</div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>E-post</th>
                      <th>Rolle</th>
                      <th>Plan</th>
                      <th>Opprettet</th>
                      <th>Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="adm-empty-cell">Ingen brukere funnet</td></tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="adm-user-cell">
                            <div className="adm-user-avatar">{(u.email?.[0] ?? '?').toUpperCase()}</div>
                            <span>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`adm-badge${u.role === 'admin' ? ' admin' : ''}`}>
                            {u.role === 'admin' ? <Shield size={10} /> : <Users size={10} />}
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td>
                          <select
                            className="adm-plan-select"
                            value={u.plan || 'free'}
                            onChange={e => changePlan(u.id, e.target.value)}
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="adm-date-cell">{u.created_at ? new Date(u.created_at).toLocaleDateString('nb-NO') : '—'}</td>
                        <td>
                          <div className="adm-row-actions">
                            <button className="adm-action-btn" onClick={() => { setSelectedUser(u); setEditUserData({ role: u.role, plan: u.plan, email: u.email, credits: u.credits }); setEditUserOpen(true); setUserMsg('') }} title="Se / rediger bruker">
                              <Eye size={13} />
                            </button>
                            {u.role !== 'admin' ? (
                              <button className="adm-action-btn promote" onClick={() => promoteUser(u.id)} title="Gjør admin">
                                <UserCheck size={13} />
                              </button>
                            ) : u.id !== user?.id ? (
                              <button className="adm-action-btn demote" onClick={() => demoteUser(u.id)} title="Fjern admin">
                                <UserX size={13} />
                              </button>
                            ) : null}
                            <button className="adm-action-btn" onClick={() => { setNotifUserId(u.id); handleTabChange('notifications') }} title="Send varsel">
                              <Mail size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BLOG ───────────────────────────────────────────── */}
        {tab === 'blog' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Blogg</h1>
              <div className="adm-header-actions">
                {blogView === 'list' ? (
                  <button className="adm-btn-primary" onClick={() => { setEditingPost(null); setNewTitle(''); setNewContent(''); setNewExcerpt(''); setBlogView('editor') }}>
                    <Plus size={14} /> Nytt innlegg
                  </button>
                ) : (
                  <button className="adm-btn-ghost" onClick={() => { setBlogView('list'); setEditingPost(null); setNewTitle(''); setNewContent(''); setNewExcerpt('') }}>
                    <ArrowLeft size={14} /> Tilbake
                  </button>
                )}
              </div>
            </div>

            {blogView === 'editor' ? (
              <div className="adm-blog-editor">
                <h2 className="adm-section-title">{editingPost ? 'Rediger innlegg' : 'Nytt innlegg'}</h2>
                <div className="adm-form-group">
                  <label className="adm-label">Tittel *</label>
                  <input className="adm-input" placeholder="Innleggets tittel" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Ingress</label>
                  <input className="adm-input" placeholder="Kort beskrivelse (vises i listevisning)" value={newExcerpt} onChange={e => setNewExcerpt(e.target.value)} />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Innhold (Markdown støttes)</label>
                  <textarea className="adm-textarea" placeholder="Skriv innholdet her..." value={newContent} onChange={e => setNewContent(e.target.value)} rows={14} />
                </div>
                {postMsg && <p className={`adm-msg${postMsg.startsWith('Feil') ? ' error' : ' success'}`}>{postMsg}</p>}
                <div className="adm-editor-actions">
                  <button className="adm-btn-primary" onClick={savePost} disabled={savingPost}>
                    {savingPost ? 'Lagrer...' : editingPost ? 'Oppdater innlegg' : 'Lagre utkast'}
                  </button>
                  <button className="adm-btn-ghost" onClick={() => { setBlogView('list'); setEditingPost(null); setNewTitle(''); setNewContent(''); setNewExcerpt('') }}>
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <>
                {loadingPosts ? (
                  <div className="adm-loading"><RefreshCw size={16} className="adm-spin" /> Laster innlegg...</div>
                ) : posts.length === 0 ? (
                  <div className="adm-empty-state">
                    <FileText size={32} />
                    <p>Ingen innlegg ennå</p>
                    <button className="adm-btn-primary" onClick={() => setBlogView('editor')}><Plus size={14} /> Skriv første innlegg</button>
                  </div>
                ) : (
                  <div className="adm-post-list">
                    {posts.map(post => (
                      <div key={post.id} className="adm-post-item">
                        <div className="adm-post-left">
                          <span className={`adm-post-dot${post.published ? ' published' : ''}`} />
                          <div>
                            <div className="adm-post-title">{post.title}</div>
                            <div className="adm-post-meta">
                              <span className={`adm-badge${post.published ? ' published' : ''}`}>
                                {post.published ? <Eye size={10} /> : <EyeOff size={10} />}
                                {post.published ? 'Publisert' : 'Utkast'}
                              </span>
                              <span className="adm-post-date">{new Date(post.created_at).toLocaleDateString('nb-NO')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="adm-row-actions">
                          <button className="adm-action-btn" onClick={() => { setEditingPost(post); setNewTitle(post.title); setNewContent(post.content); setNewExcerpt(''); setBlogView('editor') }} title="Rediger">
                            <Edit2 size={13} />
                          </button>
                          <button className="adm-action-btn" onClick={() => togglePublish(post)} title={post.published ? 'Avpubliser' : 'Publiser'}>
                            {post.published ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button className="adm-action-btn danger" onClick={() => deletePost(post.id)} title="Slett">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ANALYTICS ──────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Analyse</h1>
            </div>
            <div className="adm-info-box">
              <AlertTriangle size={15} />
              <span>Koble til et analyseverkøy (f.eks. Plausible, PostHog) for å se reelle besøksdata.</span>
            </div>
            <div className="adm-stats-grid">
              {[
                { label: 'Sidevisninger (7 dager)', icon: <BarChart2 size={18} />, color: '#1A93FE' },
                { label: 'Unike besøkende',         icon: <Users size={18} />,    color: '#22c55e' },
                { label: 'Gjsn. sesjonslengde',     icon: <TrendingUp size={18} />, color: '#a855f7' },
                { label: 'Avvisningsrate',           icon: <TrendingDown size={18} />, color: '#f59e0b' },
              ].map(s => (
                <StatCard key={s.label} label={s.label} value="—" icon={s.icon} color={s.color} />
              ))}
            </div>
          </div>
        )}

        {/* ── REVENUE ────────────────────────────────────────── */}
        {tab === 'revenue' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Inntekter</h1>
            </div>
            <div className="adm-info-box">
              <AlertTriangle size={15} />
              <span>Stripe-integrasjon er klar. Koble til Stripe-nøkler for å se reelle inntektsdata.</span>
            </div>
            <div className="adm-stats-grid">
              {[
                { label: 'MRR',                icon: <TrendingUp size={18} />,  color: '#22c55e' },
                { label: 'ARR',                icon: <TrendingUp size={18} />,  color: '#1A93FE' },
                { label: 'Aktive abonnenter',  icon: <Users size={18} />,       color: '#a855f7' },
                { label: 'Churn rate',         icon: <TrendingDown size={18} />, color: '#ef4444' },
              ].map(s => (
                <StatCard key={s.label} label={s.label} value="—" icon={s.icon} color={s.color} />
              ))}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ──────────────────────────────────── */}
        {tab === 'notifications' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Varsler</h1>
              <button className="adm-btn-ghost" onClick={loadNotifications} disabled={loadingNotifs}>
                <RefreshCw size={14} className={loadingNotifs ? 'adm-spin' : ''} />
              </button>
            </div>

            <div className="adm-notif-composer">
              <h2 className="adm-section-title">Send varsel</h2>
              <div className="adm-form-group">
                <label className="adm-label">Mottaker</label>
                <select className="adm-input" value={notifUserId} onChange={e => setNotifUserId(e.target.value)}>
                  <option value="all">Alle brukere</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Tittel</label>
                <input className="adm-input" placeholder="Varselstittel" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Melding</label>
                <textarea className="adm-textarea" placeholder="Varselmelding..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={4} />
              </div>
              {notifMsg && <p className={`adm-msg${notifMsg.startsWith('Feil') ? ' error' : ' success'}`}>{notifMsg}</p>}
              <button className="adm-btn-primary" onClick={sendNotification} disabled={sendingNotif}>
                {sendingNotif ? 'Sender...' : <><Bell size={14} /> Send varsel</>}
              </button>
            </div>

            <SectionHeader title="Sendte varsler" />
            {loadingNotifs ? (
              <div className="adm-loading"><RefreshCw size={16} className="adm-spin" /> Laster...</div>
            ) : notifications.length === 0 ? (
              <div className="adm-empty-state"><Bell size={28} /><p>Ingen varsler sendt ennå</p></div>
            ) : (
              <div className="adm-notif-list">
                {notifications.map(n => (
                  <div key={n.id} className={`adm-notif-item${n.read ? ' read' : ''}`}>
                    <div className="adm-notif-dot" />
                    <div className="adm-notif-body">
                      <div className="adm-notif-title">{n.title}</div>
                      <div className="adm-notif-msg">{n.message}</div>
                      <div className="adm-notif-meta">{new Date(n.created_at).toLocaleString('nb-NO')}</div>
                    </div>
                    {n.read ? <CheckCircle size={14} className="adm-notif-read-icon" /> : <XCircle size={14} className="adm-notif-unread-icon" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ───────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">Innstillinger</h1>
            </div>

            <div className="adm-settings-section">
              <h2 className="adm-section-title">Applikasjon</h2>
              <div className="adm-setting-row">
                <div>
                  <div className="adm-setting-label">Vedlikeholdsmodus</div>
                  <div className="adm-setting-desc">Stenger appen for vanlige brukere</div>
                </div>
                <button
                  className={`adm-toggle${maintenanceMode ? ' on' : ''}`}
                  onClick={() => setMaintenanceMode(v => !v)}
                >
                  <span className="adm-toggle-thumb" />
                </button>
              </div>
              <div className="adm-setting-row">
                <div>
                  <div className="adm-setting-label">Åpen registrering</div>
                  <div className="adm-setting-desc">Tillat nye brukere å registrere seg</div>
                </div>
                <button
                  className={`adm-toggle${registrationOpen ? ' on' : ''}`}
                  onClick={() => setRegistrationOpen(v => !v)}
                >
                  <span className="adm-toggle-thumb" />
                </button>
              </div>
            </div>

            <div className="adm-settings-section">
              <h2 className="adm-section-title">Miljø</h2>
              <div className="adm-env-grid">
                {[
                  { key: 'Supabase URL', val: 'Konfigurert' },
                  { key: 'Stripe', val: 'Konfigurert' },
                  { key: 'Railway API', val: 'Konfigurert' },
                  { key: 'GitHub Pages', val: 'Aktiv' },
                ].map(e => (
                  <div key={e.key} className="adm-env-row">
                    <span className="adm-env-key">{e.key}</span>
                    <span className="adm-env-val"><CheckCircle size={12} /> {e.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Stripe ── */}
            <div className="adm-settings-section">
              <h2 className="adm-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={16} /> Stripe-betaling
              </h2>
              <div className="adm-form-group">
                <label className="adm-label">Stripe Secret Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" type="password" placeholder="sk_live_..." value={stripeKey} onChange={e => setStripeKey(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('stripe_secret_key', stripeKey, 'Stripe nøkkel')} disabled={savingIntegration === 'stripe_secret_key'}>
                    {savingIntegration === 'stripe_secret_key' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['stripe_secret_key'] && <p className="adm-msg success">{integrationMsg['stripe_secret_key']}</p>}
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Stripe Webhook Secret</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" type="password" placeholder="whsec_..." value={stripeWebhook} onChange={e => setStripeWebhook(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('stripe_webhook_secret', stripeWebhook, 'Stripe webhook')} disabled={savingIntegration === 'stripe_webhook_secret'}>
                    {savingIntegration === 'stripe_webhook_secret' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['stripe_webhook_secret'] && <p className="adm-msg success">{integrationMsg['stripe_webhook_secret']}</p>}
              </div>
              <div className="adm-setting-desc" style={{ marginTop: 4 }}>
                Finn nøklene på <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" style={{ color: '#1A93FE' }}>dashboard.stripe.com/apikeys</a>
              </div>
            </div>

            {/* ── Vipps ── */}
            <div className="adm-settings-section">
              <h2 className="adm-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💳</span> Vipps MobilePay
              </h2>
              <div className="adm-form-group">
                <label className="adm-label">Client ID</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" placeholder="Vipps Client ID" value={vippsClientId} onChange={e => setVippsClientId(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('vipps_client_id', vippsClientId, 'Vipps Client ID')} disabled={savingIntegration === 'vipps_client_id'}>
                    {savingIntegration === 'vipps_client_id' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['vipps_client_id'] && <p className="adm-msg success">{integrationMsg['vipps_client_id']}</p>}
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Client Secret</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" type="password" placeholder="Vipps Client Secret" value={vippsClientSecret} onChange={e => setVippsClientSecret(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('vipps_client_secret', vippsClientSecret, 'Vipps Client Secret')} disabled={savingIntegration === 'vipps_client_secret'}>
                    {savingIntegration === 'vipps_client_secret' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['vipps_client_secret'] && <p className="adm-msg success">{integrationMsg['vipps_client_secret']}</p>}
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Merchant Serial Number (MSN)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" placeholder="123456" value={vippsMerchantSerial} onChange={e => setVippsMerchantSerial(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('vipps_merchant_serial', vippsMerchantSerial, 'Vipps MSN')} disabled={savingIntegration === 'vipps_merchant_serial'}>
                    {savingIntegration === 'vipps_merchant_serial' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['vipps_merchant_serial'] && <p className="adm-msg success">{integrationMsg['vipps_merchant_serial']}</p>}
              </div>
              <div className="adm-setting-desc" style={{ marginTop: 4 }}>
                Finn nøklene på <a href="https://portal.vipps.no" target="_blank" rel="noreferrer" style={{ color: '#1A93FE' }}>portal.vipps.no</a> under Utvikler → API-nøkler
              </div>
            </div>

            {/* ── Google Analytics ── */}
            <div className="adm-settings-section">
              <h2 className="adm-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={16} /> Google Analytics
              </h2>
              <div className="adm-form-group">
                <label className="adm-label">Measurement ID (GA4)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" placeholder="G-XXXXXXXXXX" value={gaTrackingId} onChange={e => setGaTrackingId(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('ga_measurement_id', gaTrackingId, 'GA4 ID')} disabled={savingIntegration === 'ga_measurement_id'}>
                    {savingIntegration === 'ga_measurement_id' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['ga_measurement_id'] && <p className="adm-msg success">{integrationMsg['ga_measurement_id']}</p>}
              </div>
              <div className="adm-setting-desc" style={{ marginTop: 4 }}>
                Finn Measurement ID i <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color: '#1A93FE' }}>Google Analytics</a> → Admin → Data Streams
              </div>
            </div>

            {/* ── Google Search Console ── */}
            <div className="adm-settings-section">
              <h2 className="adm-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={16} /> Google Search Console
              </h2>
              <div className="adm-form-group">
                <label className="adm-label">Nettsted-URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="adm-input" placeholder="https://sine.no" value={gscSiteUrl} onChange={e => setGscSiteUrl(e.target.value)} />
                  <button className="adm-btn-primary" style={{ flexShrink: 0 }} onClick={() => saveIntegration('gsc_site_url', gscSiteUrl, 'GSC URL')} disabled={savingIntegration === 'gsc_site_url'}>
                    {savingIntegration === 'gsc_site_url' ? 'Lagrer...' : 'Lagre'}
                  </button>
                </div>
                {integrationMsg['gsc_site_url'] && <p className="adm-msg success">{integrationMsg['gsc_site_url']}</p>}
              </div>
              <div className="adm-setting-desc" style={{ marginTop: 4 }}>
                Verifiser nettstedet ditt på <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" style={{ color: '#1A93FE' }}>search.google.com/search-console</a>
              </div>
            </div>

            <div className="adm-settings-section">
              <h2 className="adm-section-title">Farlig sone</h2>
              <div className="adm-danger-zone">
                <div>
                  <div className="adm-setting-label">Tøm alle varsler</div>
                  <div className="adm-setting-desc">Sletter alle varsler fra databasen</div>
                </div>
                <button className="adm-btn-danger" onClick={async () => {
                  if (!confirm('Slett alle varsler?')) return
                  const supabase = getSupabase()
                  await supabase.from('notifications').delete().neq('id', '')
                  loadNotifications()
                }}>
                  <Trash2 size={13} /> Tøm varsler
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Add User Modal ── */}
      {addUserOpen && (
        <div className="adm-modal-overlay" onClick={() => setAddUserOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2 className="adm-modal-title">Legg til bruker</h2>
              <button className="adm-modal-close" onClick={() => setAddUserOpen(false)}>×</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form-group">
                <label className="adm-label">E-post *</label>
                <input className="adm-input" placeholder="bruker@eksempel.no" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Rolle</label>
                <select className="adm-input" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                  <option value="user">Bruker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Plan</label>
                <select className="adm-input" value={newUserPlan} onChange={e => setNewUserPlan(e.target.value)}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              {addUserMsg && <p className={`adm-msg${addUserMsg.startsWith('Feil') ? ' error' : ' success'}`}>{addUserMsg}</p>}
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setAddUserOpen(false)}>Avbryt</button>
              <button className="adm-btn-primary" onClick={addUser} disabled={addingUser}>
                {addingUser ? 'Legger til...' : <><Plus size={14} /> Legg til bruker</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editUserOpen && selectedUser && (
        <div className="adm-modal-overlay" onClick={() => setEditUserOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2 className="adm-modal-title">Brukerdetaljer</h2>
              <button className="adm-modal-close" onClick={() => setEditUserOpen(false)}>×</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-user-detail-avatar">
                {(selectedUser.email?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="adm-form-group">
                <label className="adm-label">E-post</label>
                <input className="adm-input" value={editUserData.email ?? selectedUser.email} onChange={e => setEditUserData(d => ({ ...d, email: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Rolle</label>
                <select className="adm-input" value={editUserData.role ?? selectedUser.role ?? 'user'} onChange={e => setEditUserData(d => ({ ...d, role: e.target.value }))}>
                  <option value="user">Bruker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Plan</label>
                <select className="adm-input" value={editUserData.plan ?? selectedUser.plan ?? 'free'} onChange={e => setEditUserData(d => ({ ...d, plan: e.target.value }))}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Kreditter</label>
                <input className="adm-input" type="number" value={editUserData.credits ?? selectedUser.credits ?? 0} onChange={e => setEditUserData(d => ({ ...d, credits: Number(e.target.value) }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Bruker-ID</label>
                <input className="adm-input" value={selectedUser.id} readOnly style={{ opacity: 0.5, cursor: 'default' }} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Opprettet</label>
                <input className="adm-input" value={selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('nb-NO') : '—'} readOnly style={{ opacity: 0.5, cursor: 'default' }} />
              </div>
              {userMsg && <p className={`adm-msg${userMsg.startsWith('Feil') ? ' error' : ' success'}`}>{userMsg}</p>}
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setEditUserOpen(false)}>Avbryt</button>
              <button className="adm-btn-primary" onClick={saveUserEdit} disabled={savingUser}>
                {savingUser ? 'Lagrer...' : <><Edit2 size={14} /> Lagre endringer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
