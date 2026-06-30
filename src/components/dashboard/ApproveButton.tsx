"use client"

import { Button } from "@/components/ui/button"
import { useApprovePackage, usePublishPackage } from "@/hooks/use-packages"
import { CheckCircle2, Send } from "lucide-react"

interface ApproveButtonProps {
  packageId: string
  currentStatus: string
  onApproved: () => void
}

export default function ApproveButton({ packageId, currentStatus, onApproved }: ApproveButtonProps) {
  const approveMutation = useApprovePackage()
  const publishMutation = usePublishPackage()

  if (currentStatus === "pending_review") {
    return (
      <Button
        size="sm"
        onClick={() =>
          approveMutation.mutate(packageId, {
            onSuccess: onApproved,
          })
        }
        disabled={approveMutation.isPending}
      >
        {approveMutation.isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Approve
      </Button>
    )
  }

  if (currentStatus === "approved") {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          publishMutation.mutate(packageId, {
            onSuccess: onApproved,
          })
        }
        disabled={publishMutation.isPending}
      >
        {publishMutation.isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Publish
      </Button>
    )
  }

  return null
}
