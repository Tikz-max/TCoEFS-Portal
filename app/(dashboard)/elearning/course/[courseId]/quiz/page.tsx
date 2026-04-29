'use client';

/**
 * ============================================================================
 * E-LEARNING QUIZ INTERFACE — VARIANT B: THE LEDGER
 * ============================================================================
 * 
 * DESIGN: "The Ledger" — Structured, data-dense, stats-forward
 * - 2-column grid layout (quiz | question navigator)
 * - Dense question display
 * - Question navigator sidebar
 * - Real-time progress tracking
 * 
 * STYLE GUIDE COMPLIANCE:
 * - Exact shadow system (--elevation-1/2/3 with green-tinted shadows)
 * - Button gradients with elevation transitions
 * - Dense typography hierarchy
 * - Compact card layouts
 * 
 * ============================================================================
 */

// ============================================================================
// BACKEND CONNECTIONS REQUIRED
// ============================================================================
// 
// 1. QUIZ DETAILS
//    - Endpoint: GET /api/elearning/courses/[courseId]/quiz
//    - Returns: { id, title, totalQuestions, passingScore, timeLimit, dueDate }
//    - Real-time: Check attempt count and due date
//
// 2. QUIZ QUESTIONS
//    - Endpoint: GET /api/elearning/courses/[courseId]/quiz/questions
//    - Returns: { questions: [{ id, text, options: string[] }] }
//    - Note: Options should be shuffled client-side for security
//    - Caching: None (fetch fresh each time)
//
// 3. QUIZ STATE (For resuming)
//    - Endpoint: GET /api/elearning/courses/[courseId]/quiz/state
//    - Returns: { currentQuestion, answers: { questionId: answerIndex }, timeRemaining }
//    - Use: Resume incomplete quiz
//
// 4. SUBMIT QUIZ ANSWERS
//    - Endpoint: POST /api/elearning/courses/[courseId]/quiz/submit
//    - Body: { answers: [{ questionId, answerIndex }] }
//    - Returns: { success, score, passed, correctAnswers: [{ questionId, answerIndex }] }
//    - Side effects: 
//      - Increment attempt count
//      - Unlock next module if passed
//      - Award certificate if final quiz
//
// 5. QUIZ RESULTS/FEEDBACK
//    - Endpoint: GET /api/elearning/courses/[courseId]/quiz/results
//    - Returns: { score, passed, correctCount, totalQuestions, breakdown: [{ questionId, correct, yourAnswer, correctAnswer }] }
//    - Real-time: Fetch after submission
//
// 6. ATTEMPT HISTORY
//    - Endpoint: GET /api/elearning/courses/[courseId]/quiz/attempts
//    - Returns: { attempts: [{ id, score, passed, submittedAt }] }
//    - Use: Display historical attempts
//
// 7. QUIZ TIMER SYNC
//    - Endpoint: POST /api/elearning/courses/[courseId]/quiz/heartbeat
//    - Body: { timeRemaining }
//    - Returns: { serverTime, expiresAt }
//    - Use: Keep quiz timer in sync, handle time extensions
//
// 8. QUESTION FLAGGING (Optional)
//    - Endpoint: POST /api/elearning/courses/[courseId]/quiz/flag/[questionId]
//    - Body: { flagged: boolean }
//    - Use: Mark questions for review
//
// ============================================================================

import React, { useState } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";

// ============================================================================
// DESIGN TOKENS (FROM STYLE GUIDE)
// ============================================================================

