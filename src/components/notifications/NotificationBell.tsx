"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json()).then((data) => {
        if (Array.isArray(data)) setNotifications(data)
      }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const unread = notifications.filter((n: any) => !n.read).length

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    })
    setNotifications((prev) => prev.map((n: any) => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold">Notifications</span>
            <span className="text-[10px] text-muted-foreground">{unread} unread</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No notifications yet</p>
            ) : (
              notifications.slice(0, 20).map((n: any) => (
                <div key={n.id}
                  className={cn(
                    "flex items-start gap-2 border-b px-3 py-2.5 text-xs transition-colors",
                    !n.read && "bg-muted/50"
                  )}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{n.title}</p>
                    {n.message && <p className="text-muted-foreground truncate">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)}
                      className="shrink-0 rounded p-1 hover:bg-accent" title="Mark read">
                      <Check className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
