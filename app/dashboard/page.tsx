"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Goal {
  id: number; title: string; due_date: string | null; category: string;
}
interface Task {
  id: number; goal_id: number | null; title: string; is_complete: boolean; due_date: string | null; created_at: string;
}
interface Note {
  id: number; content: string; title: string; is_draft: boolean; is_favorite: boolean; created_at: string;
}

/* ── Quick Create items ─────────────────────────────────────────────────────── */

const QC_ITEMS = [
  { label: "Weekly Newsletter", href: "/dashboard/copy-architect", bg: "#FEF0EB", color: "#E8562A" },
  { label: "Social Post",       href: "/dashboard/copy-architect", bg: "#EEE8FF", color: "#7144D0" },
  { label: "LinkedIn Post",     href: "/dashboard/copy-architect", bg: "#E8EFFF", color: "#3572F0" },
  { label: "New Images",        href: "/dashboard/brand-library/image-architect", bg: "#E6F7EF", color: "#23A66A" },
  { label: "Write Ads",         href: "/dashboard/copy-architect", bg: "#FEF8E6", color: "#D9920E" },
  { label: "Brand Audit",       href: "/dashboard/brand-strategy", bg: "#FEECEC", color: "#D93B3B" },
];

/* ── Colors for goals ───────────────────────────────────────────────────────── */

