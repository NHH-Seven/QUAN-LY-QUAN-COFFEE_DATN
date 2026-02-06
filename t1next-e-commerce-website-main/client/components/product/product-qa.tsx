"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, Loader2, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Answer {
  id: string
  answer: string
  is_staff: boolean
  created_at: string
  user_name: string
}

interface Question {
  id: string
  question: string
  created_at: string
  user_name: string
  answers: Answer[]
}

interface ProductQAProps {
  productId: string
}

export function ProductQA({ productId }: ProductQAProps) {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")

  useEffect(() => {
    fetchQuestions()
  }, [productId])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/qa/product/${productId}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch Q&A:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!isAuthenticated) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" })
      return
    }
    if (!newQuestion.trim()) return

    try {
      setSubmitting(true)
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/qa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, question: newQuestion }),
      })
      const data = await res.json()
      if (data.success) {
        setQuestions(prev => [{
          ...data.data,
          user_name: user?.name || "Bạn",
          answers: []
        }, ...prev])
        setNewQuestion("")
        toast({ title: "Đã gửi câu hỏi!" })
      }
    } catch (err) {
      toast({ title: "Lỗi", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/qa/${questionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer: answerText }),
      })
      const data = await res.json()
      if (data.success) {
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, answers: [...q.answers, { ...data.data, user_name: user?.name || "Bạn" }] }
            : q
        ))
        setAnsweringId(null)
        setAnswerText("")
        toast({ title: "Đã trả lời!" })
      }
    } catch (err) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        Hỏi đáp về sản phẩm ({questions.length})
      </h2>

      {/* Ask question form */}
      <div className="mb-6">
        <Textarea
          placeholder={isAuthenticated ? "Đặt câu hỏi về sản phẩm..." : "Đăng nhập để đặt câu hỏi"}
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          disabled={!isAuthenticated || submitting}
          rows={2}
        />
        <Button 
          className="mt-2" 
          onClick={handleAskQuestion}
          disabled={!isAuthenticated || submitting || !newQuestion.trim()}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Gửi câu hỏi
        </Button>
      </div>

      {/* Questions list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border rounded-lg p-4">
              {/* Question */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{q.user_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{q.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-1">{q.question}</p>
                </div>
              </div>

              {/* Answers */}
              {q.answers.length > 0 && (
                <div className="mt-3 ml-11 space-y-3">
                  {q.answers.map((a) => (
                    <div key={a.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{a.user_name}</span>
                        {a.is_staff && (
                          <Badge variant="secondary" className="text-xs">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Nhân viên
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm">{a.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer form */}
              {isAuthenticated && (
                <div className="mt-3 ml-11">
                  {answeringId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Nhập câu trả lời..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAnswer(q.id)}>Gửi</Button>
                        <Button size="sm" variant="outline" onClick={() => setAnsweringId(null)}>Hủy</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setAnsweringId(q.id)}>
                      Trả lời
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Chưa có câu hỏi nào. Hãy là người đầu tiên hỏi!
        </p>
      )}
    </Card>
  )
}
