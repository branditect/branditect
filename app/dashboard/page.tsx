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
      const [g, t, n] = await Promise.all([
        fetch(`/api/mission-board/goals?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/mission-board/tasks?brandId=${brandId}`).then(r => r.json()),
        fetch(`/api/mission-board/notes?brandId=${brandId}`).then(r => r.json()),
      ]);
      setGoals(g.data || []);
      setTasks(t.data || []);
      setNotes(n.data || []);
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

  function goalColor(idx: number) { return GOAL_COLORS[idx % GOAL_COLORS.length]; }

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
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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

  // CSS vars inline
  const v = {
    bg: "#EDECE8", card: "#fff", border: "#E2E1DC", borderSoft: "#ECEAE5",
    orange: "#E8562A", orangePale: "#FEF0EB", orangeMid: "#F8C9B3",
    black: "#0F0F0F", g800: "#2C2C2C", g600: "#5A5A5A", g500: "#848484", g400: "#ABABAB",
    g200: "#E4E3DF", g100: "#F2F1EE",
    green: "#23A66A", greenPale: "#E6F7EF",
    blue: "#3572F0", bluePale: "#E8EFFF",
    purple: "#7144D0", purplePale: "#EEE8FF",
    red: "#D93B3B", redPale: "#FEECEC",
    amber: "#D9920E", amberPale: "#FEF8E6",
  };

  if (brandLoading || loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: v.g400, fontSize: 13 }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ background: v.bg, minHeight: "100%", padding: "22px 22px 80px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: v.black, letterSpacing: "-0.4px", display: "flex", alignItems: "baseline", gap: 10 }}>
          {greeting}, {brandName?.split(" ")[0] || "there"} <span style={{ fontSize: 20 }}>👋</span>
          <span style={{ fontSize: 12, color: v.g400, fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>{dateStr}</span>
        </div>
        <div style={{ fontSize: 13, color: v.g500, marginTop: 3 }}>
          {todayDueCount > 0 ? `${todayDueCount} task${todayDueCount > 1 ? "s" : ""} due today` : "No tasks due today"} · {goals.length} active goal{goals.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Quick Create Strip ── */}
      <div style={{ background: v.card, border: `1px solid ${v.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: v.g400, whiteSpace: "nowrap", flexShrink: 0 }}>Quick Create</div>
        <div style={{ width: 1, height: 28, background: v.border, flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
          {QC_ITEMS.map(item => (
            <Link key={item.label} href={item.href} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 8, border: `1px solid ${v.border}`, background: v.g100, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.13s" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: v.black }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Body Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

        {/* ═══ LEFT: Goals + Feed ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Goal Anchors */}
          {goals.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(goals.length, 3)}, 1fr)`, gap: 10 }}>
              {goals.slice(0, 3).map((goal, idx) => {
                const color = goalColor(idx);
                const progress = goalProgress(goal.id);
                const isSelected = selectedGoal === goal.id;
                const gt = tasks.filter(t => t.goal_id === goal.id);
                const done = gt.filter(t => t.is_complete).length;
                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
                    style={{ background: v.card, border: `1.5px solid ${isSelected ? color : v.border}`, borderRadius: 12, padding: "14px 15px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.15s", boxShadow: isSelected ? `0 0 0 3px ${color}18` : "none" }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "12px 12px 0 0", background: color }} />
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: v.g400, marginBottom: 5 }}>Strategic Goal</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: v.black, lineHeight: 1.35, marginBottom: 10 }}>{goal.title}</div>
                    <div style={{ height: 4, background: v.g100, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", borderRadius: 99, background: color, width: `${progress}%`, transition: "width 1.2s ease" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, color: v.g500 }}>{done} of {gt.length} tasks done</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{progress}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Task Feed */}
          <div style={{ background: v.card, border: `1px solid ${v.border}`, borderRadius: 13, padding: "16px 16px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: v.black, letterSpacing: "-0.2px" }}>Today&apos;s Focus</div>
                <div style={{ fontSize: 12, color: v.g400, marginTop: 1 }}>{todayDueCount} tasks due · {selectedGoal !== null ? "Filtered by goal" : "Click a goal above to filter"}</div>
              </div>
              <div style={{ display: "flex", gap: 2, background: v.g100, borderRadius: 8, padding: 3 }}>
                {(["today", "week", "all"] as const).map(t => (
                  <button key={t} onClick={() => setFeedTab(t)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: feedTab === t ? v.black : v.g500, cursor: "pointer", border: "none", background: feedTab === t ? v.card : "transparent", fontFamily: "'DM Sans', sans-serif", boxShadow: feedTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.13s", textTransform: "capitalize" }}>
                    {t === "week" ? "This week" : t === "all" ? "All" : "Today"}
                  </button>
                ))}
              </div>
            </div>

            {/* Section label */}
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: v.g400, marginBottom: 7, marginTop: 4 }}>Priority tasks</div>

            {priorityTasks.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center", color: v.g400, fontSize: 13 }}>
                No tasks {feedTab === "today" ? "due today" : feedTab === "week" ? "this week" : "yet"}. <Link href="/dashboard/mission-board" style={{ color: v.orange, textDecoration: "none" }}>Add tasks in Mission Board →</Link>
              </div>
            )}

            {priorityTasks.map(task => {
              const isDone = task.is_complete;
              const goalIdx = goals.findIndex(g => g.id === task.goal_id);
              const goalTitle = goalIdx >= 0 ? goals[goalIdx].title : null;
              const dotColor = goalIdx >= 0 ? goalColor(goalIdx) : v.g400;
              const isUrgent = isToday(task.due_date) && !isDone;
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.is_complete)}
                  style={{ background: v.card, border: `1px solid ${v.border}`, borderRadius: 11, padding: "13px 14px", marginBottom: 7, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 11, opacity: isDone ? 0.52 : 1, transition: "all 0.14s" }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isDone ? v.green : v.g200}`, background: isDone ? v.green : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isDone && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? v.g400 : v.black, lineHeight: 1.4, textDecoration: isDone ? "line-through" : "none" }}>{task.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      {goalTitle && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 500, color: v.g400 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor }} />
                          {goalTitle}
                        </div>
                      )}
                      {task.due_date && (
                        <div style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap", background: isUrgent ? v.redPale : v.g100, border: `1px solid ${isUrgent ? "#FACACA" : v.border}`, color: isUrgent ? v.red : v.g400 }}>
                          {isUrgent ? "Due today" : formatDate(task.due_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add task link */}
            <Link href="/dashboard/mission-board" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: `1px dashed ${v.border}`, cursor: "pointer", marginTop: 4, textDecoration: "none" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 12, color: v.g400 }}>Add task or quick win…</span>
            </Link>
          </div>
        </div>

        {/* ═══ RIGHT COL ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Notes Pad */}
          <div style={{ background: v.card, border: `1px solid ${v.border}`, borderRadius: 12, overflow: "hidden" }}>
            {/* Write area */}
            <div style={{ background: "#FFFEF5", borderBottom: "1px solid #EDEABD", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: v.g400 }}>Quick Note</div>
                <Link href="/dashboard/mission-board" style={{ fontSize: 11.5, fontWeight: 600, color: v.orange, textDecoration: "none" }}>All notes →</Link>
              </div>
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) saveQuickNote(); }}
                placeholder="Write a note..."
                style={{ width: "100%", minHeight: 70, background: "transparent", border: "none", outline: "none", fontSize: 13, lineHeight: 1.6, color: v.g800, resize: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
              />
              {noteInput.trim() && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <button
                    onClick={saveQuickNote}
                    disabled={noteSaving}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: v.orange, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: noteSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: noteSaving ? 0.6 : 1 }}
                  >
                    {noteSaving ? "Saving..." : "Save note"}
                  </button>
                </div>
              )}
            </div>

            {/* Latest note preview */}
            {latestNote && (
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${v.borderSoft}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: v.g400, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Latest</div>
                <div style={{ fontSize: 12.5, color: v.g600, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{latestNote.content}</div>
                <div style={{ fontSize: 10, color: v.g400, marginTop: 4 }}>{timeAgo(latestNote.created_at)}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
              <Link href="/dashboard/mission-board" style={{ flex: 1, padding: "7px 8px", borderRadius: 7, border: `1px solid ${v.border}`, background: v.g100, fontSize: 11.5, fontWeight: 500, color: v.g800, textDecoration: "none", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>Mission Board</Link>
              <Link href="/dashboard/mission-board" style={{ flex: 1, padding: "7px 8px", borderRadius: 7, border: `1px solid ${v.orangeMid}`, background: v.orangePale, fontSize: 11.5, fontWeight: 600, color: v.orange, textDecoration: "none", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>✦ Ask AI</Link>
            </div>
          </div>

          {/* Recent Outputs — static for now */}
          <div style={{ background: v.card, border: `1px solid ${v.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: v.g400 }}>Recent Outputs</div>
              <Link href="/dashboard/copy-architect" style={{ fontSize: 11.5, fontWeight: 600, color: v.orange, textDecoration: "none" }}>View all →</Link>
            </div>
            {[
              { title: "Newsletter — Draft 1", meta: "Copy Architect", chip: "NL", chipBg: v.orangePale, chipColor: v.orange, time: "Today" },
              { title: "Instagram — Phase 2 teaser", meta: "Content Architect", chip: "SOC", chipBg: v.purplePale, chipColor: v.purple, time: "Yesterday" },
              { title: "Q2 unit economics model", meta: "Financial Tools", chip: "FIN", chipBg: v.greenPale, chipColor: v.green, time: formatDate(new Date(Date.now() - 172800000).toISOString()) },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 2 ? `1px solid ${v.borderSoft}` : "none", cursor: "pointer" }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: v.orangePale, border: `1px solid ${v.orangeMid}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: v.orange }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: v.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.title}</div>
                  <div style={{ fontSize: 10.5, color: v.g400, marginTop: 1 }}>{row.meta}</div>
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", background: row.chipBg, color: row.chipColor }}>{row.chip}</div>
                <div style={{ fontSize: 10.5, color: v.g400, whiteSpace: "nowrap" }}>{row.time}</div>
              </div>
            ))}
          </div>

          {/* Brand Readiness */}
          <div style={{ background: v.card, border: `1px solid ${v.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: v.g400 }}>Brand Readiness</div>
              <Link href="/dashboard/brand-strategy" style={{ fontSize: 11, fontWeight: 600, color: v.orange, textDecoration: "none" }}>Complete →</Link>
            </div>

            {[
              { name: "Brand Strategy", pct: 100, status: "done" },
              { name: "Visual Identity", pct: 60, status: "part" },
              { name: "Brand Tone", pct: 0, status: "empty" },
              { name: "Products & Services", pct: 0, status: "empty" },
              { name: "Financial Rules", pct: 0, status: "empty" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: item.status === "done" ? v.green : item.status === "part" ? v.amber : v.g200, border: item.status === "empty" ? `1.5px solid ${v.g400}` : "none" }} />
                <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: v.g600 }}>{item.name}</div>
                <div style={{ width: 48, height: 3, background: v.g100, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: item.status === "done" ? v.green : item.status === "part" ? v.amber : v.orange, width: `${item.pct}%` }} />
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, minWidth: 24, textAlign: "right", color: item.status === "done" ? v.green : item.status === "part" ? v.amber : v.g400 }}>{item.pct}%</div>
              </div>
            ))}

            <Link href="/dashboard/brand-strategy" style={{ display: "block", marginTop: 12, padding: 8, borderRadius: 8, background: v.orangePale, border: `1px solid ${v.orangeMid}`, fontSize: 12, fontWeight: 600, color: v.orange, textAlign: "center", textDecoration: "none" }}>
              Complete Brand Setup →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
