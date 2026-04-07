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
      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 80, right: 20, width: 280, zIndex: 1000,
            background: '#fff', border: '0.5px solid #EDEBE8', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 16,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
            Quick note
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a note..."
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveNote() }}
            style={{
              width: '100%', minHeight: 80, fontSize: 12.5, lineHeight: 1.6,
              color: '#3A3835', background: '#F5F4F2', border: '1px solid #EDEBE8',
              borderRadius: 8, padding: '10px 12px', outline: 'none', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 10, color: '#B0ACA4' }}>Saves to Mission Board</span>
            <button
              onClick={saveNote}
              disabled={!content.trim() || saving}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: !content.trim() || saving ? '#EDEBE8' : '#E8562A',
                color: !content.trim() || saving ? '#B0ACA4' : '#fff',
                fontSize: 12, fontWeight: 500, cursor: !content.trim() || saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 48, height: 48,
          borderRadius: '50%', background: '#0D0D0D', border: 'none',
          cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14.5 2.5L17.5 5.5L7 16H4V13L14.5 2.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5L15 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20, background: '#0D0D0D', color: '#fff',
          fontSize: 12, padding: '7px 16px', borderRadius: 20, zIndex: 1001,
          pointerEvents: 'none', fontFamily: "'DM Sans', sans-serif",
        }}>
          Saved
        </div>
      )}
    </>
  )
}
