"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, FileQuestion, FileText } from "lucide-react";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   POST /api/admin/elearning/courses
   - Purpose: Create new course
   - Body: { title, description, category, pass_threshold }
   - Response: { success: boolean, course: Course }
   - Auth: Training Coordinator or Super Admin
   - Note: coordinator_id auto-assigned from session
   
   PATCH /api/admin/elearning/courses/:id
   - Purpose: Update course details
   - Body: { title?, description?, category?, pass_threshold? }
   - Response: { success: boolean, course: Course }
   - Auth: Training Coordinator or Super Admin
   
   POST /api/admin/elearning/courses/:id/modules
   - Purpose: Add module to course
   - Body: { number, title, content, duration? }
   - Response: { success: boolean, module: Module }
   
   PATCH /api/admin/elearning/courses/:id/modules/:moduleId
   - Purpose: Update module
   - Body: { number?, title?, content?, duration? }
   - Response: { success: boolean, module: Module }
   
   DELETE /api/admin/elearning/courses/:id/modules/:moduleId
   - Purpose: Delete module
   - Response: { success: boolean }
   
   POST /api/admin/elearning/courses/:id/modules/:moduleId/quiz
   - Purpose: Add quiz to module
   - Body: { title, questions: [{ text, options: string[], correctAnswerIndex }], passingScore?, timeLimit? }
   - Response: { success: boolean, quiz: Quiz }
   
   POST /api/admin/elearning/courses/:id/modules/:moduleId/assignment
   - Purpose: Add assignment to module
   - Body: { title, instructions, requirements: string[], dueDate? }
   - Response: { success: boolean, assignment: Assignment }
   
   DELETE /api/admin/elearning/courses/:id/modules/:moduleId/quiz
   - Purpose: Remove quiz from module
   - Response: { success: boolean }
   
   DELETE /api/admin/elearning/courses/:id/modules/:moduleId/assignment
   - Purpose: Remove assignment from module
   - Response: { success: boolean }
   ============================================================================ */

import type { Course, Module, QuizQuestion } from "@/types/elearning.types";

type UserRole = "training_coordinator" | "super_admin";

interface CourseFormDrawerProps {
  course?: Course;
  userRole: UserRole;
  onClose: () => void;
  onSave: (data: CourseFormData) => void;
  onRequestPublish?: () => void;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  passThreshold: number;
  modules: ModuleFormData[];
}

interface ModuleFormData {
  id: string;
  number: number;
  title: string;
  content: string;
  duration: string;
  hasQuiz: boolean;
  hasAssignment: boolean;
  quizTitle: string;
  quizQuestions: QuizQuestionFormData[];
  passingScore: number;
  assignmentTitle: string;
  assignmentInstructions: string;
  assignmentRequirements: string[];
}

interface QuizQuestionFormData {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
};

const categories = ["Agriculture", "Food Technology", "Economics", "Business", "Environment"];

const emptyModule = (num: number): ModuleFormData => ({
  id: `new-${Date.now()}-${num}`,
  number: num,
  title: "",
  content: "",
  duration: "",
  hasQuiz: false,
  hasAssignment: false,
  quizTitle: "",
  quizQuestions: [],
  passingScore: 70,
  assignmentTitle: "",
  assignmentInstructions: "",
  assignmentRequirements: [],
});

const emptyQuestion = (): QuizQuestionFormData => ({
  id: `q-${Date.now()}`,
  text: "",
  options: ["", "", "", ""],
  correctAnswerIndex: 0,
});

const shadow = {
  drawer: "inset 0 4px 0 rgba(255,255,255,0.85), 0 20px 40px rgba(45,90,45,0.2), 0 40px 60px rgba(45,90,45,0.1)",
};

