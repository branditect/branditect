'use client'

import { useState, useEffect, useRef } from 'react'
import { useBrand } from '@/lib/useBrand'

interface Note {
  id: number
  brand_id: string
  content: string
  title: string
  is_draft: boolean
  is_favorite: boolean
  created_at: string
}

export default function NotesPage() {
  const { brandId, loading: brandLoading } = useBrand()

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load notes
  useEffect(() => {
    if (brandLoading || brandId === 'default') return
    fetch(`/api/mission-board/notes?brandId=${brandId}`)
      .then(r => r.json())
      .then(d => {
        const all = (d.data || []) as Note[]
        setNotes(all)
        if (all.length > 0) {
          setActiveNote(all[0])
          setEditTitle(all[0].title || '')
          setEditContent(all[0].content || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [brandId, brandLoading])

  // Auto-save on edit
  function scheduleAutoSave(noteId: number, title: string, content: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      await fetch('/api/mission-board/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, title, content }),
      })
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title, content } : n))
      setSaving(false)
      setLastSaved('Saved')
      setTimeout(() => setLastSaved(''), 2000)
    }, 800)
  }

  function selectNote(note: Note) {
    setActiveNote(note)
    setEditTitle(note.title || '')
    setEditContent(note.content || '')
  }

  async function createNote() {
    const res = await fetch('/api/mission-board/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, content: '', title: 'Untitled Note' }),
    })
    const json = await res.json()
    if (json.data) {
      setNotes(prev => [json.data, ...prev])
      selectNote(json.data)
    }
  }

  async function deleteNote(id: number) {
    await fetch('/api/mission-board/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeNote?.id === id) {
      const remaining = notes.filter(n => n.id !== id)
      if (remaining.length > 0) selectNote(remaining[0])
      else { setActiveNote(null); setEditTitle(''); setEditContent('') }
    }
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const filtered = searchQuery
    ? notes.filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : notes

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8d7169', fontSize: 13 }}>Loading notes...</div>
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "var(--font-manrope), 'Manrope', sans-serif" }}>

      {/* ═══ LEFT: Notes List ═══ */}
      <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f3f6fc', borderRight: '1px solid rgba(225,191,182,0.1)' }}>
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#1a1c1e' }}>Notes</h2>
            <button
              onClick={createNote}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#ec5c36', color: '#fff', border: 'none', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(236,92,54,0.2)' }}
            >
              + New Note
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="7" cy="7" r="5" stroke="#8d7169" strokeWidth="1.3"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#8d7169" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', background: '#fff', border: '2px solid transparent', borderRadius: 12, fontSize: 13, color: '#1a1c1e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(236,92,54,0.3)' }}
              onBlur={e => { e.target.style.borderColor = 'transparent' }}
            />
          </div>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#8d7169', fontSize: 13 }}>
              {searchQuery ? 'No matching notes' : 'No notes yet. Create one to get started.'}
            </div>
          ) : filtered.map(note => {
            const isActive = activeNote?.id === note.id
            return (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                style={{
                  padding: '16px 18px', borderRadius: 14, marginBottom: 6, cursor: 'pointer',
                  background: isActive ? '#fff' : 'transparent',
                  borderLeft: isActive ? '4px solid #ec5c36' : '4px solid transparent',
                  boxShadow: isActive ? '0 2px 12px rgba(26,28,30,0.04)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#ec5c36' : '#8d7169', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {note.is_draft ? 'Draft' : note.is_favorite ? 'Starred' : 'Note'} · {timeAgo(note.created_at)}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                    style={{ background: 'none', border: 'none', color: '#e1bfb6', cursor: 'pointer', fontSize: 14, opacity: 0.5, padding: 0 }}
                  >&times;</button>
                </div>
                <h3 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#1a1c1e', marginBottom: 4, lineHeight: 1.35 }}>
                  {note.title || 'Untitled'}
                </h3>
                <p style={{ fontSize: 13, color: '#44474e', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {note.content || 'Empty note...'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ RIGHT: Note Editor ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: '1px solid #f3f6fc', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, background: '#f3f6fc', borderRadius: 8 }}>
                {['B', 'I', 'List', 'Link', 'Quote'].map(tool => (
                  <button key={tool} style={{ padding: '6px 8px', background: 'transparent', border: 'none', color: '#44474e', cursor: 'pointer', borderRadius: 4, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>{tool}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#8d7169' }}>{saving ? 'Saving...' : lastSaved}</span>
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  style={{ padding: '6px 12px', background: '#f3f6fc', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#44474e', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '48px 48px 120px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <input
                value={editTitle}
                onChange={e => {
                  setEditTitle(e.target.value)
                  scheduleAutoSave(activeNote.id, e.target.value, editContent)
                }}
                placeholder="Untitled Note"
                style={{
                  width: '100%', border: 'none', outline: 'none', padding: 0, marginBottom: 24,
                  fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                  fontSize: 40, fontWeight: 800, color: '#1a1c1e', background: 'transparent',
                  letterSpacing: '-0.02em', lineHeight: 1.15,
                }}
              />
              <textarea
                value={editContent}
                onChange={e => {
                  setEditContent(e.target.value)
                  scheduleAutoSave(activeNote.id, editTitle, e.target.value)
                  // Auto-resize
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                ref={el => { if (el && el.scrollHeight > el.clientHeight) el.style.height = el.scrollHeight + 'px' }}
                placeholder="Start writing..."
                style={{
                  width: '100%', border: 'none', outline: 'none', padding: 0, resize: 'none',
                  fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
                  fontSize: 16, color: '#1a1c1e', background: 'transparent',
                  lineHeight: 1.8, minHeight: 300, overflow: 'hidden',
                }}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#ffdbd1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#ec5c36' }}>N</div>
            <h3 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1c1e' }}>No note selected</h3>
            <p style={{ fontSize: 13, color: '#8d7169', maxWidth: 240, textAlign: 'center', lineHeight: 1.5 }}>Select a note from the list or create a new one to start writing.</p>
            <button
              onClick={createNote}
              style={{ padding: '10px 24px', background: '#ec5c36', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(236,92,54,0.25)', marginTop: 8 }}
            >
              + New Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