const GOAL_COLORS = ["#E8562A", "#3572F0", "#23A66A", "#7144D0", "#D9920E"];

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const { brandId, brandName, loading: brandLoading } = useBrand();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [feedTab, setFeedTab] = useState<"today" | "week" | "all">("today");
  const [noteInput, setNoteInput] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<{ platform: string; format: string; idea: string; pillar: string }[]>([]);

  // Check onboarding
  useEffect(() => {
    async function checkOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: brands } = await supabase
        .from("brands").select("brand_id")
        .eq("user_id", user.id).eq("onboarding_completed", true).limit(1);
      if (!brands || brands.length === 0) { router.push("/onboarding"); }
    }
    checkOnboarding();
  }, [router]);

  // Load data
  useEffect(() => {
    if (brandLoading || brandId === "default") return;
    async function load() {
      const [g, t, n, s] = await Promise.all([
        fetch(`/api/mission-board/goals?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/mission-board/tasks?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/mission-board/notes?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/social-strategy?brandId=${brandId}`).then(r => r.json()).catch(() => ({ data: null })),
      ]);
      setGoals(g.data || []);
      setTasks(t.data || []);
      setNotes(n.data || []);
      // Extract content ideas from social strategy
      if (s.data?.generated_strategy) {
        try {
          const strat = typeof s.data.generated_strategy === 'string' ? JSON.parse(s.data.generated_strategy) : s.data.generated_strategy;
          if (strat.content_ideas?.length) setContentIdeas(strat.content_ideas.slice(0, 4));
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, [brandId, brandLoading]);

  // Toggle task
  async function toggleTask(id: number, current: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_complete: !current } : t));
    await fetch("/api/mission-board/tasks", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_complete: !current }),
    });
  }

  async function saveQuickNote() {
    if (!noteInput.trim() || !brandId) return;
    setNoteSaving(true);
    try {
      const res = await fetch("/api/mission-board/notes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, content: noteInput.trim() }),
      });
      const json = await res.json();
      if (json.data) setNotes(prev => [json.data, ...prev]);
      setNoteInput("");
    } catch {}
    setNoteSaving(false);
  }

  // Helpers
  function goalProgress(goalId: number) {
    const gt = tasks.filter(t => t.goal_id === goalId);
    if (!gt.length) return 0;
    return Math.round((gt.filter(t => t.is_complete).length / gt.length) * 100);
  }

  // goalColor available if needed
  void GOAL_COLORS;

  function isToday(d: string | null) {
    if (!d) return false;
    return new Date(d).toDateString() === new Date().toDateString();
  }
  function isThisWeek(d: string | null) {
    if (!d) return false;
    const now = new Date(); const date = new Date(d);
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
    const we = new Date(ws); we.setDate(ws.getDate() + 7);
    return date >= ws && date < we;
  }
  function formatDate(d: string | null) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return formatDate(d);
  }

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  // date available if needed

  // Filter tasks for feed
  const feedTasks = tasks.filter(t => {
    if (selectedGoal !== null && t.goal_id !== selectedGoal) return false;
    if (feedTab === "today") return isToday(t.due_date) || t.is_complete;
    if (feedTab === "week") return isThisWeek(t.due_date) || isToday(t.due_date) || t.is_complete;
    return true;
  });
  const priorityTasks = feedTasks.filter(t => !t.is_complete).concat(feedTasks.filter(t => t.is_complete));
  const todayDueCount = tasks.filter(t => isToday(t.due_date) && !t.is_complete).length;

  // Latest note
  const latestNote = notes.find(n => !n.is_draft);

  // CSS vars inline — v3 coral + blue-tinted surfaces
  const v = {
    bg: "#fcfcff", card: "#fff", border: "rgba(225,191,182,0.15)", borderSoft: "#e1e2e8",
    orange: "#ec5c36", orangePale: "#ffdbd1", orangeMid: "#ffb4a1",
    black: "#1a1c1e", g800: "#1a1c1e", g600: "#44474e", g500: "#44474e", g400: "#8d7169",
    g200: "#e1e2e8", g100: "#f3f6fc",
    green: "#1a1c1e", greenPale: "#f3f6fc",
    blue: "#00647c", bluePale: "#b7eaff",
    purple: "#1a1c1e", purplePale: "#f3f6fc",
    red: "#ba1a1a", redPale: "#ffdad6",
    amber: "#8d7169", amberPale: "#f3f6fc",
  };

  if (brandLoading || loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: v.g400, fontSize: 13, fontFamily: "var(--font-manrope), 'Manrope', sans-serif" }}>Loading dashboard...</div>;
  }

  const cardStyle = { background: v.card, borderRadius: 16, boxShadow: "0 4px 20px rgba(43,47,49,0.02)" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100%", padding: "32px 32px 80px", fontFamily: "var(--font-manrope), 'Manrope', sans-serif" }}>

      {/* ── Greeting ── */}
      <section style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, color: v.black, letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 8 }}>
          {greeting}, {brandName || "there"}
        </h1>
        <p style={{ fontSize: 16, color: v.g500, lineHeight: 1.5 }}>
          {todayDueCount > 0 ? `${todayDueCount} task${todayDueCount > 1 ? "s" : ""} due today` : "Your brand ecosystem is looking healthy today"}.
          {goals.length > 0 && ` ${goals.length} active goal${goals.length !== 1 ? "s" : ""}.`}
        </p>
      </section>

      {/* ── Quick Create — Bento Grid ── */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: v.black }}>Quick Create</h2>
          <Link href="/dashboard/create" style={{ fontSize: 14, fontWeight: 600, color: v.orange, textDecoration: "none" }}>View All</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {QC_ITEMS.map(item => (
            <Link key={item.label} href={item.href} style={{ ...cardStyle, padding: 20, textDecoration: "none", display: "flex", flexDirection: "column", gap: 16, transition: "transform 0.15s", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color }} />
              </div>
              <span style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: v.black }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Body Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ═══ LEFT: Goals + Feed ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Strategic Goals */}
          <section>
            <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: v.black, marginBottom: 24 }}>Strategic Goals</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {goals.length === 0 && (
                <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: v.g500, marginBottom: 12 }}>No goals yet. Set your first strategic goal to track progress.</p>
                  <Link href="/dashboard/mission-board" style={{ fontSize: 14, fontWeight: 600, color: v.orange, textDecoration: "none" }}>Add a goal →</Link>
                </div>
              )}
              {goals.slice(0, 3).map((goal) => {
                const progress = goalProgress(goal.id);
                const isSelected = selectedGoal === goal.id;
                const gt = tasks.filter(t => t.goal_id === goal.id);
                const done = gt.filter(t => t.is_complete).length;
                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
                    style={{ ...cardStyle, padding: 24, cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? "0 4px 30px rgba(166,51,0,0.08)" : cardStyle.boxShadow }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: v.black, marginBottom: 4 }}>{goal.title}</h3>
                        <p style={{ fontSize: 13, fontWeight: 500, color: v.g500 }}>{goal.category}</p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 99, background: progress >= 70 ? "#d8e3f9" : progress > 0 ? v.g100 : v.g100, color: progress >= 70 ? "#475264" : v.g500 }}>
                        {progress >= 100 ? "Complete" : progress >= 70 ? "On Track" : progress > 0 ? "In Progress" : "Pending"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: v.g500 }}>{progress}% Complete</span>
                      <span style={{ fontSize: 10, color: v.g400 }}>{goal.due_date ? `Due ${formatDate(goal.due_date)}` : `${done} of ${gt.length} tasks`}</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: v.g100, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(135deg, #ec5c36, #d34520)`, width: `${progress}%`, transition: "width 1.2s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Task Feed */}
          <section>
            <div style={{ ...cardStyle, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: v.black }}>Today&apos;s Focus</h2>
                  <p style={{ fontSize: 13, color: v.g500, marginTop: 2 }}>{todayDueCount} tasks due {selectedGoal !== null ? "· Filtered" : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 2, background: v.g100, borderRadius: 10, padding: 3 }}>
                  {(["today", "week", "all"] as const).map(t => (
                    <button key={t} onClick={() => setFeedTab(t)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: feedTab === t ? v.black : v.g400, cursor: "pointer", border: "none", background: feedTab === t ? v.card : "transparent", fontFamily: "var(--font-manrope), 'Manrope', sans-serif", boxShadow: feedTab === t ? "0 2px 8px rgba(43,47,49,0.06)" : "none", transition: "all 0.15s" }}>
                      {t === "week" ? "This week" : t === "all" ? "All" : "Today"}
                    </button>
                  ))}
                </div>
              </div>

              {priorityTasks.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: v.g400, fontSize: 14 }}>
                  No tasks {feedTab === "today" ? "due today" : feedTab === "week" ? "this week" : "yet"}. <Link href="/dashboard/mission-board" style={{ color: v.orange, textDecoration: "none", fontWeight: 600 }}>Add tasks →</Link>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {priorityTasks.map(task => {
                  const isDone = task.is_complete;
                  const goalIdx = goals.findIndex(g => g.id === task.goal_id);
                  const goalTitle = goalIdx >= 0 ? goals[goalIdx].title : null;
                  const isUrgent = isToday(task.due_date) && !isDone;
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id, task.is_complete)}
                      style={{ background: v.g100, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, opacity: isDone ? 0.5 : 1, transition: "all 0.15s" }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isDone ? "#556072" : v.g200}`, background: isDone ? "#556072" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isDone && <svg width="10" height="10" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: isDone ? v.g400 : v.black, lineHeight: 1.4, textDecoration: isDone ? "line-through" : "none" }}>{task.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                          {goalTitle && <span style={{ fontSize: 11, fontWeight: 500, color: v.g400 }}>{goalTitle}</span>}
                          {task.due_date && (
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 99, background: isUrgent ? v.redPale : "transparent", color: isUrgent ? v.red : v.g400 }}>
                              {isUrgent ? "Due today" : formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href="/dashboard/mission-board" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", marginTop: 8, textDecoration: "none" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: v.orange }}>+ Add task or quick win</span>
              </Link>
            </div>
          </section>
        </div>

        {/* ═══ RIGHT COL ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Notes Pad */}
          <div style={{ ...cardStyle, overflow: "hidden" }}>
            <div style={{ background: "#faf8f0", padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: v.g400 }}>Quick Note</span>
                <Link href="/dashboard/mission-board" style={{ fontSize: 12, fontWeight: 600, color: v.orange, textDecoration: "none" }}>All notes →</Link>
              </div>
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) saveQuickNote(); }}
                placeholder="Write a note..."
                style={{ width: "100%", minHeight: 72, background: "transparent", border: "none", outline: "none", fontSize: 14, lineHeight: 1.65, color: v.black, resize: "none", fontFamily: "var(--font-manrope), 'Manrope', sans-serif", boxSizing: "border-box" }}
              />
              {noteInput.trim() && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button onClick={saveQuickNote} disabled={noteSaving} className="signature-gradient" style={{ padding: "6px 16px", borderRadius: 8, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: noteSaving ? "not-allowed" : "pointer", opacity: noteSaving ? 0.5 : 1, fontFamily: "var(--font-manrope), 'Manrope', sans-serif" }}>
                    {noteSaving ? "Saving..." : "Save note"}
                  </button>
                </div>
              )}
            </div>
            {latestNote && (
              <div style={{ padding: "14px 20px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: v.g400 }}>Latest</span>
                <div style={{ fontSize: 13, color: v.g600, lineHeight: 1.6, marginTop: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{latestNote.content}</div>
                <div style={{ fontSize: 11, color: v.g400, marginTop: 6 }}>{timeAgo(latestNote.created_at)}</div>
              </div>
            )}
          </div>

          {/* Recent Outputs */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: v.g400 }}>Recent Outputs</span>
              <Link href="/dashboard/copy-architect" style={{ fontSize: 12, fontWeight: 600, color: v.orange, textDecoration: "none" }}>View all →</Link>
            </div>
            {[
              { title: "Newsletter — Draft 1", meta: "Copy Architect", time: "Today" },
              { title: "Instagram — Phase 2 teaser", meta: "Content Architect", time: "Yesterday" },
              { title: "Q2 unit economics model", meta: "Financial Tools", time: formatDate(new Date(Date.now() - 172800000).toISOString()) },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${v.orange}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: v.orange }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: v.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.title}</div>
                  <div style={{ fontSize: 11, color: v.g400, marginTop: 2 }}>{row.meta}</div>
                </div>
                <div style={{ fontSize: 11, color: v.g400, whiteSpace: "nowrap", flexShrink: 0 }}>{row.time}</div>
              </div>
            ))}
          </div>

          {/* Content Ideas */}
          {contentIdeas.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: v.g400 }}>Content Ideas</span>
                <Link href="/dashboard/brand-strategy/social" style={{ fontSize: 12, fontWeight: 600, color: v.orange, textDecoration: "none" }}>View all &rarr;</Link>
              </div>
              {contentIdeas.map((idea, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: v.g100, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: v.g500 }}>{idea.platform.slice(0, 2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 5, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 3, background: v.orangePale, color: v.orange, textTransform: "uppercase", letterSpacing: "0.05em" }}>{idea.format}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 3, background: v.g100, color: v.g500 }}>{idea.pillar}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: v.black, lineHeight: 1.4 }}>{idea.idea}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Brand Pulse — Dark Card */}
          <div style={{ background: "#0c0f10", borderRadius: 24, padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Brand Pulse</h2>
              <p style={{ fontSize: 13, color: "#9b9d9e", marginBottom: 24, maxWidth: 200, lineHeight: 1.55 }}>Your brand readiness overview.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { name: "Strategy", pct: 100 },
                  { name: "Visual Identity", pct: 60 },
                  { name: "Tone", pct: 0 },
                  { name: "Products", pct: 0 },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#9b9d9e", width: 80, flexShrink: 0 }}>{item.name}</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: item.pct >= 100 ? "#556072" : `linear-gradient(135deg, #ec5c36, #d34520)`, width: `${item.pct}%` }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: item.pct > 0 ? "#fff" : "#555", width: 28, textAlign: "right" }}>{item.pct}%</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/brand-strategy" style={{ display: "inline-block", marginTop: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", textDecoration: "none" }}>Complete Setup →</Link>
            </div>
            {/* Decorative blurs */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: `${v.orange}30`, borderRadius: "50%", filter: "blur(60px)" }} />
            <div style={{ position: "absolute", bottom: -20, right: -20, width: 100, height: 100, background: "#55607220", borderRadius: "50%", filter: "blur(40px)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
