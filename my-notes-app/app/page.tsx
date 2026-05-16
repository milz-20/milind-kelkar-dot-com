'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BookOpen, ChartNetwork, Cloud, Code2, Coffee, Cpu, Layers3,
  LibraryBig, MoreHorizontal, Network, Plus, Search, ShieldAlert, X
} from 'lucide-react'
import { Note, CATEGORIES } from '@/lib/notes'
import { useSession, signIn, signOut } from 'next-auth/react'

const topicDetails: Record<string, { label?: string; description: string; icon: ComponentType<{ size?: number; color?: string }> }> = {
  AWS: { description: 'Cloud services, architecture notes, and deployment lessons.', icon: Cloud },
  Java: { description: 'Language concepts, backend patterns, and everyday Java notes.', icon: Coffee },
  'Computer Fundamentals': { description: 'Operating systems, networking, databases, and CS foundations.', icon: Cpu },
  'Node.js': { description: 'Server-side JavaScript, APIs, tooling, and runtime behavior.', icon: Code2 },
  'Next.js': { description: 'React framework notes, routing, rendering, and app structure.', icon: Layers3 },
  'Web Vulnerabilities': { description: 'Security bugs, attack paths, defenses, and practical web risk.', icon: ShieldAlert },
  DDD: { description: 'Domain modeling, bounded contexts, aggregates, and design choices.', icon: ChartNetwork },
  Design: { label: 'System Design', description: 'Architecture tradeoffs, services, data flow, and scaling notes.', icon: Network },
  Other: { description: 'Loose ideas and useful notes that do not fit one neat shelf.', icon: MoreHorizontal },
}

