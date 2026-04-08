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
            background: '#fff', border: '1px solid #C8C9CC', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 16,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>
            Quick note
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a note..."
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveNote() }}
            style={{
              width: '100%', minHeight: 80, fontSize: 13, lineHeight: 1.6,
              color: '#1A1A1A', background: '#F5F4F0', border: '1px solid #C8C9CC',
              borderRadius: 8, padding: '10px 12px', outline: 'none', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: '#888888' }}>Saves to Mission Board</span>
            <button
              onClick={saveNote}
              disabled={!content.trim() || saving}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: !content.trim() || saving ? '#E2E3E6' : '#E16C00',
                color: !content.trim() || saving ? '#888888' : '#fff',
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
          borderRadius: '50%', background: '#315A72', border: 'none',
          cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 4px 16px rgba(49,90,114,0.3)',
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
          position: 'fixed', bottom: 80, right: 20, background: '#315A72', color: '#fff',
          fontSize: 12, padding: '7px 16px', borderRadius: 20, zIndex: 1001,
          pointerEvents: 'none', fontFamily: "'DM Sans', sans-serif",
        }}>
          Saved
        </div>
      )}
    </>
  )
}
