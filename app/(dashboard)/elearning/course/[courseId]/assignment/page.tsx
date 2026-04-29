'use client';

/**
 * ============================================================================
 * E-LEARNING ASSIGNMENT SUBMISSION — VARIANT A: THE SCHOLAR
 * ============================================================================
 * 
 * DESIGN: "The Scholar" — Minimal, breathing whitespace, content-first
 * - Generous margins and padding
 * - Clean, focused layout
 * - Calm, academic feel
 * - Content-first hierarchy
 * 
 * STYLE GUIDE COMPLIANCE:
 * - Exact shadow system (--elevation-1/2/3 with green-tinted shadows)
 * - Dashboard banner with gradient + texture overlay
 * - Large, breathable UI elements
 * - Minimal density
 * - Fade-up animations
 * 
 * ============================================================================
 */

// ============================================================================
// BACKEND CONNECTIONS REQUIRED
// ============================================================================
// 
// 1. ASSIGNMENT DETAILS
//    - Endpoint: GET /api/elearning/courses/[courseId]/assignments
//    - Returns: { assignments: [{ id, title, dueDate, moduleNumber }] }
//    - Filter: Current or upcoming assignments
//
// 2. ASSIGNMENT SPECIFICS
//    - Endpoint: GET /api/elearning/courses/[courseId]/assignments/[assignmentId]
//    - Returns: { id, title, instructions, requirements: string[], dueDate, maxFileSize, allowedFormats }
//    - Caching: 5 minutes
//
// 3. SUBMISSION STATUS
//    - Endpoint: GET /api/elearning/courses/[courseId]/assignments/[assignmentId]/status
//    - Returns: { submitted: boolean, submittedAt?, fileName?, fileSize?, fileUrl? }
//    - Real-time: Check if already submitted
//
// 4. UPLOAD PRESIGNED URL
//    - Endpoint: POST /api/elearning/courses/[courseId]/assignments/[assignmentId]/upload
//    - Body: { fileName, fileType, fileSize }
//    - Returns: { uploadUrl, fileId }
//    - Storage: AWS S3, Google Cloud Storage, or similar
//
// 5. FILE UPLOAD
//    - Method: PUT to uploadUrl from step 4
//    - Body: File binary
//    - Headers: Content-Type, Content-Length
//    - Returns: 200 OK on success
//
// 6. SUBMIT ASSIGNMENT
//    - Endpoint: POST /api/elearning/courses/[courseId]/assignments/[assignmentId]/submit
//    - Body: { fileId, fileName }
//    - Returns: { success: true, submissionId, submittedAt }
//    - Side effects:
//      - Lock assignment (no further submissions)
//      - Send notification to instructor
//      - Update course progress
//
// 7. SUBMISSION CONFIRMATION
//    - Endpoint: GET /api/elearning/courses/[courseId]/assignments/[assignmentId]/submission
//    - Returns: { id, fileName, fileSize, submittedAt, status: 'submitted' | 'grading' | 'graded', grade?, feedback? }
//    - Real-time: Poll every 30 seconds for grading updates
//
// 8. SAVE AS DRAFT (Optional)
//    - Endpoint: POST /api/elearning/courses/[courseId]/assignments/[assignmentId]/draft
//    - Body: { fileId, fileName }
//    - Returns: { success: true, draftId }
//    - Note: Drafts don't count as submissions
//
// 9. DELETE DRAFT
//    - Endpoint: DELETE /api/elearning/courses/[courseId]/assignments/[assignmentId]/draft
//    - Returns: { success: true }
//    - Note: Delete uploaded draft files
//
// 10. ASSIGNMENT RUBRIC
//     - Endpoint: GET /api/elearning/courses/[courseId]/assignments/[assignmentId]/rubric
//     - Returns: { criteria: [{ name, description, maxPoints }] }
//     - Use: Show grading criteria to students
//
// 11. EXTENSION REQUEST
//     - Endpoint: POST /api/elearning/courses/[courseId]/assignments/[assignmentId]/extension
//     - Body: { reason, requestedDeadline }
//     - Returns: { requestId, status: 'pending' }
//     - Note: Requires instructor approval
//
// ============================================================================

import React from "react";
import { Calendar, CheckCircle2, Upload, Send } from "lucide-react";

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

