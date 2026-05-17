'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from 'next/link'
import {
  ArrowLeft, Bold, Italic, Code, Heading1, Heading2,
  List, ListOrdered, Quote, Minus, RotateCcw, RotateCw, ImagePlus, Signature
} from 'lucide-react'
import { CATEGORIES, Note, Topic } from '@/lib/notes'
import { imageFileToDataUrl } from '@/lib/editor-images'
import { HandFont } from '@/lib/hand-font'

export default function EditNotePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [category, setCategory] = useState('Other')
  const [topics, setTopics] = useState<Topic[]>(
    CATEGORIES.filter(c => c !== 'All').map(c => ({ id: c, category: c, name: c }))
  )
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      HandFont,
      Placeholder.configure({ placeholder: "What's on your mind? Start writing…" }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'note-editor' },
    },
  })

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Topic[]) => setTopics(data))
      .catch(() => {})
  }, [])

  // Fetch existing note and populate fields
  useEffect(() => {
    if (!id || !editor) return
    fetch(`/api/notes/${id}`)
      .then(r => r.json())
      .then((note: Note) => {
        setTitle(note.title)
        setCategory(note.category || 'Other')
        setTags(note.tags?.join(', ') || '')
        editor.commands.setContent(note.content || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, editor])

  const handleSave = async () => {
    if (!title.trim()) { setError('Please add a title.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: editor?.getHTML() ?? '',
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error()
      router.push(`/note/${id}`)
    } catch {
      setError('Failed to save. Check your connection.')
      setSaving(false)
    }
  }

  const handleImageImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !editor) return

    setError('')
    try {
      const src = await imageFileToDataUrl(file)
      editor.chain().focus().setImage({ src, alt: file.name }).run()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import that image.')
    }
  }

  const openImagePicker = () => {
    document.getElementById('edit-note-image-input')?.click()
  }

  const toolbarGroups = [
    [
      { icon: <Heading1 size={15} />, label: 'H1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor?.isActive('heading', { level: 1 }) ?? false },
      { icon: <Heading2 size={15} />, label: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor?.isActive('heading', { level: 2 }) ?? false },
    ],
    [
      { icon: <Bold size={15} />, label: 'Bold', action: () => editor?.chain().focus().toggleBold().run(), isActive: () => editor?.isActive('bold') ?? false },
      { icon: <Italic size={15} />, label: 'Italic', action: () => editor?.chain().focus().toggleItalic().run(), isActive: () => editor?.isActive('italic') ?? false },
      { icon: <Code size={15} />, label: 'Code', action: () => editor?.chain().focus().toggleCode().run(), isActive: () => editor?.isActive('code') ?? false },
      { icon: <Signature size={15} />, label: 'Handwritten font', action: () => editor?.chain().focus().toggleMark('handFont').run(), isActive: () => editor?.isActive('handFont') ?? false },
    ],
    [
      { icon: <List size={15} />, label: 'Bullet list', action: () => editor?.chain().focus().toggleBulletList().run(), isActive: () => editor?.isActive('bulletList') ?? false },
      { icon: <ListOrdered size={15} />, label: 'Ordered list', action: () => editor?.chain().focus().toggleOrderedList().run(), isActive: () => editor?.isActive('orderedList') ?? false },
      { icon: <Quote size={15} />, label: 'Blockquote', action: () => editor?.chain().focus().toggleBlockquote().run(), isActive: () => editor?.isActive('blockquote') ?? false },
      { icon: <Minus size={15} />, label: 'Divider', action: () => editor?.chain().focus().setHorizontalRule().run(), isActive: () => false },
    ],
    [
      { icon: <ImagePlus size={15} />, label: 'Insert image', action: openImagePicker, isActive: () => false },
      { icon: <RotateCcw size={15} />, label: 'Undo', action: () => editor?.chain().focus().undo().run(), isActive: () => false },
      { icon: <RotateCw size={15} />, label: 'Redo', action: () => editor?.chain().focus().redo().run(), isActive: () => false },
    ],
  ]

  return (
    <>
      <style>{`
        .note-editor {
          min-height: 680px; outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; line-height: 1.8;
          color: var(--text-primary);
          caret-color: var(--accent);
        }
        .note-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--text-subtle); float: left; height: 0; pointer-events: none;
        }
        .note-editor h1 { font-family:'Syne',sans-serif; font-size:26px; font-weight:700; margin:22px 0 8px; color:var(--text-primary); }
        .note-editor h2 { font-family:'Syne',sans-serif; font-size:19px; font-weight:600; margin:18px 0 6px; color:var(--text-primary); }
        .note-editor strong { font-weight:600; }
        .note-editor em { color:rgba(255,255,255,0.7); font-style:italic; }
        .note-editor code { font-size:13px; background:rgba(45,212,191,0.08); border:1px solid rgba(45,212,191,0.18); border-radius:5px; padding:2px 7px; color:var(--accent); }
        .note-editor pre { background:rgba(0,0,0,0.35); border:1px solid var(--glass-border); border-radius:10px; padding:16px 20px; margin:14px 0; overflow-x:auto; }
        .note-editor pre code { background:none; border:none; padding:0; color:rgba(255,255,255,0.8); }
        .note-editor ul, .note-editor ol { padding-left:22px; margin:8px 0; color:var(--text-muted); }
        .note-editor li { margin:3px 0; }
        .note-editor blockquote { border-left:2px solid var(--accent); margin:14px 0; padding:4px 0 4px 16px; color:var(--text-muted); font-style:italic; }
        .note-editor hr { border:none; border-top:1px solid var(--glass-border); margin:20px 0; }
        .note-editor .hand-font { font-family:var(--font-hand); font-size:1.08em; color:var(--text-primary); }
        .note-editor img { display:block; max-width:100%; height:auto; border:1px solid var(--glass-border); border-radius:10px; margin:16px 0; background:#fff; }

        .toolbar-btn { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; border:none; background:transparent; color:var(--text-muted); cursor:pointer; transition:all 0.15s ease; }
        .toolbar-btn:hover { background:rgba(255,255,255,0.07); color:var(--text-primary); }
        .toolbar-btn.active { background:var(--accent-dim); color:var(--accent); }
        .toolbar-divider { width:1px; height:20px; background:var(--glass-border); margin:0 4px; }

        .cat-select { background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:10px; color:var(--text-primary); font-family:'DM Sans',sans-serif; font-size:13px; padding:8px 14px; outline:none; cursor:pointer; transition:border-color 0.2s; appearance:none; -webkit-appearance:none; min-width:180px; }
        .cat-select:focus { border-color:rgba(45,212,191,0.4); }
        .cat-select option { background:#16161a; }

        .field-input { width:100%; background:transparent; border:none; border-bottom:1px solid var(--glass-border); outline:none; color:var(--text-primary); padding:0 0 13px 0; caret-color:var(--accent); transition:border-color 0.2s; }
        .field-input:focus { border-bottom-color:rgba(45,212,191,0.4); }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="relative z-10" style={{ maxWidth: '1400px', margin: '0 auto', padding: '56px 24px 80px' }}>

          <Link href={`/note/${id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '36px',
          }}>
            <ArrowLeft size={14} /> Back to note
          </Link>

          <div style={{ marginBottom: '32px' }}>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontSize: '11px',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: '10px'
            }}>Editing note</p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 700,
              color: 'var(--text-primary)', lineHeight: 1.2
            }}>
              Make your changes
            </h1>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>
              Loading note…
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Note title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="field-input"
                style={{ fontSize: '20px', fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '16px' }}
              />

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', fontFamily: 'Syne, sans-serif' }}>
                    Category
                  </label>
                  <select className="cat-select" value={category} onChange={e => setCategory(e.target.value)}>
                    {topics.map(topic => (
                      <option key={topic.category} value={topic.category}>{topic.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', fontFamily: 'Syne, sans-serif' }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EC2, S3, Lambda"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="field-input"
                    style={{ fontSize: '13px', paddingBottom: '8px' }}
                  />
                </div>
              </div>

              <div className="glass" style={{ padding: 0, marginBottom: '20px' }}>
                <input
                  id="edit-note-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageImport}
                  style={{ display: 'none' }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '2px',
                  padding: '10px 14px', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap',
                }}>
                  {toolbarGroups.map((group, gi) => (
                    <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {gi > 0 && <div className="toolbar-divider" />}
                      {group.map(btn => (
                        <button
                          key={btn.label} onClick={btn.action} title={btn.label}
                          className={`toolbar-btn ${btn.isActive() ? 'active' : ''}`}
                        >
                          {btn.icon}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '22px 26px' }}>
                  <EditorContent editor={editor} />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>{error}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '11px 32px', borderRadius: '12px', border: 'none',
                    background: saving ? 'rgba(45,212,191,0.4)' : 'var(--accent)',
                    color: '#0e0e11', fontSize: '13px', fontFamily: 'Syne, sans-serif',
                    fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 22px var(--accent-glow)', transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
