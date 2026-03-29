import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getSupabase } from '../../hooks/useAuth'
import './admin.css'

type AdminTab = 'dashboard' | 'users' | 'blog' | 'analytics' | 'revenue'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  published: boolean
  created_at: string
}

interface UserRow {
  id: string
  email: string
  role: string
  plan: string
  created_at: string
}

export function AdminPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [users, setUsers] = useState<UserRow[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(false)

  // Blog editor state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [savingPost, setSavingPost] = useState(false)
  const [postMsg, setPostMsg] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    publishedPosts: 0,
    draftPosts: 0,
  })

  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'blog') loadPosts()
    if (tab === 'dashboard') loadDashboard()
  }, [tab])

  async function loadDashboard() {
    const supabase = getSupabase()
    const [{ count: userCount }, { data: postsData }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('published'),
    ])
    setStats({
      totalUsers: userCount ?? 0,
      publishedPosts: postsData?.filter(p => p.published).length ?? 0,
      draftPosts: postsData?.filter(p => !p.published).length ?? 0,
    })
  }

  async function loadUsers() {
    setLoadingUsers(true)
    const supabase = getSupabase()
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50)
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

  async function savePost() {
    if (!newTitle.trim()) { setPostMsg('Tittel er påkrevd'); return }
    setSavingPost(true)
    setPostMsg('')
    const supabase = getSupabase()
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (editingPost) {
      const { error } = await supabase.from('blog_posts').update({ title: newTitle, content: newContent, slug }).eq('id', editingPost.id)
      if (error) setPostMsg('Feil: ' + error.message)
      else { setPostMsg('Lagret!'); setEditingPost(null); setNewTitle(''); setNewContent(''); loadPosts() }
    } else {
      const { error } = await supabase.from('blog_posts').insert({ title: newTitle, content: newContent, slug, published: false, author_id: user?.id })
      if (error) setPostMsg('Feil: ' + error.message)
      else { setPostMsg('Opprettet!'); setNewTitle(''); setNewContent(''); loadPosts() }
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

  async function promoteUser(userId: string) {
    const supabase = getSupabase()
    await supabase.from('users').update({ role: 'admin' }).eq('id', userId)
    loadUsers()
  }

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Oversikt', icon: '📊' },
    { id: 'users', label: 'Brukere', icon: '👥' },
    { id: 'blog', label: 'Blogg', icon: '✍️' },
    { id: 'analytics', label: 'Analyse', icon: '📈' },
    { id: 'revenue', label: 'Inntekter', icon: '💰' },
  ]

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-badge">Admin</span>
          <span className="admin-user-email">{user?.email}</span>
        </div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-nav-item${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="admin-nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="admin-main">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="admin-content">
            <h1 className="admin-title">Oversikt</h1>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-value">{stats.totalUsers}</div>
                <div className="admin-stat-label">Totale brukere</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{stats.publishedPosts}</div>
                <div className="admin-stat-label">Publiserte innlegg</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{stats.draftPosts}</div>
                <div className="admin-stat-label">Utkast</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">MRR (Stripe)</div>
              </div>
            </div>
            <div className="admin-info-box">
              <p>Velkommen til Sine Admin-panelet. Her kan du administrere brukere, skrive blogginnlegg og se statistikk.</p>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="admin-content">
            <h1 className="admin-title">Brukere</h1>
            {loadingUsers ? (
              <div className="admin-loading">Laster brukere...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
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
                    {users.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Ingen brukere funnet</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>
                          <span className={`admin-role-badge${u.role === 'admin' ? ' admin' : ''}`}>{u.role || 'user'}</span>
                        </td>
                        <td>{u.plan || 'free'}</td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('nb-NO') : '—'}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="admin-action-btn" onClick={() => promoteUser(u.id)}>
                              Gjør admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BLOG */}
        {tab === 'blog' && (
          <div className="admin-content">
            <h1 className="admin-title">Blogg</h1>

            {/* Editor */}
            <div className="admin-blog-editor">
              <h2 className="admin-section-title">{editingPost ? 'Rediger innlegg' : 'Nytt innlegg'}</h2>
              <input
                className="admin-input"
                placeholder="Tittel"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <textarea
                className="admin-textarea"
                placeholder="Innhold (Markdown støttes)"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={8}
              />
              {postMsg && <p className={`admin-msg${postMsg.startsWith('Feil') ? ' error' : ''}`}>{postMsg}</p>}
              <div className="admin-editor-actions">
                <button className="admin-btn-primary" onClick={savePost} disabled={savingPost}>
                  {savingPost ? 'Lagrer...' : editingPost ? 'Oppdater' : 'Lagre utkast'}
                </button>
                {editingPost && (
                  <button className="admin-btn-ghost" onClick={() => { setEditingPost(null); setNewTitle(''); setNewContent('') }}>
                    Avbryt
                  </button>
                )}
              </div>
            </div>

            {/* Post list */}
            <h2 className="admin-section-title" style={{ marginTop: '2rem' }}>Innlegg</h2>
            {loadingPosts ? (
              <div className="admin-loading">Laster innlegg...</div>
            ) : (
              <div className="admin-post-list">
                {posts.length === 0 ? (
                  <p style={{ color: '#888' }}>Ingen innlegg ennå.</p>
                ) : posts.map(post => (
                  <div key={post.id} className="admin-post-item">
                    <div className="admin-post-info">
                      <span className="admin-post-title">{post.title}</span>
                      <span className={`admin-post-status${post.published ? ' published' : ''}`}>
                        {post.published ? 'Publisert' : 'Utkast'}
                      </span>
                      <span className="admin-post-date">{new Date(post.created_at).toLocaleDateString('nb-NO')}</span>
                    </div>
                    <div className="admin-post-actions">
                      <button className="admin-action-btn" onClick={() => { setEditingPost(post); setNewTitle(post.title); setNewContent(post.content) }}>
                        Rediger
                      </button>
                      <button className="admin-action-btn" onClick={() => togglePublish(post)}>
                        {post.published ? 'Avpubliser' : 'Publiser'}
                      </button>
                      <button className="admin-action-btn danger" onClick={() => deletePost(post.id)}>
                        Slett
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="admin-content">
            <h1 className="admin-title">Analyse</h1>
            <div className="admin-info-box">
              <p>Analysedata vil vises her. Koble til et analyseverkøy (f.eks. Plausible, PostHog) for å se besøksstatistikk.</p>
            </div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">Sidevisninger (7 dager)</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">Unike besøkende</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">Gjennomsnittlig sesjonslengde</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">Avvisningsrate</div>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE */}
        {tab === 'revenue' && (
          <div className="admin-content">
            <h1 className="admin-title">Inntekter</h1>
            <div className="admin-info-box">
              <p>Stripe-integrasjon er klar. Koble til Stripe-nøkler i miljøvariabler for å se reelle inntektsdata.</p>
            </div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">MRR</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">ARR</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">Aktive abonnenter</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">—</div>
                <div className="admin-stat-label">Churn rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
