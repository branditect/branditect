'use client'

import { useState, useRef, useEffect } from 'react'
import { useBrand } from '@/lib/useBrand'

interface Msg { role: 'user' | 'assistant'; content: string }
interface SavedNote { id: number; content: string; ts: string }
interface Conversation { id: string; title: string; messages: Msg[]; ts: string }

const C = {
  or: '#E16C00', orl: '#FFF0E6', blk: '#1A1A1A', sec: '#555', mu: '#888', mu2: '#BBB',
  bd: '#E2E3E6', bg: '#FAFAFA', wh: '#fff', payne: '#315A72',
}

const BUBBLE = (
  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
    <path d="M6 4C3.8 4 2 5.8 2 8V22C2 24.2 3.8 26 6 26H10L8 32L16 26H30C32.2 26 34 24.2 34 22V8C34 5.8 32.2 4 30 4H6Z" fill="#E16C00"/>
    <circle cx="13" cy="15" r="2.5" fill="white"/>
    <circle cx="23" cy="15" r="2.5" fill="white"/>
  </svg>
)

export default function AndyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { brandId, brandName } = useBrand()

  const [tab, setTab] = useState<'chat' | 'saved'>('chat')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([])
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<string>('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const msgsRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('andy_saved')
    if (saved) setSavedNotes(JSON.parse(saved))
    const convs = localStorage.getItem('andy_convs')
    if (convs) setConversations(JSON.parse(convs))
    setCurrentConvId('c_' + Date.now())
  }, [])

  // Auto scroll
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open && tab === 'chat') setTimeout(() => taRef.current?.focus(), 100)
  }, [open, tab])

  function saveConversation(msgs: Msg[], convId: string) {
    if (!msgs.length) return
    const firstUser = msgs.find(m => m.role === 'user')
    const title = firstUser ? firstUser.content.slice(0, 45) : 'Conversation'
    const conv: Conversation = { id: convId, title, messages: msgs, ts: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
    setConversations(prev => {
      const next = [conv, ...prev.filter(c => c.id !== convId)].slice(0, 20)
      localStorage.setItem('andy_convs', JSON.stringify(next))
      return next
    })
  }

  function newChat() {
    saveConversation(messages, currentConvId)
    setMessages([])
    setCurrentConvId('c_' + Date.now())
    setHistoryOpen(false)
  }

  function loadConv(conv: Conversation) {
    saveConversation(messages, currentConvId)
    setMessages([...conv.messages])
    setCurrentConvId(conv.id)
    setHistoryOpen(false)
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: input.trim() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/andy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, brandId }),
      })
      const data = await res.json()
      const reply = data.reply || 'Something went wrong.'
      const finalMsgs = [...newMsgs, { role: 'assistant' as const, content: reply }]
      setMessages(finalMsgs)
      saveConversation(finalMsgs, currentConvId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue — please try again.' }])
    }
    setLoading(false)
  }

  function saveNote(content: string, idx: number) {
    if (savedIds.has(idx)) return
    setSavedIds(prev => new Set(prev).add(idx))
    const note: SavedNote = { id: Date.now(), content, ts: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    setSavedNotes(prev => {
      const next = [note, ...prev]
      localStorage.setItem('andy_saved', JSON.stringify(next))
      return next
    })
  }

  function removeNote(id: number) {
    setSavedNotes(prev => {
      const next = prev.filter(n => n.id !== id)
      localStorage.setItem('andy_saved', JSON.stringify(next))
      return next
    })
  }

  const convTitle = messages.find(m => m.role === 'user')?.content.slice(0, 40) || 'New conversation'

  if (!open) return null

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 200, display: 'flex', flexDirection: 'column', background: C.wh, borderLeft: `1px solid ${C.bd}`, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Topbar with conversation history */}
      <div style={{ position: 'relative' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, flexShrink: 0 }}>
          <button onClick={() => setHistoryOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: C.blk, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 6px', borderRadius: 6 }}>
            {convTitle.length > 40 ? convTitle + '...' : convTitle}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity={0.4}><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={newChat} style={{ fontSize: 12, fontWeight: 500, color: C.sec, background: 'none', border: `1px solid ${C.bd}`, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', borderRadius: 6 }}>+ New</button>
            <button onClick={onClose} style={{ fontSize: 16, color: C.mu, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>&times;</button>
          </div>
        </div>

        {/* History dropdown */}
        {historyOpen && (
          <div style={{ position: 'absolute', top: 42, left: 12, background: C.wh, border: `1px solid ${C.bd}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', width: 260, zIndex: 100, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '16px 14px', fontSize: 13, color: C.mu2, textAlign: 'center' }}>No past conversations yet</div>
            ) : conversations.map(c => (
              <div key={c.id} onClick={() => loadConv(c)} style={{ padding: '10px 14px', fontSize: 13, color: C.sec, cursor: 'pointer', borderBottom: `1px solid ${C.bg}`, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{c.title}</span>
                <span style={{ fontSize: 11, color: C.mu2, flexShrink: 0 }}>{c.ts}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{BUBBLE}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.blk }}>Andy</div>
            <div style={{ fontSize: 11, color: C.mu }}>{brandName ? `${brandName} workspace` : 'Branditect AI chat'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', background: '#F4F4F1', borderRadius: 9, padding: 3, gap: 2 }}>
          {(['chat', 'saved'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 7, border: 'none', background: tab === t ? C.wh : 'transparent', color: tab === t ? C.blk : C.mu, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {t === 'chat' ? 'Chat' : 'Saved'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat view */}
      {tab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: '22px 18px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Welcome message */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{BUBBLE}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.blk, marginBottom: 3 }}>Andy</div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: C.blk }}>Hi{brandName ? ` — welcome to the ${brandName} workspace` : ''}. How can I help?</div>
              </div>
            </div>

            {/* Messages */}
            {messages.map((msg, i) => msg.role === 'user' ? (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '80%', background: C.blk, color: C.wh, padding: '10px 14px', borderRadius: '14px 14px 3px 14px', fontSize: 14, lineHeight: 1.55 }}>{msg.content}</div>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{BUBBLE}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.blk }}>Andy</span>
                    <button onClick={() => saveNote(msg.content, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title={savedIds.has(i) ? 'Saved' : 'Save to notes'}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={savedIds.has(i) ? C.or : 'none'} stroke={savedIds.has(i) ? C.or : '#CCC'} strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.65, color: C.blk, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.content}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{BUBBLE}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 14px', background: '#F4F4F1', borderRadius: 12 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', display: 'block', animation: `andyBounce 1.2s infinite ${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 18px 18px', borderTop: `1px solid ${C.bd}`, flexShrink: 0 }}>
            <div style={{ background: '#F8F7F5', border: `1px solid ${C.bd}`, borderRadius: 12, padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                ref={taRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask Andy anything..."
                rows={1}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.blk, lineHeight: 1.5, resize: 'none', width: '100%', maxHeight: 90, overflowY: 'auto' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#CCC' }}>Reads from your brand vault</span>
                <button onClick={send} disabled={loading || !input.trim()} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: C.or, cursor: loading || !input.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading || !input.trim() ? 0.3 : 1, transition: 'opacity 0.15s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved view */}
      {tab === 'saved' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mu, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Saved notes</div>
          {savedNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 10px', color: C.mu2 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.35} style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <p style={{ fontSize: 13 }}>Star any answer to save it here</p>
            </div>
          ) : savedNotes.map(note => (
            <div key={note.id} style={{ border: `1px solid ${C.bd}`, borderRadius: 10, padding: '13px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 36 36" fill="none"><path d="M6 4C3.8 4 2 5.8 2 8V22C2 24.2 3.8 26 6 26H10L8 32L16 26H30C32.2 26 34 24.2 34 22V8C34 5.8 32.2 4 30 4H6Z" fill="#E16C00"/><circle cx="13" cy="15" r="2.5" fill="white"/><circle cx="23" cy="15" r="2.5" fill="white"/></svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.blk }}>Andy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.mu2 }}>{note.ts}</span>
                  <button onClick={() => removeNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCC', fontSize: 18, lineHeight: 1 }}>&times;</button>
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: C.sec, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{note.content.slice(0, 340)}{note.content.length > 340 ? '...' : ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bounce animation */}
      <style>{`@keyframes andyBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
