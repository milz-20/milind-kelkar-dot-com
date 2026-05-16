'use client'

import { useEffect, useState, useMemo } from 'react'
import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  Plus, BookOpen, Search, X, SlidersHorizontal, ArrowLeft, ChartNetwork, Cloud,
  Code2, Coffee, Cpu, Layers3, MoreHorizontal, Network, ShieldAlert
} from 'lucide-react'
import { Note, CATEGORIES } from '@/lib/notes'
import { useSession, signIn, signOut } from 'next-auth/react'

const topicDetails: Record<string, { description: string; icon: ComponentType<{ size?: number; color?: string }> }> = {
  AWS: { description: 'Cloud services, architecture notes, and deployment lessons.', icon: Cloud },
  Java: { description: 'Language concepts, backend patterns, and everyday Java notes.', icon: Coffee },
  'Computer Fundamentals': { description: 'Core CS concepts, operating systems, networking, and foundations.', icon: Cpu },
  'Node.js': { description: 'Server-side JavaScript, APIs, tooling, and runtime behavior.', icon: Code2 },
  'Next.js': { description: 'React framework notes, routing, rendering, and app structure.', icon: Layers3 },
  'Web Vulnerabilities': { description: 'Security bugs, attack paths, defenses, and practical web risk.', icon: ShieldAlert },
  DDD: { description: 'Domain modeling, bounded contexts, aggregates, and design choices.', icon: ChartNetwork },
  Design: { description: 'System design, architecture tradeoffs, services, and data flow.', icon: Network },
  Other: { description: 'Loose ideas and useful notes that do not fit one neat shelf.', icon: MoreHorizontal },
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        n.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [notes, activeCategory, search])

  const showTopicOverview = activeCategory === 'All' && !search.trim()

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

    return [...knownTopics, ...Array.from(new Set(discoveredTopics))].map(category => {
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
  }, [notes])

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.22s; }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 700; line-height: 1.1;
          letter-spacing: -0.02em; color: var(--text-primary);
        }
        .accent-word {
          color: var(--accent); position: relative; display: inline-block;
        }
        .accent-word::after {
          content: ''; position: absolute; bottom: 2px; left: 0;
          width: 100%; height: 2px; background: var(--accent);
          opacity: 0.3; border-radius: 2px;
        }

        .new-note-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 26px; border-radius: 999px;
          border: 1px solid rgba(45,212,191,0.35);
          background: rgba(45,212,191,0.06); color: var(--accent);
          font-family: 'Syne', sans-serif; font-size: 13px;
          font-weight: 600; letter-spacing: 0.04em;
          cursor: pointer; text-decoration: none; transition: all 0.2s ease;
        }
        .new-note-btn:hover {
          background: rgba(45,212,191,0.13);
          border-color: rgba(45,212,191,0.6);
          box-shadow: 0 0 20px rgba(45,212,191,0.15);
          transform: translateY(-1px);
        }

        .auth-btn {
          background: transparent; border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 8px 14px;
          font-family: 'Syne', sans-serif; font-size: 12px;
          cursor: pointer; transition: all 0.2s;
          backdrop-filter: blur(16px);
        }

        .sidebar {
          position: fixed; top: 0; left: 0;
          height: 100vh; width: 220px;
          background: rgba(14, 14, 17, 0.08);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-right: 1px solid rgba(255,255,255,0.04);
          z-index: 50; padding: 28px 16px;
          display: flex; flex-direction: column; gap: 6px;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        .sidebar.open { transform: translateX(0); }

        .sidebar-close {
          position: absolute; top: 16px; right: 14px;
          background: transparent; border: none;
          color: var(--text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 4px; border-radius: 6px; transition: color 0.15s;
        }
        .sidebar-close:hover { color: var(--text-primary); }

        .sidebar-label {
          font-family: 'Syne', sans-serif; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--text-subtle); padding: 0 8px; margin: 10px 0 6px;
        }

        .search-input-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 8px 12px; margin-bottom: 6px;
        }
        .search-input {
          background: transparent; border: none; outline: none;
          color: var(--text-primary); font-family: 'DM Sans', sans-serif;
          font-size: 13px; width: 100%; caret-color: var(--accent);
        }
        .search-input::placeholder { color: var(--text-subtle); }

        .cat-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 10px; border-radius: 9px;
          border: 1px solid transparent; background: transparent;
          color: var(--text-muted); font-family: 'DM Sans', sans-serif;
          font-size: 13px; cursor: pointer; transition: all 0.15s ease;
          text-align: left; width: 100%;
        }
        .cat-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
        .cat-item.active {
          background: rgba(45,212,191,0.08);
          border-color: rgba(45,212,191,0.2); color: var(--accent); font-weight: 500;
        }
        .cat-count {
          font-size: 11px; color: var(--text-subtle);
          background: rgba(255,255,255,0.05); padding: 1px 7px; border-radius: 999px;
        }
        .cat-item.active .cat-count { color: var(--accent); background: rgba(45,212,191,0.1); }

        .sidebar-toggle {
          position: fixed; top: 20px; left: 20px; z-index: 60;
          display: flex; align-items: center; gap: 7px;
          background: rgba(14,14,17,0.7); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 10px;
          padding: 8px 14px; color: var(--text-muted);
          font-family: 'Syne', sans-serif; font-size: 12px;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-toggle.shifted { left: 232px; }
        .sidebar-toggle:hover { color: var(--accent); border-color: rgba(45,212,191,0.3); }

        .notes-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        @media (max-width: 900px) { .notes-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .notes-grid { grid-template-columns: 1fr; } }

        .note-card {
          display: flex; flex-direction: column; text-decoration: none;
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: 14px; padding: 18px 20px;
          cursor: pointer; transition: all 0.22s ease; height: 100%;
        }
        .note-card:hover {
          background: var(--glass-hover-bg); border-color: var(--glass-hover-border);
          box-shadow: 0 0 20px var(--accent-glow), 0 6px 28px rgba(0,0,0,0.35);
          transform: translateY(-2px);
        }

        .topic-card {
          min-height: 176px; text-align: left; color: inherit;
        }
        .topic-card-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; margin-bottom: 18px;
        }
        .topic-icon {
          width: 38px; height: 38px; border-radius: 12px;
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
          font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
          color: var(--text-primary); line-height: 1.25; margin-bottom: 8px;
        }
        .topic-description {
          font-size: 12px; line-height: 1.6; color: var(--text-muted);
          margin-bottom: 16px;
        }
        .topic-latest {
          margin-top: auto; padding-top: 12px; border-top: 1px solid var(--glass-border);
          font-size: 11px; line-height: 1.45; color: var(--text-subtle);
        }

        .back-topic-btn {
          display: inline-flex; align-items: center; gap: 7px;
          border: 1px solid var(--glass-border); background: var(--glass-bg);
          color: var(--text-muted); border-radius: 10px;
          padding: 8px 12px; margin-bottom: 18px;
          font-family: 'Syne', sans-serif; font-size: 12px;
          cursor: pointer; transition: all 0.18s ease;
        }
        .back-topic-btn:hover { color: var(--accent); border-color: rgba(45,212,191,0.3); }

        .divider-label {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }
        .divider-label span {
          font-family: 'Syne', sans-serif; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--text-subtle); white-space: nowrap;
        }
        .divider-label::before, .divider-label::after {
          content: ''; flex: 1; height: 1px; background: var(--glass-border);
        }

        .skeleton {
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: 14px; height: 140px;
          animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }

        .empty-state {
          text-align: center; padding: 60px 0;
          color: var(--text-subtle); font-family: 'Syne', sans-serif; font-size: 14px;
        }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        {/* Sidebar toggle */}
        <button
          className={`sidebar-toggle ${sidebarOpen ? 'shifted' : ''}`}
          onClick={() => setSidebarOpen(o => !o)}
        >
          <SlidersHorizontal size={13} />
          {activeCategory !== 'All' ? activeCategory : 'Filter'}
        </button>

        {/* Top right auth button */}
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 60 }}>
          {session ? (
            <button
              className="auth-btn"
              onClick={() => signOut()}
              style={{ color: 'var(--text-muted)' }}
            >
              Sign out
            </button>
          ) : (
            <button
              className="auth-btn"
              onClick={() => signIn()}
              style={{
                color: 'var(--accent)',
                background: 'rgba(45,212,191,0.06)',
                borderColor: 'rgba(45,212,191,0.35)',
              }}
            >
              Sign in
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={14} />
          </button>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', marginTop: '4px' }}>
            Browse
          </p>
          <div className="search-input-wrap">
            <Search size={13} color="var(--text-subtle)" />
            <input
              className="search-input" placeholder="Search notes..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <p className="sidebar-label">Categories</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-item ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat); setSidebarOpen(false) }}
            >
              {cat}
              {categoryCounts[cat] !== undefined && (
                <span className="cat-count">{categoryCounts[cat] || 0}</span>
              )}
            </button>
          ))}
        </div>

        {/* Page content */}
        <div className="relative z-10" style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 28px 80px' }}>

          {/* Hero */}
          <div className="fade-up fade-up-1" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              marginBottom: '20px', padding: '5px 14px', borderRadius: '999px',
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
            }}>
              <BookOpen size={12} color="var(--accent)" />
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                My Knowledge Base
              </span>
            </div>

            <h1 className="hero-title" style={{ marginBottom: '14px' }}>
              Knowledge, <span className="accent-word">captured.</span>
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '28px' }}>
              Things I&apos;m learning — written to understand, not to impress.
            </p>

            {isAdmin && (
              <Link href="/note/new" className="new-note-btn">
                <Plus size={14} strokeWidth={2.5} /> New Note
              </Link>
            )}
          </div>

          {/* Notes grid */}
          <div className="fade-up fade-up-3">
            <div className="divider-label">
              <span>
                {search
                  ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                  : showTopicOverview
                    ? `${topics.length} topics`
                    : `${filtered.length} in ${activeCategory}`
                }
              </span>
            </div>

            {loading ? (
              <div className="notes-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" />)}
              </div>
            ) : showTopicOverview ? (
              <div className="notes-grid">
                {topics.map(({ category, count, latest, details }) => {
                  const TopicIcon = details.icon

                  return (
                    <button
                      key={category}
                      className="note-card topic-card"
                      onClick={() => setActiveCategory(category)}
                      aria-label={`Open ${category} notes`}
                    >
                      <div className="topic-card-head">
                        <span className="topic-icon">
                          <TopicIcon size={18} color="var(--accent)" />
                        </span>
                        <span className="topic-count">
                          {count} {count === 1 ? 'note' : 'notes'}
                        </span>
                      </div>

                      <h2 className="topic-title">{category}</h2>
                      <p className="topic-description">{details.description}</p>

                      <p className="topic-latest">
                        {latest ? `Latest: ${latest.title}` : 'No notes in this topic yet.'}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                {activeCategory !== 'All' && (
                  <button className="back-topic-btn" onClick={() => setActiveCategory('All')}>
                    <ArrowLeft size={13} /> All topics
                  </button>
                )}
                {filtered.length === 0 ? (
                  <div className="empty-state">
                    {search ? `No notes matching "${search}"` : 'No notes in this category yet.'}
                  </div>
                ) : (
                  <div className="notes-grid">
                    {filtered.map(note => (
                      <Link key={note.id} href={`/note/${note.id}`} className="note-card">
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{
                            fontSize: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 600,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '3px 10px', borderRadius: '999px',
                            background: 'rgba(45,212,191,0.1)', color: 'var(--accent)',
                            border: '1px solid rgba(45,212,191,0.2)',
                          }}>
                            {note.category}
                          </span>
                          {note.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>

                        <h2 style={{
                          fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600,
                          marginBottom: '7px', color: 'var(--text-primary)', lineHeight: 1.35, flexGrow: 1,
                        }}>
                          {note.title}
                        </h2>

                        <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '12px' }}>
                          {note.preview}
                        </p>

                        <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: 'auto' }}>
                          {note.date}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
