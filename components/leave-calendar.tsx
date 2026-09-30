"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Copy, FileText, Printer, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { LABEL, download, pad, toISO, toText, toWordHtml, type Entry, type LeaveType, type Marks } from "@/lib/leave"

const KEY = "leave-calendar-v1"
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type Mode = LeaveType | "clear"
type Scope = "all" | "month"

const MODES: { value: Mode; label: string }[] = [
  { value: "leave", label: "Full leave" },
  { value: "half", label: "Half day" },
  { value: "clear", label: "Clear" },
]

export function LeaveCalendar() {
  const [marks, setMarks] = useState<Marks>({})
  const [view, setView] = useState<{ y: number; m: number } | null>(null)
  const [today, setToday] = useState("")
  const [mode, setMode] = useState<Mode>("leave")
  const [scope, setScope] = useState<Scope>("all")
  const [ready, setReady] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setMarks(JSON.parse(raw))
    } catch {}
    const n = new Date()
    setView({ y: n.getFullYear(), m: n.getMonth() })
    setToday(toISO(n.getFullYear(), n.getMonth(), n.getDate()))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(marks))
    } catch {}
  }, [marks, ready])

  const prefix = view ? `${view.y}-${pad(view.m + 1)}` : ""
  const all = useMemo(() => Object.entries(marks).sort(([a], [b]) => a.localeCompare(b)) as Entry[], [marks])
  const monthEntries = useMemo(() => all.filter(([k]) => k.startsWith(prefix)), [all, prefix])
  const scoped = scope === "all" ? all : monthEntries
  const text = toText(scoped)
  const fullDays = scoped.filter(([, v]) => v === "leave").length
  const halfDays = scoped.length - fullDays

  if (!view) return <Card className="h-96 animate-pulse" />

  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  const say = (s: string) => {
    setMsg(s)
    setTimeout(() => setMsg(""), 3000)
  }
  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }
  const toggle = (k: string) =>
    setMarks((prev) => {
      const next = { ...prev }
      if (mode === "clear" || prev[k] === mode) delete next[k]
      else next[k] = mode
      return next
    })
  const requireData = () => (scoped.length ? true : (say("Nothing marked yet."), false))

  return (
    <div className="grid gap-5 md:grid-cols-[1.6fr_1fr] print:block">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1.5">
              <CardTitle className="text-xl">Leave calendar</CardTitle>
              <CardDescription className="print:hidden">Pick a mode, then click dates. Click a marked date again to clear it.</CardDescription>
            </div>
            <div className="print:hidden"><ThemeToggle /></div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2 print:hidden" role="group" aria-label="Marking mode">
            {MODES.map((o) => (
              <Button key={o.value} size="sm" variant={mode === o.value ? "default" : "outline"} aria-pressed={mode === o.value} onClick={() => setMode(o.value)}>
                {o.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous month" className="print:hidden" onClick={() => shift(-1)}><ChevronLeft /></Button>
            <h2 className="flex-1 text-center text-lg font-semibold">{MONTHS[view.m]} {view.y}</h2>
            <Button variant="outline" size="icon" aria-label="Next month" className="print:hidden" onClick={() => shift(1)}><ChevronRight /></Button>
            <Button variant="outline" className="print:hidden" onClick={() => { const n = new Date(); setView({ y: n.getFullYear(), m: n.getMonth() }) }}>Today</Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DOW.map((d) => <div key={d} className="py-1 text-center text-xs text-muted-foreground">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const k = toISO(view.y, view.m, day)
              const m = marks[k]
              const weekend = (first + i) % 7 >= 5
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  aria-label={`${k}${m ? ` ${LABEL[m]}` : ""}`}
                  className={cn(
                    "flex aspect-[1/0.9] flex-col items-start justify-between rounded-md border p-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    !m && "bg-card hover:bg-accent",
                    !m && weekend && "text-muted-foreground",
                    m === "leave" && "border-leave bg-leave text-leave-foreground",
                    m === "half" && "border-half bg-[linear-gradient(135deg,var(--half)_50%,transparent_50%)]",
                    k === today && "ring-2 ring-primary"
                  )}
                >
                  <span className={cn(m === "half" && "text-half-foreground")}>{day}</span>
                  <span className="self-end text-[10px] leading-none">{m ? LABEL[m] : ""}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm bg-leave" />Leave</span>
            <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm bg-half" />Half day</span>
          </div>

          <pre className="hidden whitespace-pre-wrap font-mono text-sm print:block">{toText(monthEntries)}</pre>
        </CardContent>
      </Card>

      <Card className="h-fit print:hidden">
        <CardHeader>
          <CardTitle className="text-xl">Saved list</CardTitle>
          <CardDescription>
            {scoped.length ? `${fullDays} full leave, ${halfDays} half day = ${fullDays + halfDays / 2} days off` : "No dates marked yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex gap-2" role="group" aria-label="What to include">
            <Button size="sm" variant={scope === "all" ? "default" : "outline"} aria-pressed={scope === "all"} onClick={() => setScope("all")}>All months</Button>
            <Button size="sm" variant={scope === "month" ? "default" : "outline"} aria-pressed={scope === "month"} onClick={() => setScope("month")}>Shown month</Button>
          </div>
          <Textarea readOnly value={text} aria-label="List of marked dates" className="min-h-48" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => requireData() && (download("leave-list.txt", "text/plain;charset=utf-8", "\ufeff" + text.replace(/\n/g, "\r\n")), say("Saved leave-list.txt"))}><Save />.txt</Button>
            <Button size="sm" onClick={() => requireData() && (download("leave-list.doc", "application/msword", toWordHtml(scoped)), say("Saved leave-list.doc"))}><FileText />.doc</Button>
            <Button size="sm" variant="outline" onClick={async () => { if (!requireData()) return; try { await navigator.clipboard.writeText(text); say("Copied. Paste into Notepad or Word.") } catch { say("Copy failed. Select the text and press Ctrl+C.") } }}><Copy />Copy</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer />Print</Button>
            <Button size="sm" variant="ghost" onClick={() => confirm("Clear all marked dates?") && setMarks({})}><Trash2 />Clear all</Button>
          </div>
          <p className="min-h-5 text-sm text-primary" role="status">{msg}</p>
        </CardContent>
      </Card>
    </div>
  )
}
