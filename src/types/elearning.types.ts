/* ============================================================================
   E-LEARNING TYPES
   ============================================================================
   
   These types define the data structures for the e-learning system,
   including courses, modules, quizzes, assignments, and participant tracking.
   ============================================================================ */

export type CourseStatus = "draft" | "pending_publish" | "published" | "archived";

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

export interface AssignmentQuestion {
  id: string;
  text: string;
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  requirements: string[];
  dueDate?: string;
  maxFileSize?: string;
  allowedFormats?: string[];
}

export interface Module {
  id: string;
  number: number;
  title: string;
  content: string;
  duration?: string;
  quiz?: Quiz;
  assignment?: Assignment;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  status: CourseStatus;
  coordinatorId: string;
  coordinatorName: string;
  modules: Module[];
  passThreshold: number;
  enrolledCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ParticipantStatus = "enrolled" | "in_progress" | "completed";

export interface Participant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  enrolledAt: string;
  status: ParticipantStatus;
  progress: number;
  completedAt?: string;
  finalScore?: number;
  certificateIssued?: boolean;
}

export interface Certificate {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  score: number;
  certificateUrl?: string;
}

export interface CourseFilters {
  search: string;
  status: string;
  category: string;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingPublish: number;
  totalParticipants: number;
  totalCompletions: number;
  certificatesIssued: number;
}
