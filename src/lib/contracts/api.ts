/**
 * API Endpoint Path Constants
 * 
 * Centralized API route definitions to ensure consistency across the application.
 * All API calls should reference these constants instead of hardcoding paths.
 * 
 * Usage:
 * ```ts
 * import { API } from '@/lib/contracts/api';
 * 
 * fetch(API.APPLICATIONS.LIST) // GET /api/applications
 * fetch(API.APPLICATIONS.BY_ID('123')) // GET /api/applications/123
 * ```
 */

// ============================================================================
// Base API Routes
// ============================================================================

const API_BASE = '/api';

// ============================================================================
// Authentication Routes
// ============================================================================

export const AUTH_API = {
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,
  REGISTER: `${API_BASE}/auth/register`,
  CALLBACK: `${API_BASE}/auth/callback`,
  RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
  UPDATE_PASSWORD: `${API_BASE}/auth/update-password`,
} as const;

// ============================================================================
// Application Routes
// ============================================================================

export const APPLICATIONS_API = {
  LIST: `${API_BASE}/applications`,
  CREATE: `${API_BASE}/applications`,
  BY_ID: (id: string) => `${API_BASE}/applications/${id}`,
  UPDATE: (id: string) => `${API_BASE}/applications/${id}`,
  DELETE: (id: string) => `${API_BASE}/applications/${id}`,
  DOCUMENTS: (id: string) => `${API_BASE}/applications/${id}/documents`,
} as const;

// ============================================================================
// Training Programme Routes
// ============================================================================

export const TRAINING_API = {
  LIST: `${API_BASE}/training`,
  CREATE: `${API_BASE}/training`,
  BY_ID: (id: string) => `${API_BASE}/training/${id}`,
  UPDATE: (id: string) => `${API_BASE}/training/${id}`,
  DELETE: (id: string) => `${API_BASE}/training/${id}`,
  PUBLISH: (id: string) => `${API_BASE}/training/${id}/publish`,
  ENROLL: (id: string) => `${API_BASE}/training/${id}/enroll`,
  ENROLLMENTS: (id: string) => `${API_BASE}/training/${id}/enrollments`,
} as const;

// ============================================================================
// Payment Routes
// ============================================================================

export const PAYMENTS_API = {
  LIST: `${API_BASE}/payments`,
  CREATE: `${API_BASE}/payments/create`,
  STATUS: `${API_BASE}/payments/status`,
  RECEIPT: `${API_BASE}/payments/receipt`,
  BANK_DETAILS: `${API_BASE}/payments/bank-details`,
  WEBHOOK: `${API_BASE}/payments/webhook`,
  BY_ID: (id: string) => `${API_BASE}/payments/${id}`,
} as const;

export const ADMIN_PAYMENTS_API = {
  LIST: `${API_BASE}/admin/payments`,
  BY_ID: (id: string) => `${API_BASE}/admin/payments/${id}`,
  APPROVE: (id: string) => `${API_BASE}/admin/payments/${id}/approve`,
  REJECT: (id: string) => `${API_BASE}/admin/payments/${id}/reject`,
  RECEIPT: (id: string) => `${API_BASE}/admin/payments/${id}/receipt`,
} as const;

// ============================================================================
// E-Learning Routes
// ============================================================================

