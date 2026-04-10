'use client'

import { useState } from 'react'
import { useBrand } from '@/lib/useBrand'

export default function FloatingNotes() {
  const { brandId } = useBrand()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  async function saveNote() {
    if (!content.trim() || !brandId) return
    setSaving(true)
    try {
      await fetch('/api/mission-board/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, content: content.trim() }),
      })
      setContent('')
      setOpen(false)
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    } catch {}
    setSaving(false)
  }

  return (
    <>
      {open && (
        <div className="glass-panel ambient-shadow" style={{ position: 'fixed', bottom: 80, right: 20, width: 280, zIndex: 1000, borderRadius: 16, padding: 16, fontFamily: "'Inter', sans-serif" }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#2b2f31', marginBottom: 10 }}>Quick note</div>
          <textarea
            value={content} onChange={e => setContent(e.target.value)} placeholder="Write a note..." autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveNote() }}
            style={{ width: '100%', minHeight: 80, fontSize: 13, lineHeight: 1.6, color: '#2b2f31', background: '#f4f7f9', border: 'none', borderRadius: 12, padding: '10px 12px', outline: 'none', resize: 'vertical', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: '#aaaeb0' }}>Saves to Mission Board</span>
            <button onClick={saveNote} disabled={!content.trim() || saving}
              className="signature-gradient"
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: !content.trim() || saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: !content.trim() || saving ? 0.4 : 1 }}
            >{saving ? 'Saving...' : 'Save note'}</button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(p => !p)}
        style={{ position: 'fixed', bottom: 20, right: 20, width: 48, height: 48, borderRadius: 16, background: '#2b2f31', border: 'none', cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 30px rgba(43,47,49,0.15)', transition: 'transform 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.5 2.5L17.5 5.5L7 16H4V13L14.5 2.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5L15 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>

      {toast && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, background: '#2b2f31', color: '#fff', fontSize: 12, padding: '8px 16px', borderRadius: 12, zIndex: 1001, pointerEvents: 'none', fontFamily: "'Inter', sans-serif" }}>Saved</div>
      )}
    </>
  )
}