const tokens = {
  greenDarkest: "#0F2210",
  greenDark: "#1A3A1A",
  greenPrimary: "#2D5A2D",
  greenMedium: "#3D7A3D",
  greenLight: "#56985E",
  greenPale: "#A8D4A8",
  greenWhisper: "#E8F5E8",
  
  gold: "#C49A26",
  goldLight: "#F0C840",
  goldWhisper: "#FDF3D0",
  
  canvas: "#EFF3EF",
  surface: "#FFFFFF",
  
  textPrimary: "#111B11",
  textSecondary: "#526052",
  textMuted: "#8A9E8A",
  
  borderSubtle: "#EBF0EB",
  borderDefault: "#D8E4D8",
  
  successText: "#166534",
  successBg: "#DCFCE7",

  shadowSm: "0 1px 2px 0 rgba(45, 90, 45, 0.15), 0 2px 4px 0 rgba(45, 90, 45, 0.10)",
  shadowMd: "0 4px 8px 0 rgba(45, 90, 45, 0.12), 0 8px 16px 0 rgba(45, 90, 45, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(45, 90, 45, 0.14), 0 16px 32px 0 rgba(45, 90, 45, 0.10), 0 32px 48px 0 rgba(45, 90, 45, 0.06)",
  shadowInset: "inset 0 2px 4px 0 rgba(45, 90, 45, 0.15), inset 0 -1px 0 0 rgba(255, 255, 255, 0.60)",
  
  lightEdgeSm: "inset 0 1px 0 0 rgba(255, 255, 255, 0.65)",
  lightEdgeMd: "inset 0 1px 0 0 rgba(255, 255, 255, 0.75)",
  lightEdgeLg: "inset 0 2px 0 0 rgba(255, 255, 255, 0.85)",
};

const elevation1 = `${tokens.lightEdgeSm}, ${tokens.shadowSm}`;
const elevation2 = `${tokens.lightEdgeMd}, ${tokens.shadowMd}`;
const elevation3 = `${tokens.lightEdgeLg}, ${tokens.shadowLg}`;

// ============================================================================
// MOCK DATA (Replace with API calls using useParams for courseId)
// ============================================================================

const quizData = {
  title: "Module 4 Quiz: Climate-Smart Agriculture",
  currentQuestion: 3,
  totalQuestions: 10,
  timeRemaining: "18:45",
  questions: [
    {
      id: 1,
      text: "What are the three pillars of climate-smart agriculture?",
      options: [
        "Productivity, Adaptation, Mitigation",
        "Efficiency, Sustainability, Profitability",
        "Technology, Training, Investment",
        "Planning, Implementation, Evaluation"
      ],
      selectedAnswer: 0,
    },
    {
      id: 2,
      text: "Which practice helps improve soil carbon sequestration?",
      options: [
        "Continuous tillage",
        "Monoculture farming",
        "Cover cropping",
        "Chemical fertilization only"
      ],
      selectedAnswer: 2,
    },
    {
      id: 3,
      text: "How does agroforestry contribute to climate adaptation?",
      options: [
        "By increasing crop yields only",
        "By providing shade, windbreaks, and diversified income",
        "By reducing labor requirements",
        "By eliminating the need for irrigation"
      ],
      selectedAnswer: null,
    },
  ],
};

// ============================================================================
// QUIZ INTERFACE - VARIANT B: THE LEDGER
// ============================================================================

