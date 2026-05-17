'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Tag, Pencil, Trash2 } from 'lucide-react'
import { Note } from '@/lib/notes'
import { useSession } from 'next-auth/react'

export default function NoteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const { data: session } = useSession()
  const isAdmin = !!session

  useEffect(() => {
    if (!id) return
    fetch(`/api/notes/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => { setNote(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) return
    setDeleting(true)
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <>
      <style>{`
        .note-content { font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.85; color: var(--text-muted); }
        .note-content h1 { font-family: 'Syne',sans-serif; font-size: 26px; font-weight:700; margin: 28px 0 10px; color: var(--text-primary); line-height:1.2; }
        .note-content h2 { font-family: 'Syne',sans-serif; font-size: 20px; font-weight:600; margin: 22px 0 8px; color: var(--text-primary); }
        .note-content h3 { font-family: 'Syne',sans-serif; font-size: 17px; font-weight:600; margin: 18px 0 6px; color: var(--text-primary); }
        .note-content p { margin-bottom: 14px; }
        .note-content strong { color: var(--text-primary); font-weight: 600; }
        .note-content em { color: rgba(255,255,255,0.65); font-style: italic; }
        .note-content code {
          font-size: 13px; background: rgba(45,212,191,0.08);
          border: 1px solid rgba(45,212,191,0.18); border-radius: 5px;
          padding: 2px 7px; color: var(--accent);
        }
        .note-content pre {
          background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border);
          border-radius: 12px; padding: 18px 22px; margin: 16px 0; overflow-x: auto;
        }
        .note-content pre code { background:none; border:none; padding:0; color:rgba(255,255,255,0.82); font-size:13px; }
        .note-content ul, .note-content ol { padding-left: 22px; margin: 10px 0 14px; }
        .note-content li { margin: 5px 0; }
        .note-content blockquote {
          border-left: 2px solid var(--accent); margin: 18px 0;
          padding: 6px 0 6px 18px; color: var(--text-muted); font-style: italic;
        }
        .note-content hr { border:none; border-top: 1px solid var(--glass-border); margin: 24px 0; }
        .note-content a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
        .note-content .hand-font { font-family: var(--font-hand); font-size: 1.08em; color: var(--text-primary); }
        .note-content img {
          display: block; max-width: 100%; height: auto;
          border: 1px solid var(--glass-border); border-radius: 10px;
          margin: 18px 0; background: #fff;
        }

        .action-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-border);
          background: var(--glass-bg); font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 500; cursor: pointer;
          transition: all 0.18s ease; text-decoration: none;
          color: var(--text-muted);
        }
        .action-btn:hover { background: var(--glass-hover-bg); border-color: var(--glass-hover-border); }
        .action-btn.danger:hover { border-color: rgba(248,113,113,0.4); color: #f87171; background: rgba(248,113,113,0.06); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.14s; }

        .skeleton-line { height: 16px; border-radius: 8px; background: var(--glass-bg); animation: pulse 1.6s ease-in-out infinite; margin-bottom: 12px; }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="relative z-10" style={{ maxWidth: '1400px', margin: '0 auto', padding: '56px 24px 100px' }}>

          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '40px',
            transition: 'color 0.2s',
          }}>
            <ArrowLeft size={14} /> Back to notes
          </Link>

          {loading ? (
            <div>
              <div className="skeleton-line" style={{ width: '60%', height: '32px', marginBottom: '20px' }} />
              <div className="skeleton-line" style={{ width: '40%', marginBottom: '32px' }} />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-line" style={{ width: `${75 + (i * 5 % 25)}%` }} />
              ))}
            </div>
          ) : !note ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Note not found.
              </p>
              <Link href="/" style={{ color: 'var(--accent)', fontSize: '14px' }}>← Go home</Link>
            </div>
          ) : (
            <>
              <div className="fade-up fade-up-1" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: '999px',
                    background: 'rgba(45,212,191,0.1)', color: 'var(--accent)',
                    border: '1px solid rgba(45,212,191,0.22)',
                  }}>
                    {note.category}
                  </span>
                  {note.tags?.map(tag => (
                    <span key={tag} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>

                <h1 style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px, 4vw, 38px)',
                  fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em',
                  color: 'var(--text-primary)', marginBottom: '16px',
                }}>
                  {note.title}
                </h1>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '12px',
                  paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-subtle)', fontSize: '12px' }}>
                    <Calendar size={12} />
                    {note.date}
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/note/${id}/edit`} className="action-btn">
                        <Pencil size={12} /> Edit
                      </Link>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="action-btn danger"
                      >
                        <Trash2 size={12} /> {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="fade-up fade-up-2 note-content"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </>
          )}
        </div>
      </main>
    </>
  )
}