const assignmentData = {
  title: "Value Chain Mapping Exercise",
  courseTitle: "Agricultural Value Chain Analysis",
  moduleNumber: 2,
  dueDate: "2 Apr 2026",
  instructions: "Map the complete value chain for a selected agricultural commodity in your local area. Include all actors from input suppliers to final consumers, identifying key value addition points and constraints.",
  requirements: [
    "Value chain diagram (PDF or image format)",
    "Actor analysis document (500-800 words)",
    "Constraint identification matrix",
  ],
  submissionStatus: null,
  maxFileSize: "10 MB",
  allowedFormats: ".pdf, .doc, .docx, .jpg, .png",
};

// ============================================================================
// ASSIGNMENT SUBMISSION - VARIANT A: THE SCHOLAR
// ============================================================================

export default function AssignmentPage() {
  return (
    <div className="assignment-shell" style={{ background: tokens.canvas, minHeight: '100dvh', padding: '48px 64px' }}>
      <style>{`
        @media (max-width: 920px) {
          .assignment-shell {
            padding: 30px 20px !important;
          }
          .assignment-card {
            padding: 24px 20px !important;
          }
          .assignment-meta {
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .assignment-dropzone {
            padding: 34px 18px !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div className="assignment-card" style={{
          background: tokens.surface,
          borderRadius: '16px',
          padding: '32px',
          boxShadow: elevation2,
          marginBottom: '32px',
        }}>
          <div style={{
            fontSize: '13px',
            color: tokens.textMuted,
            marginBottom: '8px',
          }}>
            {assignmentData.courseTitle} • Module {assignmentData.moduleNumber}
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: tokens.textPrimary,
            marginBottom: '12px',
          }}>
            {assignmentData.title}
          </h1>
          <div className="assignment-meta" style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '15px', color: tokens.textSecondary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} />
              Due: {assignmentData.dueDate}
            </div>
            <div style={{
              padding: '6px 14px',
              background: tokens.canvas,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: tokens.textPrimary,
            }}>
              Not Submitted
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="assignment-card" style={{
          background: tokens.surface,
          borderRadius: '16px',
          padding: '32px',
          boxShadow: elevation2,
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: tokens.textPrimary,
            marginBottom: '16px',
            letterSpacing: '-0.2px',
          }}>
            Instructions
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.65,
            color: tokens.textSecondary,
            marginBottom: '24px',
          }}>
            {assignmentData.instructions}
          </p>

          <div style={{
            padding: '20px 24px',
            background: tokens.canvas,
            borderRadius: '12px',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: tokens.textMuted,
              marginBottom: '12px',
            }}>
              Requirements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignmentData.requirements.map((req, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle2 size={18} color={tokens.greenPrimary} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '15px', color: tokens.textPrimary, lineHeight: 1.6 }}>
                    {req}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div className="assignment-card" style={{
          background: tokens.surface,
          borderRadius: '16px',
          padding: '32px',
          boxShadow: elevation2,
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: tokens.textPrimary,
            marginBottom: '20px',
            letterSpacing: '-0.2px',
          }}>
            Submit Your Work
          </h2>

          {/* Drop zone */}
          <div className="assignment-dropzone" style={{
            border: `2px dashed ${tokens.borderDefault}`,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            background: tokens.canvas,
            marginBottom: '20px',
            transition: 'all 200ms ease-out',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = tokens.greenPrimary;
            e.currentTarget.style.background = tokens.greenWhisper;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = tokens.borderDefault;
            e.currentTarget.style.background = tokens.canvas;
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: tokens.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: elevation1,
            }}>
              <Upload size={28} color={tokens.greenPrimary} />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: '8px',
            }}>
              Click to upload or drag and drop
            </h3>
            <p style={{
              fontSize: '14px',
              color: tokens.textSecondary,
              marginBottom: '12px',
            }}>
              {assignmentData.allowedFormats}
            </p>
            <p style={{
              fontSize: '13px',
              color: tokens.textMuted,
            }}>
              Maximum file size: {assignmentData.maxFileSize}
            </p>
          </div>

          <button style={{
            width: '100%',
            background: `linear-gradient(180deg, ${tokens.greenMedium} 0%, ${tokens.greenPrimary} 100%)`,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'not-allowed',
            opacity: 0.5,
            boxShadow: elevation1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <Send size={16} />
            Submit Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
