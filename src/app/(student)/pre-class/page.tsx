"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Video, FlaskConical, CheckCircle, XCircle, ArrowRight } from "lucide-react"

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface QuizAnswer {
  questionIndex: number
  selected: string
}

export default function PreClassPage() {
  const { profile } = useAuth()
  const grade = profile?.grade ?? 0
  const { data: packages } = usePackages({ grade, status: "published" })

  const thisWeek = 1
  const currentPkg = packages?.find((p) => (p.week ?? p.week_number) === thisWeek)
  const preClass = (currentPkg?.pre_class as { video?: string; simulation?: string; quiz?: QuizQuestion[] }) ?? {}

  const quiz: QuizQuestion[] = preClass.quiz ?? []
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (quiz.length > 0 && answers.length === 0) {
      setAnswers(quiz.map((_, i) => ({ questionIndex: i, selected: "" })))
    }
  }, [quiz])

  function handleSelect(qIdx: number, option: string) {
    if (submitted) return
    setAnswers((prev) =>
      prev.map((a) => (a.questionIndex === qIdx ? { ...a, selected: option } : a)),
    )
  }

  async function handleSubmit() {
    const unanswered = answers.some((a) => !a.selected)
    if (unanswered) {
      alert("Please answer all questions before submitting.")
      return
    }
    let correct = 0
    const responseAnswers = answers.map((a) => {
      const isCorrect = a.selected === quiz[a.questionIndex].answer
      if (isCorrect) correct++
      return {
        question_id: `q${a.questionIndex + 1}`,
        student_answer: a.selected,
        is_correct: isCorrect,
      }
    })
    setScore(correct)
    setSubmitted(true)

    if (currentPkg?.id) {
      try {
        await fetch("/api/entry-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ package_id: currentPkg.id, answers: responseAnswers }),
        })
      } catch {
        // silently fail — quiz submission is saved locally regardless
      }
    }
  }

  function handleReset() {
    setAnswers(quiz.map((_, i) => ({ questionIndex: i, selected: "" })))
    setSubmitted(false)
    setScore(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pre-Class</h1>
        <p className="text-muted-foreground">
          Review materials and complete the entry ticket quiz
        </p>
      </div>

      {preClass.video && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{preClass.video}</p>
          </CardContent>
        </Card>
      )}

      {preClass.simulation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{preClass.simulation}</p>
          </CardContent>
        </Card>
      )}

      {quiz.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Entry Ticket Quiz</CardTitle>
            {submitted && (
              <Badge variant={score === quiz.length ? "default" : "secondary"}>
                {score}/{quiz.length} Correct
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.map((q, qi) => {
              const selected = answers[qi]?.selected ?? ""
              const isCorrect = submitted && selected === q.answer
              const isWrong = submitted && selected !== q.answer

              return (
                <div key={qi}>
                  <p className="mb-2 text-sm font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = selected === opt
                      const isRightAnswer = submitted && opt === q.answer

                      return (
                        <button
                          key={oi}
                          disabled={submitted}
                          onClick={() => handleSelect(qi, opt)}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                            isRightAnswer
                              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                              : isSelected && isWrong
                                ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                : isSelected
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-accent"
                          }`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span>{opt}</span>
                          {isRightAnswer && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                          {isSelected && isWrong && <XCircle className="ml-auto h-4 w-4 text-red-600" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <Separator />

            <div className="flex items-center justify-between">
              {submitted ? (
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    Score: {score}/{quiz.length} ({Math.round((score / quiz.length) * 100)}%)
                  </p>
                  <Button variant="outline" onClick={handleReset}>
                    Retry
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSubmit}>
                  Submit Answers
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {quiz.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No pre-class materials available for this week.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
