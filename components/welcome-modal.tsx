'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/logo'

const C = {
  or: '#a63300', orl: '#fff0e6', blk: '#2b2f31', sec: '#5a6062', mu: '#767c7e',
  bd: '#e5e9eb', bg: '#f4f7f9', wh: '#fff', payne: '#2b2f31',
}

// Define \u2192 Feed \u2192 Make. Every step names a surface that exists in the nav.
const STEPS = [
  {
    title: 'Step 1: Brand',
    desc: 'Answer the strategy questionnaire and set your tone of voice.',
    href: '/start',
  },
  {
    title: 'Step 2: Knowledge',
    desc: 'Upload the documents, images and links your brand should know.',
    href: '/knowledge/documents',
  },
  {
    title: 'Step 3: Studio',
    desc: 'Write copy and create images from everything you just fed it.',
    href: '/studio/write',
  },
  {
    title: 'Step 4: Numbers',
    desc: 'Add costs and pricing so Studio never writes past your margins.',
    href: '/numbers',
  },
]

export default function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('branditect_welcome_dismissed')
    if (!dismissed) setOpen(true)
  }, [])

  // Every dismissal persists. Previously only "Don't show this to me anymore"
  // wrote to localStorage, so entering the workspace or exploring reopened the
  // modal on the next page load — over the very pages it tells you to visit.
  function dismiss() {
    localStorage.setItem('branditect_welcome_dismissed', 'true')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'rgba(26,26,26,0.08)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', width: '100%', maxWidth: 880, maxHeight: '90vh', overflow: 'hidden', borderRadius: 16, boxShadow: '0 -4px 40px rgba(45,51,53,0.08)', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Left Panel */}
        <div style={{ width: '40%', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: `1px solid ${C.bd}`, flexShrink: 0 }}>
          <div>
            {/* Logo */}
            <div style={{ marginBottom: 32 }}>
              <Logo height={36} />
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 800, color: C.blk, lineHeight: 1.15, marginBottom: 16 }}>
              Welcome to your workspace
            </h1>
            <p style={{ fontSize: 16, color: C.sec, lineHeight: 1.6 }}>
              Your brand&apos;s brain is ready to be trained.
            </p>
          </div>

          {/* Quote */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.bd}` }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: C.or, fontStyle: 'italic', fontSize: 17, lineHeight: 1.5 }}>
              &ldquo;They have a marketing team. You have Branditect.&rdquo;
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: '60%', padding: '48px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, color: C.mu, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Getting Started</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.mu }}>4 steps</span>
              <div style={{ width: 80, height: 5, background: C.bd, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', background: C.or, borderRadius: 99 }} />
              </div>
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {STEPS.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                onClick={() => dismiss()}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div style={{ marginTop: 2, width: 22, height: 22, border: `2px solid ${C.bd}`, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.blk, marginBottom: 4 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: C.sec, lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link
                href="/home"
                onClick={() => dismiss()}
                style={{ background: `linear-gradient(135deg, #a63300, #ff7949)`, color: 'white', padding: '14px 32px', borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.02em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 16px ${C.or}30` }}
              >
                Enter workspace
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <button
                onClick={() => dismiss()}
                style={{ background: 'transparent', color: C.sec, padding: '14px 24px', borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
              >
                Explore first
              </button>
            </div>
            <button
              onClick={() => dismiss()}
              style={{ background: 'none', border: 'none', color: C.mu, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '4px 0', textAlign: 'left', width: 'fit-content' }}
            >
              Don&apos;t show this to me anymore
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
