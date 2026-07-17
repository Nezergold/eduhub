import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Course, CourseApprovalSubmission, Department, Notification, Registration, Score, SemesterResult, User, View } from "../lib/types";
import {
  addCourse, addDepartment, addRegistration, dropRegistration,
  computeAdminStats, computeEnrollmentByFaculty, computeGPATrend,
  computeGradeDistribution, computePassFailByCourse,
  getCourses, getDepartments, getLecturerCourses, getNotifications,
  getRegistrations, getScores, getSemesterResults, getStudentRegistrations,
  getStudentScores, getUnreadCount, getStudentRegistrationSummary, getRecentScores, initStore,
  markAllNotificationsRead, markNotificationRead,
  submitCourseScores, submitCourseScoresForReview, updateCourseLecturer, updateRegistrationStatus,
  upsertScore, publishCourseScores,
  lecturerReviewRegistration, submitCourseApprovalsToAdmin, getCourseApprovalSubmissions,
  adminReviewCourseSubmission, adminReviewScore, adminReviewAllPendingScores,
  getPendingResultReviews, getDeanPendingReviews, approveCoursePayment, purgeLecturerReferences,
  addLecturerCourse, removeLecturerCourse,
  getFacultyCourses, getFacultyStudents, getFacultyLecturers, getFacultyRegistrations, getFacultyScores,
  deanAssignStudentToCourse, deanReviewScore, deanReviewAllPendingScores, deleteScore,
  updateCourse as storeUpdateCourse, deleteCourse as storeDeleteCourse,
} from "../lib/store";
import { getAllUsers } from "../lib/auth";
import { updateUser as authUpdateUser, deleteUser as authDeleteUser, preregisterUser } from "../lib/auth";