export function CourseFormDrawer({
  course,
  userRole,
  onClose,
  onSave,
  onRequestPublish,
}: CourseFormDrawerProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    title: course?.title || "",
    description: course?.description || "",
    category: course?.category || categories[0],
    passThreshold: course?.passThreshold || 70,
    modules: course?.modules?.map((m) => ({
      id: m.id,
      number: m.number,
      title: m.title,
      content: m.content || "",
      duration: m.duration || "",
      hasQuiz: !!m.quiz,
      hasAssignment: !!m.assignment,
      quizTitle: m.quiz?.title || "",
      quizQuestions: m.quiz?.questions || [],
      passingScore: m.quiz?.passingScore || 70,
      assignmentTitle: m.assignment?.title || "",
      assignmentInstructions: m.assignment?.instructions || "",
      assignmentRequirements: m.assignment?.requirements || [],
    })) || [emptyModule(1)],
  });
  const [activeTab, setActiveTab] = useState<"details" | "modules">("details");
  const [expandedModule, setExpandedModule] = useState<string | null>(
    course?.modules?.[0]?.id || formData.modules[0]?.id || null
  );

  const canRequestPublish = userRole === "training_coordinator" && (course?.status === "draft" || !course);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  const addModule = () => {
    const newModule = emptyModule(formData.modules.length + 1);
    setFormData({ ...formData, modules: [...formData.modules, newModule] });
    setExpandedModule(newModule.id);
  };

  const removeModule = (id: string) => {
    if (formData.modules.length <= 1) return;
    const newModules = formData.modules
      .filter((m) => m.id !== id)
      .map((m, i) => ({ ...m, number: i + 1 }));
    setFormData({ ...formData, modules: newModules });
    if (expandedModule === id) {
      setExpandedModule(newModules[0]?.id || null);
    }
  };

  const updateModule = (id: string, updates: Partial<ModuleFormData>) => {
    setFormData({
      ...formData,
      modules: formData.modules.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  };

  const addQuestion = (moduleId: string) => {
    const module = formData.modules.find((m) => m.id === moduleId);
    if (!module) return;
    updateModule(moduleId, {
      quizQuestions: [...module.quizQuestions, emptyQuestion()],
    });
  };

  const updateQuestion = (moduleId: string, questionId: string, updates: Partial<QuizQuestionFormData>) => {
    const module = formData.modules.find((m) => m.id === moduleId);
    if (!module) return;
    updateModule(moduleId, {
      quizQuestions: module.quizQuestions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const removeQuestion = (moduleId: string, questionId: string) => {
    const module = formData.modules.find((m) => m.id === moduleId);
    if (!module) return;
    updateModule(moduleId, {
      quizQuestions: module.quizQuestions.filter((q) => q.id !== questionId),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 680,
          background: C.white,
          boxShadow: shadow.drawer,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.canvas,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
              {course ? "Edit Course" : "New Course"}
            </h2>
            <span style={{ fontSize: 12, color: C.textMuted }}>
              {course?.id || "Draft"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={C.textSec} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${C.borderSubtle}`,
            background: C.canvas,
          }}
        >
          <button
            onClick={() => setActiveTab("details")}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              background: activeTab === "details" ? C.white : "transparent",
              color: activeTab === "details" ? C.primary : C.textSec,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              borderBottom: activeTab === "details" ? `2px solid ${C.primary}` : "2px solid transparent",
            }}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              background: activeTab === "modules" ? C.white : "transparent",
              color: activeTab === "modules" ? C.primary : C.textSec,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              borderBottom: activeTab === "modules" ? `2px solid ${C.primary}` : "2px solid transparent",
            }}
          >
            Modules ({formData.modules.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{
                      height: 40,
                      padding: "0 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      color: C.text,
                      outline: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                    Pass Threshold (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.passThreshold}
                    onChange={(e) => setFormData({ ...formData, passThreshold: Number(e.target.value) })}
                    required
                    min={0}
                    max={100}
                    style={{
                      height: 40,
                      padding: "0 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      color: C.text,
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "modules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {formData.modules.map((module) => (
                <div
                  key={module.id}
                  style={{
                    background: C.canvas,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `1px solid ${expandedModule === module.id ? C.primary : C.border}`,
                  }}
                >
                  {/* Module Header */}
                  <div
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      background: expandedModule === module.id ? C.white : "transparent",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      Module {module.number}: {module.title || "Untitled Module"}
                    </span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {module.hasQuiz && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.infoBg, color: C.infoText }}>
                          Quiz
                        </span>
                      )}
                      {module.hasAssignment && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.warningBg, color: C.warningText }}>
                          Assignment
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Module Content */}
                  {expandedModule === module.id && (
                    <div style={{ padding: 16, background: C.white, borderTop: `1px solid ${C.borderSubtle}` }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Module Title & Duration */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                              Module Title *
                            </label>
                            <input
                              type="text"
                              value={module.title}
                              onChange={(e) => updateModule(module.id, { title: e.target.value })}
                              placeholder="e.g., Introduction to Topic"
                              style={{
                                height: 36,
                                padding: "0 10px",
                                border: `1px solid ${C.border}`,
                                borderRadius: 4,
                                fontSize: 13,
                                color: C.text,
                                outline: "none",
                                width: "100%",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                              Duration
                            </label>
                            <input
                              type="text"
                              value={module.duration}
                              onChange={(e) => updateModule(module.id, { duration: e.target.value })}
                              placeholder="e.g., 30 min"
                              style={{
                                height: 36,
                                padding: "0 10px",
                                border: `1px solid ${C.border}`,
                                borderRadius: 4,
                                fontSize: 13,
                                color: C.text,
                                outline: "none",
                                width: "100%",
                              }}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                            Content
                          </label>
                          <textarea
                            value={module.content}
                            onChange={(e) => updateModule(module.id, { content: e.target.value })}
                            placeholder="Module content or instructions..."
                            rows={3}
                            style={{
                              padding: "10px",
                              border: `1px solid ${C.border}`,
                              borderRadius: 4,
                              fontSize: 13,
                              color: C.text,
                              outline: "none",
                              width: "100%",
                              resize: "vertical",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>

                        {/* Quiz Toggle */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input
                                type="checkbox"
                                id={`quiz-${module.id}`}
                                checked={module.hasQuiz}
                                onChange={(e) => updateModule(module.id, { hasQuiz: e.target.checked })}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                              />
                              <label htmlFor={`quiz-${module.id}`} style={{ fontSize: 12, fontWeight: 600, color: C.text, cursor: "pointer" }}>
                                <FileQuestion size={14} style={{ display: "inline", marginRight: 4 }} />
                                Include Quiz
                              </label>
                            </div>
                          </div>

                          {module.hasQuiz && (
                            <div style={{ padding: 12, background: C.canvas, borderRadius: 6 }}>
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                                  Quiz Title
                                </label>
                                <input
                                  type="text"
                                  value={module.quizTitle}
                                  onChange={(e) => updateModule(module.id, { quizTitle: e.target.value })}
                                  placeholder="e.g., Module Quiz"
                                  style={{
                                    height: 32,
                                    padding: "0 8px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    color: C.text,
                                    outline: "none",
                                    width: "100%",
                                  }}
                                />
                              </div>

                              {module.quizQuestions.map((q, qi) => (
                                <div key={q.id} style={{ marginBottom: 12, padding: 10, background: C.white, borderRadius: 4, border: `1px solid ${C.border}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted }}>Question {qi + 1}</span>
                                    <button
                                      onClick={() => removeQuestion(module.id, q.id)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#991B1B",
                                        cursor: "pointer",
                                        padding: 4,
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={q.text}
                                    onChange={(e) => updateQuestion(module.id, q.id, { text: e.target.value })}
                                    placeholder="Question text"
                                    style={{
                                      height: 32,
                                      padding: "0 8px",
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 4,
                                      fontSize: 12,
                                      color: C.text,
                                      outline: "none",
                                      width: "100%",
                                      marginBottom: 8,
                                    }}
                                  />
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <input
                                          type="radio"
                                          name={`correct-${q.id}`}
                                          checked={q.correctAnswerIndex === oi}
                                          onChange={() => updateQuestion(module.id, q.id, { correctAnswerIndex: oi })}
                                          style={{ width: 12, height: 12, cursor: "pointer" }}
                                        />
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => {
                                            const newOpts = [...q.options];
                                            newOpts[oi] = e.target.value;
                                            updateQuestion(module.id, q.id, { options: newOpts });
                                          }}
                                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                          style={{
                                            flex: 1,
                                            height: 28,
                                            padding: "0 6px",
                                            border: `1px solid ${C.border}`,
                                            borderRadius: 4,
                                            fontSize: 11,
                                            color: C.text,
                                            outline: "none",
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              <button
                                onClick={() => addQuestion(module.id)}
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  border: `1px dashed ${C.border}`,
                                  borderRadius: 4,
                                  background: "transparent",
                                  color: C.primary,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 4,
                                }}
                              >
                                <Plus size={12} /> Add Question
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Assignment Toggle */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input
                                type="checkbox"
                                id={`assignment-${module.id}`}
                                checked={module.hasAssignment}
                                onChange={(e) => updateModule(module.id, { hasAssignment: e.target.checked })}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                              />
                              <label htmlFor={`assignment-${module.id}`} style={{ fontSize: 12, fontWeight: 600, color: C.text, cursor: "pointer" }}>
                                <FileText size={14} style={{ display: "inline", marginRight: 4 }} />
                                Include Assignment
                              </label>
                            </div>
                          </div>

                          {module.hasAssignment && (
                            <div style={{ padding: 12, background: C.canvas, borderRadius: 6 }}>
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                                  Assignment Title
                                </label>
                                <input
                                  type="text"
                                  value={module.assignmentTitle}
                                  onChange={(e) => updateModule(module.id, { assignmentTitle: e.target.value })}
                                  placeholder="e.g., Practical Exercise"
                                  style={{
                                    height: 32,
                                    padding: "0 8px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    color: C.text,
                                    outline: "none",
                                    width: "100%",
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 4 }}>
                                  Instructions
                                </label>
                                <textarea
                                  value={module.assignmentInstructions}
                                  onChange={(e) => updateModule(module.id, { assignmentInstructions: e.target.value })}
                                  placeholder="Assignment instructions..."
                                  rows={2}
                                  style={{
                                    padding: "8px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    color: C.text,
                                    outline: "none",
                                    width: "100%",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Remove Module */}
                        {formData.modules.length > 1 && (
                          <button
                            onClick={() => removeModule(module.id)}
                            style={{
                              padding: "6px 12px",
                              border: `1px solid ${C.border}`,
                              borderRadius: 4,
                              background: "transparent",
                              color: "#991B1B",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              alignSelf: "flex-start",
                            }}
                          >
                            <Trash2 size={12} /> Remove Module
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Module Button */}
              <button
                onClick={addModule}
                style={{
                  padding: "12px",
                  border: `1px dashed ${C.border}`,
                  borderRadius: 8,
                  background: "transparent",
                  color: C.primary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Plus size={16} /> Add Module
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.borderSubtle}`,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.textSec,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          {canRequestPublish && (
            <button
              type="button"
              onClick={() => {
                handleSubmit();
                if (onRequestPublish) onRequestPublish();
              }}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: C.medium,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Save & Request Publish
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              flex: 1,
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
            }}
          >
            Save Course
          </button>
        </div>
      </div>
    </>
  );
}
