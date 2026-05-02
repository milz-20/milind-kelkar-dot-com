'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { Note, CATEGORIES } from '@/lib/notes'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { setNotes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'All'
    ? notes
    : notes.filter(n => n.category === activeCategory)

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
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        .accent-word {
          color: var(--accent);
          position: relative;
          display: inline-block;
        }
        .accent-word::after {
          content: '';
          position: absolute;
          bottom: 2px; left: 0;
          width: 100%; height: 2px;
          background: var(--accent);
          opacity: 0.3;
          border-radius: 2px;
        }

        .new-note-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 26px;
          border-radius: 999px;
          border: 1px solid rgba(45,212,191,0.35);
          background: rgba(45,212,191,0.06);
          color: var(--accent);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .new-note-btn:hover {
          background: rgba(45,212,191,0.13);
          border-color: rgba(45,212,191,0.6);
          box-shadow: 0 0 20px rgba(45,212,191,0.15);
          transform: translateY(-1px);
        }

        .cat-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .cat-tab {
          padding: 6px 16px;
          border-radius: 999px;
          border: 1px solid var(--glass-border);
          background: transparent;
          color: var(--text-muted);
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .cat-tab:hover {
          border-color: rgba(45,212,191,0.3);
          color: var(--text-primary);
        }
        .cat-tab.active {
          background: var(--accent-dim);
          border-color: rgba(45,212,191,0.4);
          color: var(--accent);
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .notes-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .notes-grid { grid-template-columns: 1fr; }
        }

        .note-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 14px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.22s ease;
          height: 100%;
        }
        .note-card:hover {
          background: var(--glass-hover-bg);
          border-color: var(--glass-hover-border);
          box-shadow: 0 0 20px var(--accent-glow), 0 6px 28px rgba(0,0,0,0.35);
          transform: translateY(-2px);
        }

        .divider-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .divider-label span {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-subtle);
          white-space: nowrap;
        }
        .divider-label::before,
        .divider-label::after {
          content: ''; flex: 1;
          height: 1px;
          background: var(--glass-border);
        }

        .skeleton {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 18px 20px;
          height: 140px;
          animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="relative z-10" style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 28px 80px' }}>

          {/* ── Hero ── */}
          <div className="fade-up fade-up-1" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              marginBottom: '20px', padding: '5px 14px',
              borderRadius: '999px', border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
            }}>
              <BookOpen size={12} color="var(--accent)" />
              <span style={{
                fontFamily: 'Syne, sans-serif', fontSize: '11px',
                letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)',
              }}>
                My Knowledge Base
              </span>
            </div>

            <h1 className="hero-title" style={{ marginBottom: '14px' }}>
              Knowledge, <span className="accent-word">captured.</span>
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '28px' }}>
              Things I'm learning — written to understand, not to impress.
            </p>

            <Link href="/note/new" className="new-note-btn">
              <Plus size={14} strokeWidth={2.5} />
              New Note
            </Link>
          </div>

          {/* ── Category tabs ── */}
          <div className="fade-up fade-up-2" style={{ marginBottom: '36px' }}>
            <div className="cat-tabs">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Notes grid ── */}
          <div className="fade-up fade-up-3">
            <div className="divider-label">
              <span>{filtered.length} {activeCategory === 'All' ? 'notes' : `in ${activeCategory}`}</span>
            </div>

            {loading ? (
              <div className="notes-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-subtle)', fontFamily: 'Syne, sans-serif', fontSize: '14px' }}>
                No notes in this category yet.
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
                      marginBottom: '7px', color: 'var(--text-primary)', lineHeight: 1.35,
                      flexGrow: 1,
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
          </div>

        </div>
      </main>
    </>
  )
}