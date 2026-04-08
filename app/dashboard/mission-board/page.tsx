'use client'

import { useState, useEffect } from 'react'
import { useBrand } from '@/lib/useBrand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Goal {
  id: number
  brand_id: string
  title: string
  due_date: string | null
  category: string
  created_at: string
}

interface Task {
  id: number
  brand_id: string
  goal_id: number | null
  title: string
  assigned_to: string
  is_complete: boolean
  due_date: string | null
  created_at: string
}

interface Note {
  id: number
  brand_id: string
  content: string
  title: string
  url: string
  is_draft: boolean
  is_favorite: boolean
  created_at: string
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function MissionBoardPage() {
  const { brandId, loading: brandLoading } = useBrand()
  const [tab, setTab] = useState<'goals' | 'notes' | 'favorites' | 'drafts'>('goals')
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(''); const [toastVisible, setToastVisible] = useState(false)
  const [noteSearch, setNoteSearch] = useState('')
  const [scratchPad, setScratchPad] = useState('')

  // Add forms
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDue, setNewGoalDue] = useState('')
  const [newGoalCat, setNewGoalCat] = useState('general')
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskGoalId, setNewTaskGoalId] = useState<number | null>(null)
  const [newTaskDue, setNewTaskDue] = useState('')

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  /* ── Fetch data ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (brandLoading || brandId === 'default') return

    async function load() {
      const [goalsRes, tasksRes, notesRes] = await Promise.all([
        fetch(`/api/mission-board/goals?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/mission-board/tasks?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/mission-board/notes?brandId=${brandId}`).then(r => r.json()),
      ])
      setGoals(goalsRes.data || [])
      setTasks(tasksRes.data || [])
      setNotes(notesRes.data || [])
      setLoading(false)
    }
    load()
  }, [brandId, brandLoading])

  /* ── Goals & Tasks actions ───────────────────────────────────────────────── */

  async function addGoal() {
    if (!newGoalTitle.trim()) return
    const res = await fetch('/api/mission-board/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, title: newGoalTitle.trim(), dueDate: newGoalDue || null, category: newGoalCat }),
    })
    const json = await res.json()
    if (json.data) setGoals(prev => [...prev, json.data])
    setNewGoalTitle(''); setNewGoalDue(''); setAddGoalOpen(false)
    showToast('Goal added')
  }

  async function deleteGoal(id: number) {
    setGoals(prev => prev.filter(g => g.id !== id))
    await fetch('/api/mission-board/goals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return
    const res = await fetch('/api/mission-board/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, goalId: newTaskGoalId, title: newTaskTitle.trim(), dueDate: newTaskDue || null }),
    })
    const json = await res.json()
    if (json.data) setTasks(prev => [...prev, json.data])
    setNewTaskTitle(''); setNewTaskDue(''); setAddTaskOpen(false)
    showToast('Task added')
  }

  async function toggleTask(id: number, current: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_complete: !current } : t))
    await fetch('/api/mission-board/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_complete: !current }),
    })
  }

  async function deleteTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch('/api/mission-board/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  /* ── Notes actions ───────────────────────────────────────────────────────── */

  async function deleteNote(id: number) {
    setNotes(prev => prev.filter(n => n.id !== id))
    await fetch('/api/mission-board/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function moveToDraft(id: number) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_draft: true } : n))
    await fetch('/api/mission-board/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_draft: true }),
    })
    showToast('Moved to Draft Pad')
  }

  /* ── Draft actions ───────────────────────────────────────────────────────── */

  async function addDraft() {
    const res = await fetch('/api/mission-board/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, content: '', isDraft: true, title: 'Untitled draft' }),
    })
    const json = await res.json()
    if (json.data) setNotes(prev => [json.data, ...prev])
  }

  async function updateDraft(id: number, fields: Partial<Note>) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...fields } : n))
    await fetch('/api/mission-board/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    })
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    showToast('Copied')
  }

  async function saveScratchPad() {
    if (!scratchPad.trim()) return
    const res = await fetch('/api/mission-board/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, content: scratchPad.trim() }),
    })
    const json = await res.json()
    if (json.data) setNotes(prev => [json.data, ...prev])
    setScratchPad('')
    showToast('Note saved')
  }

  /* ── Helpers ─────────────────────────────────────────────────────────────── */

  const regularNotes = notes.filter(n => !n.is_draft && !n.is_favorite)
  const favorites = notes.filter(n => n.is_favorite && !n.is_draft)
  const drafts = notes.filter(n => n.is_draft)

  const filteredNotes = noteSearch.trim()
    ? regularNotes.filter(n => n.content.toLowerCase().includes(noteSearch.toLowerCase()))
    : regularNotes

  const recentStarred = favorites.slice(0, 5)
  const recentNotes = regularNotes.slice(0, 5)

  function isToday(d: string | null) {
    if (!d) return false
    return new Date(d).toDateString() === new Date().toDateString()
  }

  function isThisWeek(d: string | null) {
    if (!d) return false
    const now = new Date()
    const date = new Date(d)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
    return date >= weekStart && date < weekEnd
  }

  function formatDate(d: string | null) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  function goalProgress(goalId: number) {
    const goalTasks = tasks.filter(t => t.goal_id === goalId)
    if (goalTasks.length === 0) return 0
    return Math.round((goalTasks.filter(t => t.is_complete).length / goalTasks.length) * 100)
  }

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)

  /* ── Styles ──────────────────────────────────────────────────────────────── */

  const card = {
    background: '#fff', border: '0.5px solid #C8C9CC', borderRadius: 10,
    padding: '16px 18px', marginBottom: 10,
  } as React.CSSProperties

  const tabBtn = (active: boolean) => ({
    padding: '8px 18px', border: 'none', background: 'transparent',
    fontSize: 12, fontWeight: 500 as const, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: active ? '#E16C00' : '#555555', cursor: 'pointer', fontFamily: 'inherit',
    borderBottom: active ? '2px solid #E16C00' : '2px solid transparent',
    transition: 'all 0.13s',
  })

  const inputStyle = {
    width: '100%', padding: '7px 10px', border: '0.5px solid #C8C9CC',
    borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none',
    background: '#FAFAFA', boxSizing: 'border-box' as const,
  }

  const btnOrange = {
    padding: '6px 14px', borderRadius: 6, border: 'none',
    background: '#E16C00', color: '#fff', fontSize: 12, fontWeight: 500 as const,
    cursor: 'pointer', fontFamily: 'inherit',
  }

  const btnGhost = {
    padding: '5px 10px', borderRadius: 5, border: '0.5px solid #C8C9CC',
    background: 'transparent', color: '#555555', fontSize: 11,
    cursor: 'pointer', fontFamily: 'inherit',
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */

  if (brandLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        Loading mission board...
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '28px 32px 0', borderBottom: '0.5px solid #C8C9CC' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A1A1A', marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>Goals & Tasks</h1>
        <p style={{ fontSize: 13, color: '#555555', marginBottom: 20, lineHeight: 1.6 }}>Your goals live on the left. Your day lives on the right.</p>

        <div style={{ display: 'flex', gap: 0 }}>
          {([
            { id: 'goals' as const, label: 'Goals & Tasks', count: 0 },
            { id: 'notes' as const, label: 'Notes', count: regularNotes.length },
            { id: 'favorites' as const, label: 'Favorites', count: favorites.length },
            { id: 'drafts' as const, label: 'Draft Pad', count: drafts.length },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(tab === t.id)}>
              {t.label}
              {t.count > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 10, background: tab === t.id ? '#FFF0E6' : '#FAFAFA', color: tab === t.id ? '#E16C00' : '#555555' }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1100 }}>

        {/* ═══ GOALS & TASKS TAB ═══ */}
        {tab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

            {/* Left: Goals */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555555', fontWeight: 500 }} title="A goal is a campaign, a launch, or a project — anything with a clear finish line. Break it into tasks and track it here until it's done.">Active Goals</div>
                <button onClick={() => setAddGoalOpen(p => !p)} style={btnGhost}>+ Add goal</button>
              </div>
              <p style={{ fontSize: 11, color: '#888888', marginBottom: 14, lineHeight: 1.5 }}>Campaigns, launches, projects — anything with a finish line.</p>

              {addGoalOpen && (
                <div style={{ ...card, background: '#FAFAFA', marginBottom: 14 }}>
                  <input value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} placeholder="Goal title" onKeyDown={e => e.key === 'Enter' && addGoal()} style={{ ...inputStyle, marginBottom: 8, background: '#fff' }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input type="date" value={newGoalDue} onChange={e => setNewGoalDue(e.target.value)} style={{ ...inputStyle, flex: 1, background: '#fff' }} />
                    <select value={newGoalCat} onChange={e => setNewGoalCat(e.target.value)} style={{ ...inputStyle, flex: 1, background: '#fff' }}>
                      <option value="general">General</option>
                      <option value="marketing">Marketing</option>
                      <option value="product">Product</option>
                      <option value="content">Content</option>
                      <option value="growth">Growth</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addGoal} style={btnOrange}>Add goal</button>
                    <button onClick={() => setAddGoalOpen(false)} style={btnGhost}>Cancel</button>
                  </div>
                </div>
              )}

              {goals.length === 0 && !addGoalOpen && (
                <div style={{ ...card, textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Nothing running yet.</div>
                  <div style={{ fontSize: 12.5, color: '#888888', lineHeight: 1.6, marginBottom: 14 }}>Add your first goal — a launch, a campaign, a deadline — and break it into the tasks that will actually get it done.</div>
                  <button onClick={() => setAddGoalOpen(true)} style={btnOrange}>+ Add goal</button>
                </div>
              )}

              {goals.map(goal => {
                const progress = goalProgress(goal.id)
                const goalTasks = tasks.filter(t => t.goal_id === goal.id)
                return (
                  <div key={goal.id} style={card}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{goal.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {goal.due_date && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#FFF0E6', color: '#E16C00', fontWeight: 500 }}>
                            {formatDate(goal.due_date)}
                          </span>
                        )}
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#FAFAFA', color: '#555555' }}>
                          {goal.category}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, borderRadius: 2, background: '#C8C9CC', marginBottom: 12, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#34C759' : '#E16C00', borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>

                    {/* Subtasks */}
                    {goalTasks.map(task => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid #FAFAFA' }}>
                        <input
                          type="checkbox"
                          checked={task.is_complete}
                          onChange={() => toggleTask(task.id, task.is_complete)}
                          style={{ accentColor: '#E16C00', cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1, fontSize: 12.5, color: task.is_complete ? '#888888' : '#1A1A1A', textDecoration: task.is_complete ? 'line-through' : 'none' }}>
                          {task.title}
                        </span>
                        <button onClick={() => deleteTask(task.id)} style={{ border: 'none', background: 'transparent', color: '#C8C9CC', cursor: 'pointer', fontSize: 14, padding: 0 }}>&times;</button>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button
                        onClick={() => { setAddTaskOpen(true); setNewTaskGoalId(goal.id) }}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '0.5px dashed #C8C9CC', background: 'transparent', color: '#555555', cursor: 'pointer', fontFamily: 'inherit' }}
                      >+ Add subtask</button>
                      <button onClick={() => deleteGoal(goal.id)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: 'none', background: 'transparent', color: '#C8C9CC', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: Tasks */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555555', fontWeight: 500 }} title="Tasks without a goal attached — quick things that need doing. Drag anything from a goal into here to make it part of your day.">Today / This Week</div>
                <button onClick={() => { setAddTaskOpen(p => !p); setNewTaskGoalId(null) }} style={btnGhost}>+ Add task</button>
              </div>
              <p style={{ fontSize: 11, color: '#888888', marginBottom: 14, lineHeight: 1.5 }}>Quick things that need doing — no goal required.</p>

              {addTaskOpen && (
                <div style={{ ...card, background: '#FAFAFA', marginBottom: 14 }}>
                  <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task title" onKeyDown={e => e.key === 'Enter' && addTask()} style={{ ...inputStyle, marginBottom: 8, background: '#fff' }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={{ ...inputStyle, flex: 1, background: '#fff' }} />
                    <select value={newTaskGoalId || ''} onChange={e => setNewTaskGoalId(e.target.value ? Number(e.target.value) : null)} style={{ ...inputStyle, flex: 1, background: '#fff' }}>
                      <option value="">No goal</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addTask} style={btnOrange}>Add task</button>
                    <button onClick={() => setAddTaskOpen(false)} style={btnGhost}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Today */}
              {(() => {
                const todayTasks = tasks.filter(t => !t.goal_id && isToday(t.due_date))
                const weekTasks = tasks.filter(t => !t.goal_id && !isToday(t.due_date) && isThisWeek(t.due_date))
                const otherTasks = tasks.filter(t => !t.goal_id && !isToday(t.due_date) && !isThisWeek(t.due_date))

                return (
                  <>
                    {todayTasks.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#E16C00', marginBottom: 8 }}>Today</div>
                        {todayTasks.map(task => (
                          <div key={task.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                            <input type="checkbox" checked={task.is_complete} onChange={() => toggleTask(task.id, task.is_complete)} style={{ accentColor: '#E16C00', cursor: 'pointer' }} />
                            <span style={{ flex: 1, fontSize: 12.5, color: task.is_complete ? '#888888' : '#1A1A1A', textDecoration: task.is_complete ? 'line-through' : 'none' }}>{task.title}</span>
                            <button onClick={() => deleteTask(task.id)} style={{ border: 'none', background: 'transparent', color: '#C8C9CC', cursor: 'pointer', fontSize: 14, padding: 0 }}>&times;</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {weekTasks.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#555555', marginBottom: 8 }}>This week</div>
                        {weekTasks.map(task => (
                          <div key={task.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                            <input type="checkbox" checked={task.is_complete} onChange={() => toggleTask(task.id, task.is_complete)} style={{ accentColor: '#E16C00', cursor: 'pointer' }} />
                            <span style={{ flex: 1, fontSize: 12.5, color: task.is_complete ? '#888888' : '#1A1A1A', textDecoration: task.is_complete ? 'line-through' : 'none' }}>{task.title}</span>
                            {task.due_date && <span style={{ fontSize: 10, color: '#888888' }}>{formatDate(task.due_date)}</span>}
                            <button onClick={() => deleteTask(task.id)} style={{ border: 'none', background: 'transparent', color: '#C8C9CC', cursor: 'pointer', fontSize: 14, padding: 0 }}>&times;</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {otherTasks.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#555555', marginBottom: 8 }}>Other</div>
                        {otherTasks.map(task => (
                          <div key={task.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                            <input type="checkbox" checked={task.is_complete} onChange={() => toggleTask(task.id, task.is_complete)} style={{ accentColor: '#E16C00', cursor: 'pointer' }} />
                            <span style={{ flex: 1, fontSize: 12.5, color: task.is_complete ? '#888888' : '#1A1A1A', textDecoration: task.is_complete ? 'line-through' : 'none' }}>{task.title}</span>
                            {task.due_date && <span style={{ fontSize: 10, color: '#888888' }}>{formatDate(task.due_date)}</span>}
                            <button onClick={() => deleteTask(task.id)} style={{ border: 'none', background: 'transparent', color: '#C8C9CC', cursor: 'pointer', fontSize: 14, padding: 0 }}>&times;</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {todayTasks.length === 0 && weekTasks.length === 0 && otherTasks.length === 0 && !addTaskOpen && (
                      <div style={{ ...card, textAlign: 'center', padding: 32 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Nothing on your plate today.</div>
                        <div style={{ fontSize: 12.5, color: '#888888', lineHeight: 1.6, marginBottom: 14 }}>That either means you&apos;re ahead, or nothing&apos;s been assigned yet.</div>
                        <button onClick={() => { setAddTaskOpen(true); setNewTaskGoalId(null) }} style={btnOrange}>+ Add task</button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* ═══ NOTES TAB ═══ */}
        {tab === 'notes' && (
          <div>
            {/* Search bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: 'relative', maxWidth: 420 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="7" cy="7" r="5.5" stroke="#888888" strokeWidth="1.3"/><line x1="11" y1="11" x2="14.5" y2="14.5" stroke="#888888" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <input
                  value={noteSearch}
                  onChange={e => setNoteSearch(e.target.value)}
                  placeholder="Search notes..."
                  style={{ width: '100%', padding: '9px 12px 9px 34px', border: '0.5px solid #C8C9CC', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#E16C00'; (e.target as HTMLInputElement).style.background = '#fff' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#C8C9CC'; (e.target as HTMLInputElement).style.background = '#FAFAFA' }}
                />
              </div>
            </div>

            {/* Top section: Notes row + Scratch pad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 36 }}>

              {/* Notes cards row */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>Notes</div>
                {filteredNotes.length === 0 ? (
                  <div style={{ ...card, textAlign: 'center', padding: 32, color: '#888888', fontSize: 13 }}>
                    {noteSearch ? 'No matching notes' : 'No notes yet — use the floating pen button to capture ideas'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {filteredNotes.map(note => (
                      <div key={note.id} style={{ ...card, minWidth: 200, maxWidth: 220, flexShrink: 0, cursor: 'default', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
                        <div>
                          {note.title && <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{note.title}</div>}
                          <div style={{ fontSize: 12, color: '#1A1A1A', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' as const, wordBreak: 'break-word' }}>
                            {note.content}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '0.5px solid #FAFAFA' }}>
                          <span style={{ fontSize: 10, color: '#888888' }}>{formatDate(note.created_at)}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => moveToDraft(note.id)} style={{ border: 'none', background: 'transparent', color: '#888888', cursor: 'pointer', fontSize: 11, padding: '1px 4px', fontFamily: 'inherit' }} title="Move to Draft Pad">&#8594;</button>
                            <button onClick={() => deleteNote(note.id)} style={{ border: 'none', background: 'transparent', color: '#C8C9CC', cursor: 'pointer', fontSize: 13, padding: '1px 4px' }} title="Delete">&times;</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scratch pad */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>Scratch pad</div>
                <div style={{ background: '#FDF8E8', border: '0.5px solid #F0E6C0', borderRadius: 10, padding: 16, minHeight: 160, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    value={scratchPad}
                    onChange={e => setScratchPad(e.target.value)}
                    placeholder="Start writing..."
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, lineHeight: 1.6, color: '#1A1A1A', resize: 'none', fontFamily: 'inherit', minHeight: 100 }}
                  />
                  {scratchPad.trim() && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button onClick={saveScratchPad} style={{ ...btnOrange, fontSize: 11, padding: '5px 12px' }}>Save as note</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom section: Recently captured + Recent notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

              {/* Recently captured (starred copy) */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>Recently captured</div>
                <div style={{ fontSize: 11, color: '#888888', marginBottom: 12, marginTop: -8 }}>Starred copy from Copy Architect</div>
                {recentStarred.length === 0 ? (
                  <div style={{ ...card, textAlign: 'center', padding: 24, color: '#888888', fontSize: 12.5 }}>
                    Star copy in the Copy Architect to capture it here.
                  </div>
                ) : (
                  recentStarred.map(note => (
                    <div key={note.id} style={{ ...card, borderLeft: '3px solid #E16C00', padding: '12px 14px' }}>
                      {note.title && <div style={{ fontSize: 10, fontWeight: 500, color: '#E16C00', marginBottom: 4 }}>{note.title}</div>}
                      <div style={{ fontSize: 12.5, color: '#1A1A1A', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                        {note.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: '#888888' }}>{timeAgo(note.created_at)}</span>
                        <button onClick={() => copyText(note.content)} style={{ ...btnGhost, fontSize: 10, padding: '2px 8px' }}>Copy</button>
                      </div>
                    </div>
                  ))
                )}
                {favorites.length > 5 && (
                  <button onClick={() => setTab('favorites')} style={{ ...btnGhost, width: '100%', marginTop: 6, textAlign: 'center' }}>View all {favorites.length} favorites &rarr;</button>
                )}
              </div>

              {/* Recent notes */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>Recent notes</div>
                <div style={{ fontSize: 11, color: '#888888', marginBottom: 12, marginTop: -8 }}>Quick captures from the floating pen</div>
                {recentNotes.length === 0 ? (
                  <div style={{ ...card, textAlign: 'center', padding: 24, color: '#888888', fontSize: 12.5 }}>
                    Use the floating pen button to jot down ideas from any page.
                  </div>
                ) : (
                  recentNotes.map(note => (
                    <div key={note.id} style={{ ...card, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12.5, color: '#1A1A1A', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                        {note.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: '#888888' }}>{timeAgo(note.created_at)}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => moveToDraft(note.id)} style={{ ...btnGhost, fontSize: 10, padding: '2px 8px' }}>To draft</button>
                          <button onClick={() => deleteNote(note.id)} style={{ ...btnGhost, fontSize: 10, padding: '2px 8px', color: '#C45C00' }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ FAVORITES TAB ═══ */}
        {tab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#888888', fontSize: 13 }}>
                No favorites yet — star copy from the Copy Architect to save it here
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {favorites.map(note => (
                  <div key={note.id} style={{ ...card, borderLeft: '3px solid #E16C00' }}>
                    {note.title && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#E16C00', marginBottom: 6 }}>{note.title}</div>
                    )}
                    <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.65, marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {note.content}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#888888' }}>{timeAgo(note.created_at)}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { copyText(note.content); }} style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }}>Copy</button>
                        <button onClick={() => moveToDraft(note.id)} style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }}>Move to Draft</button>
                        <button onClick={() => deleteNote(note.id)} style={{ ...btnGhost, fontSize: 10, padding: '3px 8px', color: '#C45C00' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ DRAFT BOARD TAB ═══ */}
        {tab === 'drafts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={addDraft} style={btnOrange}>+ New draft card</button>
            </div>

            {drafts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#888888', fontSize: 13 }}>
                No drafts yet — move notes here or create a new draft card
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {drafts.map(draft => (
                  <div key={draft.id} style={{ ...card, padding: '18px 20px' }}>
                    {/* Title */}
                    <input
                      value={draft.title || ''}
                      onChange={e => setNotes(prev => prev.map(n => n.id === draft.id ? { ...n, title: e.target.value } : n))}
                      onBlur={e => updateDraft(draft.id, { title: e.target.value })}
                      placeholder="Draft title"
                      style={{ width: '100%', fontSize: 14, fontWeight: 600, color: '#1A1A1A', background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', padding: '2px 0', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif", boxSizing: 'border-box' }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = '#E16C00' }}
                    />

                    {/* Body */}
                    <textarea
                      value={draft.content || ''}
                      onChange={e => setNotes(prev => prev.map(n => n.id === draft.id ? { ...n, content: e.target.value } : n))}
                      onBlur={e => updateDraft(draft.id, { content: e.target.value })}
                      placeholder="Write your draft content..."
                      style={{ width: '100%', minHeight: 80, fontSize: 12.5, lineHeight: 1.65, color: '#1A1A1A', background: '#FAFAFA', border: '1px solid #C8C9CC', borderRadius: 8, padding: '10px 12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }}
                    />

                    {/* URL input */}
                    <input
                      value={draft.url || ''}
                      onChange={e => setNotes(prev => prev.map(n => n.id === draft.id ? { ...n, url: e.target.value } : n))}
                      onBlur={e => updateDraft(draft.id, { url: e.target.value })}
                      placeholder="Paste URL (images auto-preview)..."
                      style={{ ...inputStyle, marginBottom: 10 }}
                    />

                    {/* Image preview */}
                    {draft.url && isImageUrl(draft.url) && (
                      <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', border: '0.5px solid #C8C9CC' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={draft.url} alt="" style={{ width: '100%', display: 'block' }} />
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => copyText(draft.content || '')} style={btnGhost}>Copy text</button>
                      <button onClick={() => copyText(draft.url || '')} style={btnGhost}>Open in Canva</button>
                      <button onClick={() => copyText(draft.content || '')} style={btnGhost}>Send to Klaviyo</button>
                      <button onClick={() => deleteNote(draft.id)} style={{ ...btnGhost, color: '#C45C00', marginLeft: 'auto' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toastVisible && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1A1A1A', color: '#fff', fontSize: 12, padding: '8px 18px', borderRadius: 20, zIndex: 99, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: "'DM Sans', sans-serif" }}>
          {toast}
        </div>
      )}
    </div>
  )
}