export default function QuizPage() {
  const params = useParams<{ courseId: string }>();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    quizData.questions[quizData.currentQuestion - 1].selectedAnswer
  );

  async function submitCurrentQuiz() {
    try {
      const answers = quizData.questions
        .filter((question) => question.selectedAnswer !== null)
        .map((question) => ({
          questionId: String(question.id),
          answer: question.options[question.selectedAnswer ?? 0],
        }));

      await fetch(`/api/elearning/courses/${params.courseId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: "00000000-0000-0000-0000-000000000000",
          answers,
        }),
      });
    } catch {
      // ignore network errors in static demo UI
    }
  }

  return (
    <div className="quiz-shell" style={{ background: tokens.canvas, minHeight: '100dvh', display: 'grid', gridTemplateColumns: '1fr 320px' }}>
      <style>{`
        @media (max-width: 920px) {
          .quiz-shell {
            grid-template-columns: 1fr !important;
          }
          .quiz-main {
            padding: 26px 20px !important;
          }
          .quiz-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
          .quiz-nav {
            justify-content: stretch !important;
          }
          .quiz-nav button {
            flex: 1 !important;
          }
          .quiz-sidebar {
            border-left: 0 !important;
            border-top: 1px solid ${tokens.borderSubtle} !important;
            padding: 26px 20px 36px !important;
          }
        }
      `}</style>
      {/* Main quiz area */}
      <div className="quiz-main" style={{ padding: '32px 40px' }}>
        <div className="quiz-header" style={{
          background: tokens.surface,
          borderRadius: '12px',
          padding: '24px 28px',
          boxShadow: elevation2,
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: tokens.textPrimary,
              marginBottom: '4px',
              letterSpacing: '-0.2px',
            }}>
              {quizData.title}
            </h1>
            <div style={{ fontSize: '13px', color: tokens.textSecondary }}>
              Question {quizData.currentQuestion} of {quizData.totalQuestions}
            </div>
          </div>

          <div style={{
            padding: '10px 16px',
            background: tokens.canvas,
            borderRadius: '6px',
          }}>
            <div style={{ fontSize: '11px', color: tokens.textMuted, marginBottom: '2px' }}>
              Time Left
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: tokens.greenPrimary, fontFamily: 'monospace' }}>
              {quizData.timeRemaining}
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{
          background: tokens.surface,
          borderRadius: '12px',
          padding: '28px 32px',
          boxShadow: elevation2,
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: tokens.textPrimary,
            lineHeight: 1.5,
            marginBottom: '24px',
          }}>
            {quizData.questions[quizData.currentQuestion - 1].text}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quizData.questions[quizData.currentQuestion - 1].options.map((option, index) => (
              <div
                key={index}
                onClick={() => setSelectedAnswer(index)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '8px',
                  background: selectedAnswer === index ? tokens.greenWhisper : tokens.canvas,
                  border: selectedAnswer === index ? `2px solid ${tokens.greenPrimary}` : `1px solid ${tokens.borderDefault}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: selectedAnswer === index ? `2px solid ${tokens.greenPrimary}` : `2px solid ${tokens.borderDefault}`,
                    background: selectedAnswer === index ? tokens.greenPrimary : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {selectedAnswer === index && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '15px', color: tokens.textPrimary }}>
                    {option}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="quiz-nav" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button style={{
            background: tokens.surface,
            border: `1px solid ${tokens.borderDefault}`,
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            color: tokens.textPrimary,
            cursor: 'pointer',
          }}>
            Previous
          </button>
          <button style={{
            background: `linear-gradient(180deg, ${tokens.greenMedium} 0%, ${tokens.greenPrimary} 100%)`,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: selectedAnswer !== null ? 'pointer' : 'not-allowed',
            opacity: selectedAnswer !== null ? 1 : 0.5,
            boxShadow: elevation1,
          }}>
            Next Question
          </button>
        </div>
      </div>

      {/* Sidebar: Question navigator */}
      <div className="quiz-sidebar" style={{
        background: tokens.surface,
        borderLeft: `1px solid ${tokens.borderSubtle}`,
        padding: '32px 24px',
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: tokens.textPrimary,
          marginBottom: '16px',
        }}>
          Question Navigator
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {Array.from({ length: quizData.totalQuestions }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                background: num === quizData.currentQuestion ? tokens.greenPrimary : 
                           quizData.questions[num - 1]?.selectedAnswer !== null && quizData.questions[num - 1]?.selectedAnswer !== undefined ? 
                           tokens.successBg : tokens.canvas,
                color: num === quizData.currentQuestion ? '#FFFFFF' : 
                       quizData.questions[num - 1]?.selectedAnswer !== null && quizData.questions[num - 1]?.selectedAnswer !== undefined ? 
                       tokens.successText : tokens.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: num === quizData.currentQuestion ? 'none' : `1px solid ${tokens.borderDefault}`,
              }}
            >
              {num}
            </div>
          ))}
        </div>

        <div style={{
          padding: '16px',
          background: tokens.canvas,
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '12px', color: tokens.textMuted, marginBottom: '12px' }}>
            Progress
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: tokens.textPrimary, marginBottom: '8px' }}>
            {quizData.questions.filter(q => q.selectedAnswer !== null && q.selectedAnswer !== undefined).length} / {quizData.totalQuestions}
          </div>
          <div style={{ fontSize: '12px', color: tokens.textSecondary }}>
            Questions answered
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button style={{
            width: '100%',
            background: `linear-gradient(180deg, ${tokens.greenMedium} 0%, ${tokens.greenPrimary} 100%)`,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: 1,
            boxShadow: elevation1,
          }}
          onClick={() => {
            void submitCurrentQuiz();
          }}>
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