export const ELEARNING_API = {
  COURSES: {
    LIST: `${API_BASE}/elearning/courses`,
    CREATE: `${API_BASE}/elearning/courses`,
    BY_ID: (id: string) => `${API_BASE}/elearning/courses/${id}`,
    UPDATE: (id: string) => `${API_BASE}/elearning/courses/${id}`,
    DELETE: (id: string) => `${API_BASE}/elearning/courses/${id}`,
    ENROLL: (id: string) => `${API_BASE}/elearning/courses/${id}/enroll`,
    PROGRESS: (id: string) => `${API_BASE}/elearning/courses/${id}/progress`,
  },
  MODULES: {
    LIST: (courseId: string) => `${API_BASE}/elearning/courses/${courseId}/modules`,
    CREATE: (courseId: string) => `${API_BASE}/elearning/courses/${courseId}/modules`,
    BY_ID: (courseId: string, moduleId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/modules/${moduleId}`,
    UPDATE: (courseId: string, moduleId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/modules/${moduleId}`,
    DELETE: (courseId: string, moduleId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/modules/${moduleId}`,
  },
  QUIZZES: {
    LIST: (courseId: string) => `${API_BASE}/elearning/courses/${courseId}/quizzes`,
    CREATE: (courseId: string) => `${API_BASE}/elearning/courses/${courseId}/quizzes`,
    BY_ID: (courseId: string, quizId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/quizzes/${quizId}`,
    SUBMIT: (courseId: string, quizId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/quizzes/${quizId}/submit`,
  },
  ASSIGNMENTS: {
    LIST: (courseId: string) => `${API_BASE}/elearning/courses/${courseId}/assignments`,
    CREATE: (courseId: string) => `${API_BASE}/elearning/courses/${courseId}/assignments`,
    BY_ID: (courseId: string, assignmentId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/assignments/${assignmentId}`,
    SUBMIT: (courseId: string, assignmentId: string) =>
      `${API_BASE}/elearning/courses/${courseId}/assignments/${assignmentId}/submit`,
  },
} as const;

// ============================================================================
// Certificate Routes
// ============================================================================

export const CERTIFICATES_API = {
  LIST: `${API_BASE}/certificates`,
  GENERATE: `${API_BASE}/certificates/generate`,
  BY_ID: (id: string) => `${API_BASE}/certificates/${id}`,
  VERIFY: (certificateNumber: string) => `${API_BASE}/certificates/verify/${certificateNumber}`,
} as const;

// ============================================================================
// Upload Routes
// ============================================================================

export const UPLOADS_API = {
  PRESIGN: `${API_BASE}/uploads/presign`,
  CONFIRM: `${API_BASE}/uploads/confirm`,
  DELETE: (objectKey: string) => `${API_BASE}/uploads/${encodeURIComponent(objectKey)}`,
} as const;

// ============================================================================
// Email Routes (Internal/System)
// ============================================================================

export const EMAIL_API = {
  SEND: `${API_BASE}/email`,
  QUEUE: `${API_BASE}/email/queue`,
  STATUS: (id: string) => `${API_BASE}/email/${id}`,
} as const;

// ============================================================================
// Admin Routes
// ============================================================================

export const ADMIN_API = {
  APPLICATIONS: {
    LIST: `${API_BASE}/admin/applications`,
    BY_ID: (id: string) => `${API_BASE}/admin/applications/${id}`,
    UPDATE_STATUS: (id: string) => `${API_BASE}/admin/applications/${id}/status`,
  },
  TRAINING: {
    LIST: `${API_BASE}/admin/training`,
    BY_ID: (id: string) => `${API_BASE}/admin/training/${id}`,
  },
  PAYMENTS: {
    LIST: `${API_BASE}/admin/payments`,
    BY_ID: (id: string) => `${API_BASE}/admin/payments/${id}`,
    OVERRIDE: (id: string) => `${API_BASE}/admin/payments/${id}/override`,
  },
  ELEARNING: {
    COURSES: `${API_BASE}/admin/elearning/courses`,
    COURSE_BY_ID: (id: string) => `${API_BASE}/admin/elearning/courses/${id}`,
    ENROLLMENTS: (courseId: string) => `${API_BASE}/admin/elearning/courses/${courseId}/enrollments`,
  },
  REPORTS: {
    APPLICATIONS: `${API_BASE}/admin/reports/applications`,
    TRAINING: `${API_BASE}/admin/reports/training`,
    PAYMENTS: `${API_BASE}/admin/reports/payments`,
    ELEARNING: `${API_BASE}/admin/reports/elearning`,
  },
  AUDIT: {
    LIST: `${API_BASE}/admin/audit`,
    BY_ID: (id: string) => `${API_BASE}/admin/audit/${id}`,
  },
} as const;

// ============================================================================
// Super Admin Routes
// ============================================================================

export const SUPER_ADMIN_API = {
  USERS: {
    LIST: `${API_BASE}/super-admin/users`,
    BY_ID: (id: string) => `${API_BASE}/super-admin/users/${id}`,
    UPDATE_ROLE: (id: string) => `${API_BASE}/super-admin/users/${id}/role`,
  },
  ROLES: {
    LIST: `${API_BASE}/super-admin/roles`,
    CREATE: `${API_BASE}/super-admin/roles`,
    BY_ID: (id: string) => `${API_BASE}/super-admin/roles/${id}`,
    UPDATE: (id: string) => `${API_BASE}/super-admin/roles/${id}`,
    DELETE: (id: string) => `${API_BASE}/super-admin/roles/${id}`,
  },
  TRAINING: {
    APPROVE: (id: string) => `${API_BASE}/super-admin/training/${id}/approve`,
    REJECT: (id: string) => `${API_BASE}/super-admin/training/${id}/reject`,
    CANCEL: (id: string) => `${API_BASE}/super-admin/training/${id}/cancel`,
  },
  ELEARNING: {
    APPROVE: (id: string) => `${API_BASE}/super-admin/elearning/courses/${id}/approve`,
    REJECT: (id: string) => `${API_BASE}/super-admin/elearning/courses/${id}/reject`,
    ARCHIVE: (id: string) => `${API_BASE}/super-admin/elearning/courses/${id}/archive`,
  },
  AUDIT: {
    LIST: `${API_BASE}/super-admin/audit`,
    EXPORT: `${API_BASE}/super-admin/audit/export`,
    BY_ID: (id: string) => `${API_BASE}/super-admin/audit/${id}`,
  },
} as const;

// ============================================================================
// Unified API Export
// ============================================================================

/**
 * Main API route object - use this for all API calls
 */
export const API = {
  AUTH: AUTH_API,
  APPLICATIONS: APPLICATIONS_API,
  TRAINING: TRAINING_API,
  PAYMENTS: PAYMENTS_API,
  ELEARNING: ELEARNING_API,
  CERTIFICATES: CERTIFICATES_API,
  UPLOADS: UPLOADS_API,
  EMAIL: EMAIL_API,
  ADMIN: ADMIN_API,
  SUPER_ADMIN: SUPER_ADMIN_API,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type ApiRoutes = typeof API;