interface AppDataContextValue {
  user: User;
  courses: Course[];
  registrations: Registration[];
  scores: Score[];
  courseApprovalSubmissions: CourseApprovalSubmission[];
  pendingResultReviews: Score[];
  departments: Department[];
  notifications: Notification[];
  unreadCount: number;
  refresh: () => void;
  onNavigate: (view: View) => void;
  // Student
  getMyRegistrations: () => Registration[];
  getMyScores: () => Score[];
  getMySemesterResults: () => SemesterResult[];
  registerForCourse: (course: Course, subjects: string[]) => void;
  dropMyRegistration: (id: string) => void;
  // Lecturer
  getMyCourses: () => Course[];
  addMyCourse: (course: Omit<Course, "id" | "lecturer" | "lecturerId" | "subjects">) => void;
  removeMyCourse: (courseId: string) => void;
  submitScores: (course: Course, entries: Parameters<typeof submitCourseScores>[1], options?: { publish?: boolean }) => void;
  submitScoresForReview: (courseCode: string) => number;
  publishCourseScores: (courseCode: string) => number;
  lecturerApproveRegistration: (id: string, note?: string) => void;
  lecturerRejectRegistration: (id: string, note?: string) => void;
  submitCourseApprovals: (courseId: string) => void;
  approveCoursePayment: (registrationId: string) => boolean;
  reviewResult: (studentId: string, courseCode: string, decision: "approved" | "rejected", note?: string) => void;
  reviewAllPendingResults: (courseCode: string, decision: "approved" | "rejected", note?: string) => number;
  reviewCourseSubmission: (submissionId: string, decision: "approved" | "rejected", note?: string) => void;
  // Admin
  createCourse: (course: Omit<Course, "id">) => Course;
  updateCourse: (courseId: string, patch: Partial<Pick<Course, "code" | "title" | "units" | "level" | "semester" | "department" | "faculty">>) => Course | null;
  deleteCourse: (courseId: string) => boolean;
  createDepartment: (name: string, faculty: string) => Department;
  approveRegistration: (id: string) => void;
  rejectRegistration: (id: string) => void;
  assignLecturer: (courseId: string, lecturerId: string, lecturerName: string) => void;
  adminStats: ReturnType<typeof computeAdminStats>;
  gradeDistribution: ReturnType<typeof computeGradeDistribution>;
  passFailData: ReturnType<typeof computePassFailByCourse>;
  enrollData: ReturnType<typeof computeEnrollmentByFaculty>;
  gpaTrend: ReturnType<typeof computeGPATrend>;
  allUsers: User[];
  registrationSummary: ReturnType<typeof getStudentRegistrationSummary>;
  recentScores: ReturnType<typeof getRecentScores>;
  updateUser: (userId: string, input: Parameters<typeof authUpdateUser>[1]) => Promise<{ success: boolean; error?: string; user?: User }>;
  deleteLecturer: (userId: string) => Promise<{ success: boolean; error?: string }>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  // Dean
  getFacultyCourses: (faculty: string) => Course[];
  getFacultyStudents: (faculty: string) => User[];
  getFacultyLecturers: (faculty: string) => User[];
  getFacultyRegistrations: (faculty: string) => Registration[];
  getFacultyScores: (faculty: string) => Score[];
  deanAssignStudent: (studentId: string, courseId: string, subjects: string[]) => Registration | null;
  deanCreateStudentAndAssign: (studentInfo: { name: string; email: string; username: string; matricNo: string; phone?: string; department?: string; faculty?: string; level?: string }, courseId: string) => Promise<{ success: boolean; error?: string; reg?: Registration }>;
  deanReviewResult: (studentId: string, courseCode: string, decision: "approved" | "rejected", note?: string) => void;
  deanReviewAllPendingResults: (courseCode: string, decision: "approved" | "rejected", note?: string) => number;
  deanPendingReviews: Score[];
  deleteScore: (studentId: string, courseCode: string) => boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({
  user,
  onNavigate,
  children,
}: {
  user: User;
  onNavigate: (view: View) => void;
  children: ReactNode;
}) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    initStore();
    const handler = () => refresh();
    const storageHandler = (event: StorageEvent) => {
      if (event.key === "wawuhub_data" || event.key === "wawuhub_users") {
        refresh();
      }
    };
    window.addEventListener("wawuhub:data-changed", handler);
    window.addEventListener("wawuhub:users-changed", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("wawuhub:data-changed", handler);
      window.removeEventListener("wawuhub:users-changed", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [refresh]);

  const courses = useMemo(() => getCourses(), [tick]);
  const registrations = useMemo(() => getRegistrations(), [tick]);
  const scores = useMemo(() => getScores(), [tick]);
  const courseApprovalSubmissions = useMemo(() => getCourseApprovalSubmissions(), [tick]);
  const pendingResultReviews = useMemo(() => getPendingResultReviews(), [tick]);
  const departments = useMemo(() => getDepartments(), [tick]);
  const notifications = useMemo(() => getNotifications(user.id), [tick, user.id]);
  const unreadCount = useMemo(() => getUnreadCount(user.id), [tick, user.id]);
  const allUsers = useMemo(() => getAllUsers(), [tick]);

  const value = useMemo<AppDataContextValue>(() => ({
    user,
    courses,
    registrations,
    scores,
    courseApprovalSubmissions,
    pendingResultReviews,
    departments,
    notifications,
    unreadCount,
    refresh,
    onNavigate,
    getMyRegistrations: () => getStudentRegistrations(user.id),
    getMyScores: () => getStudentScores(user.id),
    getMySemesterResults: () => getSemesterResults(user.id),
    registerForCourse: (course, subjects) => {
      addRegistration(user, course, subjects);
      refresh();
    },
    dropMyRegistration: (id) => {
      dropRegistration(id, user.id);
      refresh();
    },
    getMyCourses: () => getLecturerCourses(user),
    addMyCourse: (course) => {
      addLecturerCourse(user, course);
      refresh();
    },
    removeMyCourse: (courseId) => {
      removeLecturerCourse(user, courseId);
      refresh();
    },
    submitScores: (course, entries, options) => {
      submitCourseScores(course, entries, user, options);
      refresh();
    },
    submitScoresForReview: (courseCode) => {
      const count = submitCourseScoresForReview(courseCode, user);
      refresh();
      return count;
    },
    publishCourseScores: (courseCode) => {
      const count = publishCourseScores(courseCode, user.name);
      refresh();
      return count;
    },
    lecturerApproveRegistration: (id, note) => {
      lecturerReviewRegistration(id, "approved", note);
      refresh();
    },
    lecturerRejectRegistration: (id, note) => {
      lecturerReviewRegistration(id, "rejected", note);
      refresh();
    },
    submitCourseApprovals: (courseId) => {
      submitCourseApprovalsToAdmin(courseId, user);
      refresh();
    },
    approveCoursePayment: (registrationId) => {
      const ok = approveCoursePayment(registrationId, user);
      if (ok) refresh();
      return ok;
    },
    reviewResult: (studentId, courseCode, decision, note) => {
      adminReviewScore(studentId, courseCode, decision, user.name, note);
      refresh();
    },
    reviewAllPendingResults: (courseCode, decision, note) => {
      const count = adminReviewAllPendingScores(courseCode, decision, user.name, note);
      refresh();
      return count;
    },
    reviewCourseSubmission: (submissionId, decision, note) => {
      adminReviewCourseSubmission(submissionId, decision, user.name, note);
      refresh();
    },
    createCourse: (course) => {
      const c = addCourse(course);
      refresh();
      return c;
    },
    updateCourse: (courseId, patch) => {
      const c = storeUpdateCourse(courseId, patch);
      if (c) refresh();
      return c;
    },
    deleteCourse: (courseId) => {
      const ok = storeDeleteCourse(courseId);
      if (ok) refresh();
      return ok;
    },
    createDepartment: (name, faculty) => {
      const d = addDepartment(name, faculty);
      refresh();
      return d;
    },
    approveRegistration: (id) => { updateRegistrationStatus(id, "approved"); refresh(); },
    rejectRegistration: (id) => { updateRegistrationStatus(id, "rejected"); refresh(); },
    assignLecturer: (courseId, lecturerId, lecturerName) => {
      updateCourseLecturer(courseId, lecturerId, lecturerName);
      refresh();
    },
    adminStats: computeAdminStats(),
    gradeDistribution: computeGradeDistribution(),
    passFailData: computePassFailByCourse(),
    enrollData: computeEnrollmentByFaculty(),
    gpaTrend: computeGPATrend(),
    allUsers,
    registrationSummary: getStudentRegistrationSummary(),
    recentScores: getRecentScores(12),
    updateUser: async (userId, input) => {
      const result = await authUpdateUser(userId, input);
      if (result.success) refresh();
      return { success: result.success, error: result.error, user: result.user };
    },
    deleteLecturer: async (userId) => {
      const target = getAllUsers().find(u => u.id === userId);
      if (!target) return { success: false, error: "Account not found." };
      if (target.role !== "lecturer" && target.role !== "dean") return { success: false, error: "Only lecturer and dean accounts can be removed here." };
      if (target.role === "lecturer") purgeLecturerReferences(target.id, target.name);
      const result = await authDeleteUser(userId);
      if (result.success) refresh();
      return { success: result.success, error: result.error };
    },
    markRead: (id) => { markNotificationRead(id); refresh(); },
    markAllRead: () => { markAllNotificationsRead(user.id); refresh(); },
    getFacultyCourses: (faculty) => getFacultyCourses(faculty),
    getFacultyStudents: (faculty) => getFacultyStudents(faculty),
    getFacultyLecturers: (faculty) => getFacultyLecturers(faculty),
    getFacultyRegistrations: (faculty) => getFacultyRegistrations(faculty),
    getFacultyScores: (faculty) => getFacultyScores(faculty),
    deanAssignStudent: (studentId, courseId, subjects) => {
      const reg = deanAssignStudentToCourse(studentId, courseId, subjects);
      refresh();
      return reg;
    },
    deanCreateStudentAndAssign: async (studentInfo, courseId) => {
      const result = await preregisterUser({
        name: studentInfo.name,
        email: studentInfo.email,
        username: studentInfo.username,
        role: "student",
        department: studentInfo.department,
        faculty: studentInfo.faculty,
        level: studentInfo.level,
        matricNo: studentInfo.matricNo,
        phone: studentInfo.phone,
      });
      if (!result.success) return { success: false, error: result.error };
      const newUser = result.user!;
      const reg = deanAssignStudentToCourse(newUser.id, courseId, []);
      refresh();
      return { success: true, reg: reg || undefined };
    },
    deanReviewResult: (studentId, courseCode, decision, note) => {
      deanReviewScore(studentId, courseCode, decision, user.name, note);
      refresh();
    },
    deanReviewAllPendingResults: (courseCode, decision, note) => {
      const count = deanReviewAllPendingScores(courseCode, decision, user.name, note);
      refresh();
      return count;
    },
    deanPendingReviews: getDeanPendingReviews(),
    deleteScore: (studentId, courseCode) => {
      const ok = deleteScore(studentId, courseCode);
      if (ok) refresh();
      return ok;
    },
  }), [user, courses, registrations, scores, courseApprovalSubmissions, pendingResultReviews, departments, notifications, unreadCount, refresh, onNavigate, allUsers, tick]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export { upsertScore };
