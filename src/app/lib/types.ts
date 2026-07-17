import { INSTITUTION_FACULTIES } from "./institution";

export type Role = "student" | "lecturer" | "registrar" | "dean";

/** Legacy sessions may still carry admin — treated as registrar */
export function isRegistrarRole(role: string): boolean {
  return role === "registrar" || role === "admin";
}

export function isDeanRole(role: string): boolean {
  return role === "dean";
}

export function portalRole(role: string): Role {
  if (role === "admin") return "registrar";
  return role as Role;
}

export const MAX_LECTURER_COURSES = 4;

export type View =
  | "dashboard" | "profile" | "registration" | "results"
  | "courses" | "students" | "scores" | "course-approvals" | "fee-payments" | "users"
  | "departments" | "course-mgmt" | "assignments" | "approvals" | "result-reviews" | "analytics"
  | "dean-overview" | "dean-courses" | "dean-lecturers" | "dean-students" | "dean-reviews" | "dean-analytics"
  | "settings";

export type ReviewStatus = "draft" | "pending" | "dean_review" | "approved" | "rejected";
export type PaymentStatus = "unpaid" | "paid";

/** Flat course registration fee (pay physically at the bursary) */
export const COURSE_REGISTRATION_FEE = 1_000;

/** @deprecated use COURSE_REGISTRATION_FEE — kept for imports */
export const COURSE_FEE_PER_UNIT = COURSE_REGISTRATION_FEE;

export function computeCourseFee(_units?: number): number {
  return COURSE_REGISTRATION_FEE;
}

export function formatCourseFee(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(amount);
}

export const ACADEMIC_LEVELS = ["100", "200", "300", "400"] as const;
export type AcademicLevel = (typeof ACADEMIC_LEVELS)[number];

export type NotificationType =
  | "registration" | "score" | "approval" | "course" | "system" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  matricNo?: string;
  staffId?: string;
  department?: string;
  faculty?: string;
  level?: string;
  semester?: number;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

export interface CourseSubject {
  id: string;
  code: string;
  title: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  department: string;
  faculty: string;
  lecturer: string;
  lecturerId?: string;
  level: string;
  semester: number;
  subjects: CourseSubject[];
}

export interface Registration {
  id: string;
  studentId: string;
  studentName: string;
  matricNo: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  subjects: string[];
  faculty: string;
  department: string;
  /** Final registrar decision */
  status: "pending" | "approved" | "rejected";
  /** Lecturer review of this registration */
  lecturerStatus?: ReviewStatus;
  lecturerNote?: string;
  /** Handed off to registrar for finalization */
  submittedToAdmin?: boolean;
  submittedToRegistrar?: boolean;
  lecturerId?: string;
  lecturerName: string;
  courseFee: number;
  paymentStatus: PaymentStatus;
  paymentApprovedAt?: string;
  paymentApprovedBy?: string;
  date: string;
  registeredAt: string;
}

export interface CourseApprovalSubmission {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  registrationIds: string[];
  studentCount: number;
  status: ReviewStatus;
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Score {
  studentId: string;
  studentName: string;
  matricNo: string;
  courseCode: string;
  courseId?: string;
  courseTitle?: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  gradePoint: number;
  published: boolean;
  publishedAt?: string;
  feedback?: string;
  submittedAt?: string;
  submittedBy?: string;
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  /** Locked after lecturer submits final sheet to registrar */
  locked?: boolean;
}

export interface Department {
  id: string;
  name: string;
  faculty: string;
}

export interface SemesterResult {
  semester: string;
  gpa: number;
  units: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: View;
}

export interface RegisterInput {
  name: string;
  email: string;
  username: string;
  password?: string;
  role: Role;
  department?: string;
  faculty?: string;
  level?: string;
  semester?: number;
  staffId?: string;
  matricNo?: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  username?: string;
  department?: string;
  faculty?: string;
  level?: string;
  semester?: number;
  password?: string;
  staffId?: string;
  matricNo?: string;
  avatar?: string;
  phone?: string;
}

export type ExportFormat = "pdf" | "docx" | "csv";

export interface ExportColumn {
  key: string;
  header: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  /** Non-fatal cloud sync/auth notice — account still created locally */
  warning?: string;
}

export interface AccountLookupResult {
  found: boolean;
  needsPassword: boolean;
  user?: User;
  error?: string;
}

export interface RegisterOptions {
  /** When false, account is saved but the current session is not replaced (enrollment). */
  establishSession?: boolean;
}

/** Official WAUU faculty and department structure */
export const FACULTY_STRUCTURE = INSTITUTION_FACULTIES.map(f => ({
  id: f.id,
  faculty: f.name,
  dean: f.dean,
  departments: f.departments,
}));

export const FACULTIES = FACULTY_STRUCTURE.map(f => f.faculty);

export const DEPARTMENT_NAMES = FACULTY_STRUCTURE.flatMap(f => f.departments);

export function getFacultyForDepartment(department: string): string {
  const match = FACULTY_STRUCTURE.find(f => f.departments.includes(department));
  return match?.faculty ?? "General";
}

export function getDepartmentsByFaculty(faculty: string): string[] {
  return FACULTY_STRUCTURE.find(f => f.faculty === faculty)?.departments ?? [];
}

export const INSTITUTION_NAME = "The West African Union University";
export const PORTAL_NAME = "WAWUHUB";
export const INSTITUTION_MOTTO = "Knowledge is the insurance against ignorance";