const displayTopicName = (category: string) => topicDetails[category]?.label ?? category

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { data: session } = useSession()
  const isAdmin = !!session

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { setNotes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = activeCategory === 'All'
      ? notes
      : notes.filter(n => n.category === activeCategory)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.preview?.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [notes, activeCategory, search])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: notes.length }
    notes.forEach(n => {
      counts[n.category] = (counts[n.category] || 0) + 1
    })
    return counts
  }, [notes])

  const topics = useMemo(() => {
    const knownTopics = CATEGORIES.filter(cat => cat !== 'All')
    const discoveredTopics = notes
      .map(note => note.category)
      .filter(cat => cat && !knownTopics.includes(cat))

    return [...knownTopics, ...Array.from(new Set(discoveredTopics))]
      .map(category => {
        const categoryNotes = notes.filter(note => note.category === category)
        return {
          category,
          count: categoryNotes.length,
          latest: categoryNotes[0],
          details: topicDetails[category] ?? {
            description: 'Collected notes and references for this topic.',
            icon: BookOpen,
          },
        }
      })
      .sort((a, b) => {
        if (a.count === 0 && b.count > 0) return 1
        if (b.count === 0 && a.count > 0) return -1
        return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category)
      })
  }, [notes])

  const recentNotes = useMemo(() => notes.slice(0, 6), [notes])
  const showLibraryHome = activeCategory === 'All' && !search.trim()
  const activeTopicLabel = displayTopicName(activeCategory)

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .library-shell {
          position: relative; z-index: 10;
          max-width: 1180px; margin: 0 auto;
          padding: 28px 24px 72px;
        }

        .library-topbar {
          display: grid; grid-template-columns: minmax(180px, 1fr) minmax(260px, 420px) auto;
          gap: 14px; align-items: center; margin-bottom: 44px;
        }

        .library-brand {
          display: inline-flex; align-items: center; gap: 10px; min-width: 0;
          color: var(--text-primary); text-decoration: none;
        }

        .brand-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(45,212,191,0.08);
          border: 1px solid rgba(45,212,191,0.2);
        }

        .brand-text {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .top-actions {
          display: flex; align-items: center; justify-content: flex-end; gap: 8px;
        }

        .search-box {
          display: flex; align-items: center; gap: 10px;
          height: 42px; padding: 0 13px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
        }

        .search-input {
          background: transparent; border: none; outline: none;
          color: var(--text-primary); font-family: 'DM Sans', sans-serif;
          font-size: 13px; width: 100%; caret-color: var(--accent);
        }
        .search-input::placeholder { color: var(--text-subtle); }

        .icon-clear {
          border: none; background: transparent; color: var(--text-subtle);
          cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          padding: 3px; border-radius: 6px;
        }
        .icon-clear:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }

        .auth-btn, .new-note-btn {
          height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          border-radius: 10px; padding: 0 13px;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.18s ease; text-decoration: none;
          white-space: nowrap;
        }

        .auth-btn {
          background: rgba(255,255,255,0.025); border: 1px solid var(--glass-border);
          color: var(--text-muted);
        }
        .auth-btn:hover { color: var(--text-primary); border-color: rgba(255,255,255,0.14); }

        .new-note-btn {
          border: 1px solid rgba(45,212,191,0.35);
          background: rgba(45,212,191,0.08); color: var(--accent);
        }
        .new-note-btn:hover {
          background: rgba(45,212,191,0.14);
          border-color: rgba(45,212,191,0.55);
          transform: translateY(-1px);
        }

        .library-intro {
          display: grid; grid-template-columns: minmax(0, 1fr) auto;
          gap: 28px; align-items: end; margin-bottom: 34px;
          animation: fadeUp 0.45s ease both;
        }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          margin-bottom: 13px; color: var(--accent);
          font-family: 'Syne', sans-serif; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase;
        }

        .library-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(30px, 4vw, 48px);
          font-weight: 700; line-height: 1.08;
          color: var(--text-primary); margin-bottom: 12px;
        }

        .accent-word {
          color: var(--accent); position: relative; display: inline-block;
        }

        .accent-word::after {
          content: ''; position: absolute; bottom: 2px; left: 0;
          width: 100%; height: 2px; background: var(--accent);
          opacity: 0.45; border-radius: 2px;
        }

        .library-copy {
          max-width: 680px; color: var(--text-muted); font-size: 14px; line-height: 1.7;
          font-style: italic;
        }

        .stat-strip {
          display: grid; grid-template-columns: repeat(2, 120px); gap: 10px;
        }

        .stat {
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.03);
          border-radius: 12px; padding: 14px 16px;
        }

        .stat strong {
          display: block; font-family: 'Syne', sans-serif;
          font-size: 22px; color: var(--text-primary); line-height: 1;
          margin-bottom: 7px;
        }

        .stat span {
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-subtle);
        }

        .section-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin: 32px 0 14px;
        }

        .section-title {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-primary);
        }

        .section-meta {
          font-size: 12px; color: var(--text-subtle);
        }

        .topic-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
          animation: fadeUp 0.5s ease both;
        }

        .topic-card, .note-card {
          display: flex; flex-direction: column;
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-radius: 12px; text-decoration: none;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .topic-card {
          min-height: 168px; padding: 18px; color: inherit; cursor: pointer; text-align: left;
        }

        .topic-card:hover, .note-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(45,212,191,0.26);
          transform: translateY(-2px);
        }

        .topic-top {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 16px;
        }

        .topic-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(45,212,191,0.08);
          border: 1px solid rgba(45,212,191,0.18);
        }

        .topic-count {
          font-size: 11px; color: var(--text-subtle);
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          padding: 4px 9px; border-radius: 999px;
        }

        .topic-title {
          font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
          color: var(--text-primary); line-height: 1.25; margin-bottom: 8px;
        }

        .topic-description {
          font-size: 12px; line-height: 1.55; color: var(--text-muted);
          margin-bottom: 14px;
        }

        .topic-latest {
          margin-top: auto; padding-top: 12px; border-top: 1px solid var(--glass-border);
          color: var(--text-subtle); font-size: 11px; line-height: 1.45;
        }

        .note-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
          animation: fadeUp 0.55s ease both;
        }

        .note-card {
          min-height: 168px; padding: 17px 18px;
          color: inherit;
        }

        .note-meta-row {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 11px;
        }

        .category-pill {
          font-size: 10px; font-family: 'Syne', sans-serif; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 999px;
          background: rgba(45,212,191,0.1); color: var(--accent);
          border: 1px solid rgba(45,212,191,0.2);
        }

        .note-title {
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
          color: var(--text-primary); line-height: 1.35; margin-bottom: 8px;
        }

        .note-preview {
          color: var(--text-muted); font-size: 12px; line-height: 1.6;
          margin-bottom: 14px;
        }

        .note-date {
          margin-top: auto; color: var(--text-subtle); font-size: 11px;
        }

        .filter-row {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin: 0 0 18px;
        }

        .filter-chip {
          display: inline-flex; align-items: center; gap: 6px;
          border: 1px solid var(--glass-border); background: rgba(255,255,255,0.025);
          color: var(--text-muted); border-radius: 999px;
          padding: 7px 11px; font-size: 12px; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.15s ease;
        }
        .filter-chip:hover { color: var(--text-primary); border-color: rgba(255,255,255,0.15); }
        .filter-chip.active {
          color: var(--accent); background: rgba(45,212,191,0.08);
          border-color: rgba(45,212,191,0.24);
        }

        .back-topic-btn {
          display: inline-flex; align-items: center; gap: 7px;
          border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03);
          color: var(--text-muted); border-radius: 10px;
          padding: 8px 12px; margin-bottom: 16px;
          font-family: 'Syne', sans-serif; font-size: 12px;
          cursor: pointer; transition: all 0.18s ease;
        }
        .back-topic-btn:hover { color: var(--accent); border-color: rgba(45,212,191,0.3); }

        .empty-state {
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.025);
          border-radius: 12px; padding: 42px 20px;
          text-align: center; color: var(--text-subtle);
          font-family: 'Syne', sans-serif; font-size: 14px;
        }

        .skeleton {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 12px; height: 168px;
          animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity:0.45; } 50% { opacity:0.8; } }

        @media (max-width: 900px) {
          .library-topbar { grid-template-columns: 1fr; }
          .top-actions { justify-content: flex-start; }
          .library-intro { grid-template-columns: 1fr; }
          .stat-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .topic-grid, .note-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 560px) {
          .library-shell { padding: 22px 18px 56px; }
          .topic-grid, .note-grid { grid-template-columns: 1fr; }
          .section-head { align-items: flex-start; flex-direction: column; gap: 5px; }
          .top-actions { flex-wrap: wrap; }
          .auth-btn, .new-note-btn { flex: 1; min-width: 124px; }
        }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="library-shell">
          <div className="library-topbar">
            <button
              className="library-brand"
              onClick={() => { setActiveCategory('All'); setSearch('') }}
              aria-label="Go to library home"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <span className="brand-icon">
                <LibraryBig size={18} color="var(--accent)" />
              </span>
              <span className="brand-text">Milind&apos;s Library</span>
            </button>

            <div className="search-box">
              <Search size={15} color="var(--text-subtle)" />
              <input
                className="search-input"
                placeholder="Search notes, topics, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="icon-clear" onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </div>

          <div className="top-actions">
              {isAdmin && (
                <Link href="/note/new" className="new-note-btn">
                  <Plus size={14} strokeWidth={2.5} /> New Note
                </Link>
              )}
              {session ? (
                <button className="auth-btn" onClick={() => signOut()}>Sign out</button>
              ) : (
                <button className="auth-btn" onClick={() => signIn()}>Sign in</button>
              )}
            </div>
          </div>

          <section className="library-intro">
            <div>
              <div className="eyebrow">
                <BookOpen size={12} /> My Knowledge Base
              </div>
              <h1 className="library-title">
                Knowledge, <span className="accent-word">captured.</span>
              </h1>
              <p className="library-copy">
                Things I&apos;m learning - written to understand, not to impress.
              </p>
            </div>
            <div className="stat-strip">
              <div className="stat">
                <strong>{notes.length}</strong>
                <span>Notes</span>
              </div>
              <div className="stat">
                <strong>{topics.filter(topic => topic.count > 0).length}</strong>
                <span>Active Topics</span>
              </div>
            </div>
          </section>

          <div className="filter-row" aria-label="Topic filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'All' ? 'All' : displayTopicName(cat)}
                <span>{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <>
              <div className="section-head">
                <h2 className="section-title">Topics</h2>
                <span className="section-meta">Loading library...</span>
              </div>
              <div className="topic-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" />)}
              </div>
            </>
          ) : showLibraryHome ? (
            <>
              <section>
                <div className="section-head">
                  <h2 className="section-title">Topic Shelves</h2>
                  <span className="section-meta">{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="topic-grid">
                  {topics.map(({ category, count, latest, details }) => {
                    const TopicIcon = details.icon

                    return (
                      <button
                        key={category}
                        className="topic-card"
                        onClick={() => setActiveCategory(category)}
                        aria-label={`Open ${displayTopicName(category)} notes`}
                      >
                        <div className="topic-top">
                          <span className="topic-icon">
                            <TopicIcon size={18} color="var(--accent)" />
                          </span>
                          <span className="topic-count">
                            {count} {count === 1 ? 'note' : 'notes'}
                          </span>
                        </div>

                        <h3 className="topic-title">{displayTopicName(category)}</h3>
                        <p className="topic-description">{details.description}</p>
                        <p className="topic-latest">
                          {latest ? `Latest: ${latest.title}` : 'No notes in this topic yet.'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section>
                <div className="section-head">
                  <h2 className="section-title">Recent Notes</h2>
                  <span className="section-meta">Latest additions</span>
                </div>
                {recentNotes.length === 0 ? (
                  <div className="empty-state">No notes yet.</div>
                ) : (
                  <div className="note-grid">
                    {recentNotes.map(note => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section>
              <div className="section-head">
                <h2 className="section-title">
                  {search ? 'Search Results' : activeTopicLabel}
                </h2>
                <span className="section-meta">
                  {search
                    ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                    : `${filtered.length} note${filtered.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {activeCategory !== 'All' && (
                <button className="back-topic-btn" onClick={() => setActiveCategory('All')}>
                  <ArrowLeft size={13} /> All topics
                </button>
              )}

              {filtered.length === 0 ? (
                <div className="empty-state">
                  {search ? `No notes matching "${search}"` : 'No notes in this topic yet.'}
                </div>
              ) : (
                <div className="note-grid">
                  {filtered.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function NoteCard({ note }: { note: Note }) {
  return (
    <Link href={`/note/${note.id}`} className="note-card">
      <div className="note-meta-row">
        <span className="category-pill">{displayTopicName(note.category)}</span>
        {note.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <h3 className="note-title">{note.title}</h3>
      <p className="note-preview">{note.preview}</p>
      <p className="note-date">{note.date}</p>
    </Link>
  )
}
