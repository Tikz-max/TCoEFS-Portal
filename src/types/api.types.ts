/**
 * API Types - Unified API response wrappers and request/response types
 * 
 * All API routes should return responses conforming to these interfaces
 * for consistency across the application.
 */

// ============================================================================
// Base API Response
// ============================================================================

/**
 * Standard API response wrapper
 * 
 * Success response: { data: T, message?: string }
 * Error response: { error: string, message?: string }
 * 
 * Usage:
 * ```ts
 * // Success
 * return NextResponse.json<ApiResponse<User>>({ 
 *   data: user, 
 *   message: 'User created successfully' 
 * });
 * 
 * // Error
 * return NextResponse.json<ApiResponse>({ 
 *   error: 'User not found' 
 * }, { status: 404 });
 * ```
 */
export interface ApiResponse<T = unknown> {
  /** Response data (present on success) */
  data?: T;
  /** Error message (present on error) */
  error?: string;
  /** Optional additional message */
  message?: string;
}

// ============================================================================
// Paginated Response
// ============================================================================

/**
 * Paginated API response
 * 
 * Extends ApiResponse with pagination metadata
 * 
 * Usage:
 * ```ts
 * return NextResponse.json<PaginatedResponse<User>>({
 *   data: users,
 *   total: 100,
 *   page: 1,
 *   pageSize: 10,
 *   totalPages: 10
 * });
 * ```
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Total number of records */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages?: number;
}

// ============================================================================
// Request Query Parameters
// ============================================================================

/**
 * Standard pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

/**
 * Standard sorting query parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Standard filtering query parameters
 */
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Combined query parameters for list endpoints
 */
export interface ListQueryParams extends PaginationParams, SortParams, FilterParams {}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Structured error response with additional context
 */
export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Validation error response
 */
export interface ValidationError extends ApiError {
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

// ============================================================================
// Success Response Types
// ============================================================================

/**
 * Simple success message response
 */
export interface SuccessResponse {
  message: string;
  data?: unknown;
}

/**
 * ID response (for create operations)
 */
export interface IdResponse {
  id: string;
  message?: string;
}

// ============================================================================
// File Upload Types
// ============================================================================

/**
 * Presigned URL response
 */
export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

/**
 * File upload confirmation response
 */
export interface UploadConfirmResponse {
  url: string;
  objectKey: string;
  fileSize?: number;
  contentType?: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Login response
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  redirectUrl?: string;
  message?: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
  message?: string;
}

// ============================================================================
// Payment Types
// ============================================================================

/**
 * Manual payment creation response
 */
export interface ManualPaymentResponse {
  paymentId: string;
  amount: number;
  status: 'pending';
  createdAt: string;
}

/**
 * Admin payment approval request payload
 */
export interface PaymentApprovalRequest {
  action: 'approve' | 'reject';
  notes?: string;
}

/**
 * Admin payment approval/rejection response payload
 */
export interface PaymentApprovalResponse {
  paymentId: string;
  status: 'successful' | 'failed';
  approvedAt?: string;
  approvedBy?: string;
}

/**
 * Bank transfer account details response payload
 */
export interface BankTransferDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
  amount: number;
}

/**
 * Payment verification response
 */
export interface VerifyPaymentResponse {
  status:
    | 'pending'
    | 'pending_receipt'
    | 'pending_approval'
    | 'successful'
    | 'failed';
  amount: number;
  receiptUploadedAt?: string;
  paymentDate?: string;
  message?: string;
}

// ============================================================================
// Certificate Types
// ============================================================================

/**
 * Certificate generation response
 */
export interface GenerateCertificateResponse {
  certificateId: string;
  certificateNumber: string;
  issuedAt: string;
}

/**
 * Certificate verification response
 */
export interface VerifyCertificateResponse {
  valid: boolean;
  holderName?: string;
  courseName?: string;
  issuedAt?: string;
  certificateNumber?: string;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Base report response
 */
export interface ReportResponse<T = unknown> {
  data: T;
  generatedAt: string;
  filters?: Record<string, unknown>;
}

/**
 * Applications report data
 */
export interface ApplicationsReportData {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byProgramme: Array<{ programmeId: string; programmeName: string; count: number }>;
  trend: Array<{ date: string; count: number }>;
}

/**
 * Training report data
 */
export interface TrainingReportData {
  programmes: Array<{
    id: string;
    title: string;
    status: string;
    enrollmentCount: number;
    capacity: number;
  }>;
  totalEnrollments: number;
  totalRevenue: number;
  averageCompletionRate: number;
}

/**
 * Payments report data
 */
export interface PaymentsReportData {
  totalCollected: number;
  byStatus: Array<{ status: string; count: number; amount: number }>;
  byProgramme: Array<{ programmeId: string; programmeName: string; amount: number }>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
}

/**
 * E-learning report data
 */
export interface ElearningReportData {
  courses: Array<{
    id: string;
    title: string;
    enrollmentCount: number;
    completionRate: number;
  }>;
  totalEnrollments: number;
  averageCompletionRate: number;
  popularCourses: Array<{ id: string; title: string; enrollmentCount: number }>;
}

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    email: string;
    name: string;
  };
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Extract data type from ApiResponse
 */
export type ExtractData<T> = T extends ApiResponse<infer D> ? D : never;

/**
 * Make all properties of T nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Make specific properties of T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties of T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
