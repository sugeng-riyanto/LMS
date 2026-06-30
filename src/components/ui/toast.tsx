"use client"

import toast from "react-hot-toast"
import { cn } from "@/lib/utils/cn"

function useToast() {
  return {
    toast,
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    dismiss: (id?: string) => toast.dismiss(id),
    promise: <T,>(
      promise: Promise<T>,
      msgs: { loading: string; success: string; error: string }
    ) => toast.promise(promise, msgs),
    custom: (
      message: string,
      options?: { className?: string; duration?: number }
    ) =>
      toast(message, {
        className: cn(
          "bg-background text-foreground border border-border shadow-md",
          options?.className
        ),
        duration: options?.duration,
      }),
  }
}

export { useToast, toast }
