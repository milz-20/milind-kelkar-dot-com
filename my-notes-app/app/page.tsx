'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BookOpen, ChartNetwork, Cloud, Code2, Coffee, Cpu, Layers3,
  LibraryBig, MoreHorizontal, Network, Pencil, Plus, Search, ShieldAlert, X
} from 'lucide-react'
import { Note, Topic, CATEGORIES } from '@/lib/notes'
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

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [topicShelves, setTopicShelves] = useState<Topic[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [topicDialog, setTopicDialog] = useState<{
    mode: 'add' | 'rename'
    category?: string
    value: string
    description: string
    saving: boolean
    error: string
  } | null>(null)
  const { data: session } = useSession()
  const isAdmin = !!session

  useEffect(() => {
    Promise.all([
      fetch('/api/notes').then(r => r.json()),
      fetch('/api/topics').then(r => r.json()).catch(() => []),
    ])
      .then(([notesData, topicsData]) => {
        setNotes(notesData)
        setTopicShelves(topicsData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const topicNameByCategory = useMemo(() => {
    const names: Record<string, string> = {}
    topicShelves.forEach(topic => {
      names[topic.category] = topic.name
    })
    return names
  }, [topicShelves])

  const topicDescriptionByCategory = useMemo(() => {
    const descriptions: Record<string, string> = {}
    topicShelves.forEach(topic => {
      if (topic.description) descriptions[topic.category] = topic.description
    })
    return descriptions
  }, [topicShelves])

  const displayTopicName = useCallback((category: string) =>
    topicNameByCategory[category] ?? topicDetails[category]?.label ?? category
  , [topicNameByCategory])

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
    const knownTopics = topicShelves.map(topic => topic.category)
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
          name: displayTopicName(category),
          details: {
            ...(topicDetails[category] ?? {
              description: 'Collected notes and references for this topic.',
              icon: BookOpen,
            }),
            description: topicDescriptionByCategory[category] ??
              topicDetails[category]?.description ??
              'Collected notes and references for this topic.',
          },
        }
      })
      .sort((a, b) => {
        if (a.count === 0 && b.count > 0) return 1
        if (b.count === 0 && a.count > 0) return -1
        return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category)
      })
  }, [notes, topicShelves, displayTopicName, topicDescriptionByCategory])

  const recentNotes = useMemo(() => notes.slice(0, 6), [notes])
  const showLibraryHome = activeCategory === 'All' && !search.trim()
  const activeTopicLabel = displayTopicName(activeCategory)

  const refreshTopics = async () => {
    const res = await fetch('/api/topics')
    if (!res.ok) throw new Error('Failed to refresh topics')
    setTopicShelves(await res.json())
  }

  const openAddTopicDialog = () => {
    setTopicDialog({ mode: 'add', value: '', description: '', saving: false, error: '' })
  }

  const openRenameTopicDialog = (category: string, currentName: string, currentDescription: string) => {
    setTopicDialog({
      mode: 'rename',
      category,
      value: currentName,
      description: currentDescription,
      saving: false,
      error: '',
    })
  }

  const closeTopicDialog = () => {
    if (topicDialog?.saving) return
    setTopicDialog(null)
  }

  const handleTopicDialogSubmit = async () => {
    if (!topicDialog) return

    const name = topicDialog.value.trim()
    const description = topicDialog.description.trim()
    if (!name) {
      setTopicDialog({ ...topicDialog, error: 'Add a shelf name.' })
      return
    }

    setTopicDialog({ ...topicDialog, saving: true, error: '' })

    const res = topicDialog.mode === 'add'
      ? await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      : await fetch(`/api/topics/${encodeURIComponent(topicDialog.category || '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

    if (!res.ok) {
      setTopicDialog({
        ...topicDialog,
        saving: false,
        error: topicDialog.mode === 'add'
          ? 'Could not add that topic shelf.'
          : 'Could not rename that topic shelf.',
      })
      return
    }

    await refreshTopics()
    setTopicDialog(null)
  }

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
          font-family: var(--font-hand);
          font-weight: 700;
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

        .section-actions {
          display: flex; align-items: center; gap: 10px;
        }

        .shelf-action-btn, .topic-edit-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.025);
          color: var(--text-muted);
          cursor: pointer; transition: all 0.15s ease;
        }

        .shelf-action-btn {
          height: 32px; border-radius: 10px; padding: 0 11px;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600;
        }

        .shelf-action-btn:hover, .topic-edit-btn:hover {
          color: var(--accent); border-color: rgba(45,212,191,0.3);
          background: rgba(45,212,191,0.06);
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

        .topic-card-tools {
          display: flex; align-items: center; gap: 7px;
        }

        .topic-edit-btn {
          width: 28px; height: 28px; border-radius: 9px;
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

        .dialog-backdrop {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; background: rgba(0,0,0,0.58);
          backdrop-filter: blur(10px);
        }

        .topic-dialog {
          width: min(420px, 100%);
          border: 1px solid var(--glass-border);
          background: rgba(18,18,22,0.96);
          border-radius: 14px; padding: 22px;
          box-shadow: 0 20px 70px rgba(0,0,0,0.45);
        }

        .dialog-title {
          font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
          color: var(--text-primary); margin-bottom: 8px;
        }

        .dialog-copy {
          font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 18px;
        }

        .dialog-input {
          width: 100%; height: 42px; border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.04);
          color: var(--text-primary); outline: none;
          padding: 0 12px; font-size: 14px; caret-color: var(--accent);
        }

        .dialog-textarea {
          width: 100%; min-height: 96px; resize: vertical; border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.04);
          color: var(--text-primary); outline: none;
          padding: 10px 12px; font-size: 13px; line-height: 1.55;
          caret-color: var(--accent); margin-top: 10px;
        }

        .dialog-input:focus, .dialog-textarea:focus { border-color: rgba(45,212,191,0.35); }

        .dialog-error {
          color: #f87171; font-size: 12px; margin-top: 10px;
        }

        .dialog-actions {
          display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;
        }

        .dialog-btn {
          height: 38px; border-radius: 10px; padding: 0 14px;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.16s ease;
        }

        .dialog-btn.secondary {
          border: 1px solid var(--glass-border);
          background: transparent; color: var(--text-muted);
        }

        .dialog-btn.primary {
          border: 1px solid rgba(45,212,191,0.35);
          background: rgba(45,212,191,0.12); color: var(--accent);
        }

        .dialog-btn:disabled {
          opacity: 0.55; cursor: not-allowed;
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
            {[{ category: 'All', name: 'All' }, ...topicShelves].map(topic => (
              <button
                key={topic.category}
                className={`filter-chip ${activeCategory === topic.category ? 'active' : ''}`}
                onClick={() => setActiveCategory(topic.category)}
              >
                {topic.name}
                <span>{categoryCounts[topic.category] || 0}</span>
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
                  <div className="section-actions">
                    <span className="section-meta">{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
                    {isAdmin && (
                      <button className="shelf-action-btn" onClick={openAddTopicDialog}>
                        <Plus size={12} /> Add Shelf
                      </button>
                    )}
                  </div>
                </div>
                <div className="topic-grid">
                  {topics.map(({ category, count, latest, name, details }) => {
                    const TopicIcon = details.icon

                    return (
                      <div
                        key={category}
                        className="topic-card"
                        onClick={() => setActiveCategory(category)}
                        onKeyDown={event => event.key === 'Enter' && setActiveCategory(category)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${displayTopicName(category)} notes`}
                      >
                        <div className="topic-top">
                          <span className="topic-icon">
                            <TopicIcon size={18} color="var(--accent)" />
                          </span>
                          <span className="topic-card-tools">
                            {isAdmin && (
                              <button
                                className="topic-edit-btn"
                                onClick={event => {
                                  event.stopPropagation()
                                  openRenameTopicDialog(category, name, details.description)
                                }}
                                aria-label={`Rename ${name}`}
                                title="Rename shelf"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                            <span className="topic-count">
                              {count} {count === 1 ? 'note' : 'notes'}
                            </span>
                          </span>
                        </div>

                        <h3 className="topic-title">{name}</h3>
                        <p className="topic-description">{details.description}</p>
                        <p className="topic-latest">
                          {latest ? `Latest: ${latest.title}` : 'No notes in this topic yet.'}
                        </p>
                      </div>
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
                      <NoteCard key={note.id} note={note} getTopicName={displayTopicName} />
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
                    <NoteCard key={note.id} note={note} getTopicName={displayTopicName} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {topicDialog && (
          <div
            className="dialog-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-dialog-title"
            onMouseDown={closeTopicDialog}
          >
            <div className="topic-dialog" onMouseDown={event => event.stopPropagation()}>
              <h2 id="topic-dialog-title" className="dialog-title">
                {topicDialog.mode === 'add' ? 'Add Topic Shelf' : 'Rename Topic Shelf'}
              </h2>
              <p className="dialog-copy">
                {topicDialog.mode === 'add'
                  ? 'Create a shelf for a new group of notes and describe what belongs there.'
                  : 'Change the display name or summary for this shelf. Existing notes stay in the same category.'}
              </p>
              <input
                className="dialog-input"
                value={topicDialog.value}
                onChange={event => setTopicDialog({ ...topicDialog, value: event.target.value, error: '' })}
                onKeyDown={event => {
                  if (event.key === 'Enter') handleTopicDialogSubmit()
                  if (event.key === 'Escape') closeTopicDialog()
                }}
                autoFocus
                placeholder="e.g. Distributed Systems"
              />
              <textarea
                className="dialog-textarea"
                value={topicDialog.description}
                onChange={event => setTopicDialog({ ...topicDialog, description: event.target.value, error: '' })}
                onKeyDown={event => {
                  if (event.key === 'Escape') closeTopicDialog()
                }}
                placeholder="Write a short shelf summary..."
              />
              {topicDialog.error && (
                <p className="dialog-error">{topicDialog.error}</p>
              )}
              <div className="dialog-actions">
                <button
                  className="dialog-btn secondary"
                  onClick={closeTopicDialog}
                  disabled={topicDialog.saving}
                >
                  Cancel
                </button>
                <button
                  className="dialog-btn primary"
                  onClick={handleTopicDialogSubmit}
                  disabled={topicDialog.saving}
                >
                  {topicDialog.saving ? 'Saving...' : topicDialog.mode === 'add' ? 'Add Shelf' : 'Save Shelf'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

function NoteCard({ note, getTopicName }: { note: Note; getTopicName: (category: string) => string }) {
  return (
    <Link href={`/note/${note.id}`} className="note-card">
      <div className="note-meta-row">
        <span className="category-pill">{getTopicName(note.category)}</span>
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
