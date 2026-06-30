"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePackages, useApprovePackage, usePublishPackage } from "@/hooks/use-packages"
import { useRBAC } from "@/hooks/use-rbac"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle, Send, Edit } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function PackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const grade = Number(params.grade)
  const week = Number(params.week)
  const { data: packages, isLoading } = usePackages({ grade, week })
  const pkg = packages?.[0]
  const { isSuperAdmin } = useRBAC()
  const { mutateAsync: approvePackage } = useApprovePackage()
  const { mutateAsync: publishPackage } = usePublishPackage()
  const [activeTab, setActiveTab] = useState("lesson-plan")

  const content = pkg?.content as Record<string, unknown> | undefined

  async function handleApprove() {
    if (!pkg) return
    try {
      await approvePackage(pkg.id)
      toast.success("Package approved!")
    } catch {
      toast.error("Failed to approve.")
    }
  }

  async function handlePublish() {
    if (!pkg) return
    try {
      await publishPackage(pkg.id)
      toast.success("Package published!")
    } catch {
      toast.error("Failed to publish.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <p className="text-center text-muted-foreground">Package not found.</p>
      </div>
    )
  }

  const lessonPlan = (content?.lesson_plan as Array<{ phase: string; timing: string; activity: string }>) ?? []
  const worksheet = (content?.worksheet as Array<{ level: string; questions: Array<{ question: string; points: number }> }>) ?? []
  const preClass = (content?.pre_class as { video?: string; simulation?: string; quiz?: Array<{ question: string; options: string[]; answer: string }> }) ?? {}
  const labLogistics = (content?.lab_logistics as Array<{ item: string; quantity: number; notes: string }>) ?? []
  const waBlast = (content?.wa_blast as string) ?? pkg.content?.wa_blast
  const answerKeys = (content?.answer_keys as Array<{ question: string; answer: string; explanation: string }>) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/grades/${grade}`)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Grade {grade}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Week {week}: {pkg.title}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">Grade {grade}</Badge>
            <Badge
              variant={
                pkg.status === "published"
                  ? "default"
                  : pkg.status === "approved"
                    ? "secondary"
                    : "outline"
              }
            >
              {pkg.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/grades/${grade}/${week}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {isSuperAdmin && pkg.status !== "published" && (
            <>
              {pkg.status === "draft" && (
                <Button size="sm" onClick={handleApprove}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              )}
              {pkg.status === "approved" && (
                <Button size="sm" onClick={handlePublish}>
                  <Send className="mr-1 h-4 w-4" />
                  Publish
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="lesson-plan">Lesson Plan</TabsTrigger>
          <TabsTrigger value="worksheet">Worksheet</TabsTrigger>
          <TabsTrigger value="pre-class">Pre-Class</TabsTrigger>
          <TabsTrigger value="lab">Lab Logistics</TabsTrigger>
          <TabsTrigger value="wa-blast">WA Blast</TabsTrigger>
          <TabsTrigger value="answers">Answer Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="lesson-plan">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lesson plan yet.</p>
              ) : (
                <div className="space-y-4">
                  {lessonPlan.map((phase, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{phase.phase}</h3>
                        <Badge variant="outline">{phase.timing}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{phase.activity}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worksheet">
          <Card>
            <CardHeader>
              <CardTitle>Worksheet</CardTitle>
            </CardHeader>
            <CardContent>
              {worksheet.length === 0 ? (
                <p className="text-sm text-muted-foreground">No worksheet yet.</p>
              ) : (
                <div className="space-y-6">
                  {worksheet.map((level, i) => (
                    <div key={i}>
                      <h3 className="mb-2 font-semibold capitalize">{level.level} Level</h3>
                      <div className="space-y-2">
                        {level.questions.map((q, j) => (
                          <div key={j} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-start justify-between">
                              <span>
                                {j + 1}. {q.question}
                              </span>
                              <Badge variant="outline">{q.points} pts</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pre-class">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Class Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preClass.video && (
                <div>
                  <h3 className="text-sm font-semibold">Video</h3>
                  <p className="text-sm text-muted-foreground">{preClass.video}</p>
                </div>
              )}
              {preClass.simulation && (
                <div>
                  <h3 className="text-sm font-semibold">Simulation</h3>
                  <p className="text-sm text-muted-foreground">{preClass.simulation}</p>
                </div>
              )}
              {preClass.quiz && preClass.quiz.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Entry Quiz</h3>
                  <div className="space-y-3">
                    {preClass.quiz.map((q, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">
                          {i + 1}. {q.question}
                        </p>
                        <ul className="mt-1 space-y-1">
                          {q.options.map((opt, j) => (
                            <li key={j} className="text-sm text-muted-foreground">
                              {opt}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                          Answer: {q.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!preClass.video && !preClass.simulation && (!preClass.quiz || preClass.quiz.length === 0) && (
                <p className="text-sm text-muted-foreground">No pre-class materials yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab">
          <Card>
            <CardHeader>
              <CardTitle>Lab Logistics</CardTitle>
            </CardHeader>
            <CardContent>
              {labLogistics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lab logistics yet.</p>
              ) : (
                <div className="space-y-2">
                  {labLogistics.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="font-medium">{item.item}</span>
                      <div className="flex items-center gap-4">
                        <span>Qty: {item.quantity}</span>
                        {item.notes && (
                          <span className="text-muted-foreground">{item.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wa-blast">
          <Card>
            <CardHeader>
              <CardTitle>WA Blast Message</CardTitle>
            </CardHeader>
            <CardContent>
              {waBlast ? (
                <div className="rounded-lg bg-muted p-4">
                  <p className="whitespace-pre-wrap text-sm">{typeof waBlast === "string" ? waBlast : JSON.stringify(waBlast)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No WA blast message yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="answers">
          <Card>
            <CardHeader>
              <CardTitle>Answer Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {answerKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No answer keys yet.</p>
              ) : (
                <div className="space-y-4">
                  {answerKeys.map((ak, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <p className="text-sm font-medium">{ak.question}</p>
                      <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                        Answer: {ak.answer}
                      </p>
                      {ak.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{ak.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
