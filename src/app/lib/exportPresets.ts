import type { ExportColumn } from "./types";
import type { Course, CourseApprovalSubmission, Registration, Score, User } from "./types";
import { formatCourseFee } from "./types";
import { rowsFromObjects } from "./export";

export const STUDENT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "name", header: "Name" },
  { key: "username", header: "Username" },
  { key: "email", header: "Email" },
  { key: "matricNo", header: "Matric No." },
  { key: "level", header: "Level" },
  { key: "department", header: "Department" },
  { key: "faculty", header: "Faculty" },
];

export const LECTURER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "name", header: "Name" },
  { key: "username", header: "Username" },
  { key: "email", header: "Email" },
  { key: "staffId", header: "Staff ID" },
  { key: "department", header: "Department" },
  { key: "faculty", header: "Faculty" },
  { key: "courses", header: "Assigned Courses" },
];

export const SCORE_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "studentName", header: "Student" },
  { key: "matricNo", header: "Matric No." },
  { key: "courseCode", header: "Course" },
  { key: "ca", header: "CA" },
  { key: "exam", header: "Exam" },
  { key: "total", header: "Total" },
  { key: "grade", header: "Grade" },
  { key: "reviewStatus", header: "Status" },
];

export const REGISTRATION_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "studentName", header: "Student" },
  { key: "matricNo", header: "Matric No." },
  { key: "courseCode", header: "Course" },
  { key: "lecturerName", header: "Lecturer" },
  { key: "courseFee", header: "Course Fee" },
  { key: "paymentStatus", header: "Payment" },
  { key: "department", header: "Department" },
  { key: "lecturerStatus", header: "Lecturer Status" },
  { key: "status", header: "Admin Status" },
  { key: "registeredAt", header: "Registered" },
];

export function studentExportRows(students: User[]) {
  return rowsFromObjects(students, STUDENT_EXPORT_COLUMNS, u => ({
    name: u.name,
    username: u.username,
    email: u.email,
    matricNo: u.matricNo || "—",
    level: u.level ? `${u.level} Level` : "—",
    department: u.department || "—",
    faculty: u.faculty || "—",
  }));
}

export function lecturerExportRows(lecturers: User[], courses: Course[]) {
  return rowsFromObjects(lecturers, LECTURER_EXPORT_COLUMNS, u => ({
    name: u.name,
    username: u.username,
    email: u.email,
    staffId: u.staffId || "—",
    department: u.department || "—",
    faculty: u.faculty || "—",
    courses: courses.filter(c => c.lecturerId === u.id).map(c => c.code).join(", ") || "—",
  }));
}

export function scoreExportRows(scores: Score[]) {
  return rowsFromObjects(scores, SCORE_EXPORT_COLUMNS, s => ({
    studentName: s.studentName,
    matricNo: s.matricNo,
    courseCode: s.courseCode,
    ca: s.ca,
    exam: s.exam,
    total: s.total,
    grade: s.grade,
    reviewStatus: s.reviewStatus || (s.published ? "approved" : "draft"),
  }));
}

export function registrationExportRows(regs: Registration[]) {
  return rowsFromObjects(regs, REGISTRATION_EXPORT_COLUMNS, r => ({
    studentName: r.studentName,
    matricNo: r.matricNo,
    courseCode: r.courseCode,
    lecturerName: r.lecturerName,
    courseFee: formatCourseFee(r.courseFee),
    paymentStatus: r.paymentStatus,
    department: r.department,
    lecturerStatus: r.lecturerStatus || "pending",
    status: r.status,
    registeredAt: new Date(r.registeredAt).toLocaleString(),
  }));
}

export function courseSubmissionExportRows(submissions: CourseApprovalSubmission[]) {
  return rowsFromObjects(
    submissions,
    [
      { key: "courseCode", header: "Course" },
      { key: "lecturerName", header: "Lecturer" },
      { key: "studentCount", header: "Students" },
      { key: "status", header: "Status" },
      { key: "submittedAt", header: "Submitted" },
    ],
    s => ({
      courseCode: s.courseCode,
      lecturerName: s.lecturerName,
      studentCount: s.studentCount,
      status: s.status,
      submittedAt: new Date(s.submittedAt).toLocaleString(),
    })
  );
}
