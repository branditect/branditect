'use client'

import { useState } from 'react'
import AndyPanel from './andy-panel'

export default function AndyTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button in bottom-left, next to floating notes */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'fixed', bottom: 20, right: 80, width: 48, height: 48,
          borderRadius: '50%', background: '#E16C00', border: 'none',
          cursor: 'pointer', zIndex: 150, display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 4px 16px rgba(225,108,0,0.3)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        title="Ask Andy"
      >
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <path d="M6 4C3.8 4 2 5.8 2 8V22C2 24.2 3.8 26 6 26H10L8 32L16 26H30C32.2 26 34 24.2 34 22V8C34 5.8 32.2 4 30 4H6Z" fill="white"/>
          <circle cx="13" cy="15" r="2.5" fill="#E16C00"/>
          <circle cx="23" cy="15" r="2.5" fill="#E16C00"/>
        </svg>
      </button>

      <AndyPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
