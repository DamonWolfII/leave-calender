export type LeaveType = "leave" | "half"
export type Marks = Record<string, LeaveType>
export type Entry = [string, LeaveType]

export const LABEL: Record<LeaveType, string> = { leave: "Leave", half: "Half day" }

export const pad = (n: number) => String(n).padStart(2, "0")
export const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

export const toText = (entries: Entry[]) =>
  entries.map(([date, type]) => `${date}: ${LABEL[type]}`).join("\n")

export const toWordHtml = (entries: Entry[]) => {
  const rows = entries.map(([d, t]) => `<tr><td>${d}</td><td>${LABEL[t]}</td></tr>`).join("")
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Leave list</title></head><body><h2>Leave list</h2><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Date</th><th>Type</th></tr>${rows}</table></body></html>`
}

export function download(name: string, type: string, content: string) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
