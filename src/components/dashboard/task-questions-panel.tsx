"use client";

import { useEffect, useState, useCallback } from "react";

interface Question {
  id: string;
  task_id: string;
  agent_id?: string;
  question: string;
  answer?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function TaskQuestionsPanel({ taskId }: { taskId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions?task_id=${taskId}`);
      if (!res.ok) throw new Error("Failed to load questions");
      const data: Question[] = await res.json();
      setQuestions(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load questions";
      setError(message);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) loadQuestions();
  }, [taskId, loadQuestions]);

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return;
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, question: newQuestion.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit question");
      setNewQuestion("");
      await loadQuestions();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit question";
      setError(message);
    }
  };

  const submitAnswer = async (id: string) => {
    const text = answerText[id];
    if (!text || !text.trim()) return;
    try {
      const res = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, answer: text.trim(), status: "answered", task_id: taskId }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      setAnswerText((prev) => ({ ...prev, [id]: "" }));
      await loadQuestions();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit answer";
      setError(message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold uppercase text-zinc-300">Questions</h3>
        <p className="text-xs text-zinc-500">Agents can raise blockers; answer to unblock.</p>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
          placeholder="Ask a question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <button
          onClick={submitQuestion}
          className="bg-white text-black px-3 py-2 rounded text-sm font-bold uppercase"
        >
          Ask
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {questions.length === 0 && (
          <p className="text-xs text-zinc-500">No questions yet.</p>
        )}
        {questions.map((q) => (
          <div key={q.id} className="border border-slate-800 rounded p-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-sm text-white font-semibold">{q.question}</p>
                <p className="text-[11px] text-zinc-500">Status: {q.status}</p>
                {q.answer && <p className="text-xs text-emerald-400 mt-1">Answer: {q.answer}</p>}
              </div>
            </div>
            {!q.answer && (
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  placeholder="Answer"
                  value={answerText[q.id] || ""}
                  onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
                <button
                  onClick={() => submitAnswer(q.id)}
                  className="bg-emerald-500 text-black px-3 py-2 rounded text-sm font-bold uppercase"
                >
                  Answer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
