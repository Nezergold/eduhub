import { getAllUsers } from "./auth";
import type {
  Course, CourseApprovalSubmission, Department, Notification, NotificationType,
  Registration, ReviewStatus, Score, SemesterResult, User, View,
} from "./types";
import { computeCourseFee, formatCourseFee, COURSE_REGISTRATION_FEE, DEPARTMENT_NAMES, FACULTIES, FACULTY_STRUCTURE, getFacultyForDepartment, isRegistrarRole, MAX_LECTURER_COURSES } from "./types";
import { calcGrade, today, uid } from "./utils";
import { scheduleCloudPush } from "./cloudSync";

const STORE_KEY = "wawuhub_data";
const STORE_VERSION = 7;

interface DataStore {
  version: number;
  courses: Course[];
  registrations: Registration[];
  scores: Score[];
  departments: Department[];
  semesterResults: Record<string, SemesterResult[]>;
  notifications: Notification[];
  courseApprovalSubmissions: CourseApprovalSubmission[];
}

function buildSubjects(courseCode: string, title: string): Course["subjects"] {
  return [
    { id: `${courseCode}-T`, code: `${courseCode}-T`, title: `${title} — Theory` },
    { id: `${courseCode}-P`, code: `${courseCode}-P`, title: `${title} — Practical` },
    { id: `${courseCode}-L`, code: `${courseCode}-L`, title: `${title} — Laboratory` },
  ];
}

const SEED_COURSES: Course[] = [
  { id: "C001", code: "COMP101", title: "Introduction to Computer Science", units: 3, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Azino", lecturerId: "LEC001", level: "100", semester: 2, subjects: buildSubjects("COMP101", "Introduction to Computer Science") },
  { id: "C002", code: "COMP115", title: "Computer Programming", units: 4, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Azino", lecturerId: "LEC001", level: "100", semester: 2, subjects: buildSubjects("COMP115", "Computer Programming") },
  { id: "C003", code: "CMP111", title: "Digital Logic Design", units: 3, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Azino", lecturerId: "LEC001", level: "200", semester: 1, subjects: buildSubjects("CMP111", "Digital Logic Design") },
  { id: "C004", code: "CMP211", title: "Data Structures and Algorithms", units: 3, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Ola", lecturerId: "LEC002", level: "200", semester: 2, subjects: buildSubjects("CMP211", "Data Structures and Algorithms") },
  { id: "C005", code: "CMS313", title: "Software Engineering", units: 5, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Ola", lecturerId: "LEC002", level: "300", semester: 1, subjects: buildSubjects("CMS313", "Software Engineering") },
  { id: "C006", code: "CMS512", title: "Artificial Intelligence", units: 5, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Ola", lecturerId: "LEC002", level: "300", semester: 1, subjects: buildSubjects("CMS512", "Artificial Intelligence") },
  { id: "C007", code: "CMP513", title: "Network and Network Configuration", units: 4, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Odun", lecturerId: "LEC003", level: "300", semester: 2, subjects: buildSubjects("CMP513", "Network and Network Configuration") },
  { id: "C008", code: "CMP300", title: "Computer Graphics", units: 5, department: "Computer Science", faculty: "Science & Technology", lecturer: "Mr. Odun", lecturerId: "LEC003", level: "300", semester: 2, subjects: buildSubjects("CMP300", "Computer Graphics") },
];

function seedRegistration(
  partial: Omit<Registration, "matricNo" | "subjects" | "faculty" | "department" | "registeredAt" | "lecturerName" | "courseFee" | "paymentStatus"> & {
    matricNo: string;
    subjects?: string[];
    paymentStatus?: Registration["paymentStatus"];
  }
): Registration {
  const course = SEED_COURSES.find(c => c.id === partial.courseId);
  const ts = `${partial.date}T09:00:00.000Z`;
  const units = course?.units ?? 3;
  return {
    ...partial,
    subjects: partial.subjects ?? course?.subjects.map(s => s.title) ?? [],
    faculty: course?.faculty ?? "Science and Technology",
    department: course?.department ?? "Computer Science",
    lecturerId: course?.lecturerId,
    lecturerName: course?.lecturer ?? "—",
    courseFee: partial.courseFee ?? computeCourseFee(),
    paymentStatus: partial.paymentStatus ?? (partial.status === "approved" ? "paid" : "unpaid"),
    registeredAt: ts,
  };
}

const SEED_REGISTRATIONS: Registration[] = [
  seedRegistration({ id: "R001", studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseId: "C001", courseCode: "COMP101", courseTitle: "Introduction to Computer Science", status: "approved", date: "2024-01-15" }),
  seedRegistration({ id: "R002", studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseId: "C002", courseCode: "COMP115", courseTitle: "Computer Programming", status: "approved", date: "2024-01-15" }),
  seedRegistration({ id: "R003", studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseId: "C003", courseCode: "CMP111", courseTitle: "Digital Logic Design", status: "approved", date: "2024-01-15" }),
  seedRegistration({ id: "R004", studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseId: "C007", courseCode: "CMP513", courseTitle: "Network and Network Configuration", status: "pending", date: "2024-01-16", paymentStatus: "unpaid" }),
  seedRegistration({ id: "R005", studentId: "STU002", studentName: "Emeka Chukwu", matricNo: "BIO/2024/001", courseId: "C001", courseCode: "COMP101", courseTitle: "Introduction to Computer Science", status: "approved", date: "2024-01-15" }),
  seedRegistration({ id: "R006", studentId: "STU002", studentName: "Emeka Chukwu", matricNo: "BIO/2024/001", courseId: "C002", courseCode: "COMP115", courseTitle: "Computer Programming", status: "pending", date: "2024-01-16", paymentStatus: "unpaid" }),
  seedRegistration({ id: "R007", studentId: "STU003", studentName: "Fatima Bello", matricNo: "HRM/2024/001", courseId: "C005", courseCode: "CMS313", courseTitle: "Software Engineering", status: "approved", date: "2024-01-15" }),
];

const SEED_SCORES: Score[] = [
  { studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseCode: "COMP101", courseId: "C001", courseTitle: "Introduction to Computer Science", ca: 35, exam: 52, total: 87, grade: "A", gradePoint: 5.0, published: true, publishedAt: "2024-02-10T14:30:00.000Z", submittedAt: "2024-02-10T14:00:00.000Z", submittedBy: "Mr. Azino", reviewStatus: "approved" },
  { studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseCode: "COMP115", courseId: "C002", courseTitle: "Computer Programming", ca: 28, exam: 44, total: 72, grade: "B", gradePoint: 4.0, published: true, publishedAt: "2024-02-10T14:30:00.000Z", submittedAt: "2024-02-10T14:00:00.000Z", submittedBy: "Mr. Azino", reviewStatus: "approved" },
  { studentId: "STU001", studentName: "Adaeze Okonkwo", matricNo: "CSC/2024/001", courseCode: "CMP111", courseId: "C003", courseTitle: "Digital Logic Design", ca: 32, exam: 49, total: 81, grade: "A", gradePoint: 5.0, published: true, publishedAt: "2024-02-11T10:20:00.000Z", submittedAt: "2024-02-11T10:00:00.000Z", submittedBy: "Mr. Azino", reviewStatus: "approved" },
  { studentId: "STU002", studentName: "Emeka Chukwu", matricNo: "BIO/2024/001", courseCode: "COMP101", courseId: "C001", courseTitle: "Introduction to Computer Science", ca: 22, exam: 38, total: 60, grade: "C", gradePoint: 3.0, published: true, publishedAt: "2024-02-10T14:30:00.000Z", submittedAt: "2024-02-10T14:00:00.000Z", submittedBy: "Mr. Azino", reviewStatus: "approved" },
  { studentId: "STU002", studentName: "Emeka Chukwu", matricNo: "BIO/2024/001", courseCode: "COMP115", courseId: "C002", courseTitle: "Computer Programming", ca: 18, exam: 31, total: 49, grade: "D", gradePoint: 2.0, published: true, publishedAt: "2024-02-10T14:30:00.000Z", submittedAt: "2024-02-10T14:00:00.000Z", submittedBy: "Mr. Azino", reviewStatus: "approved" },
  { studentId: "STU003", studentName: "Fatima Bello", matricNo: "HRM/2024/001", courseCode: "CMS313", courseId: "C005", courseTitle: "Software Engineering", ca: 38, exam: 55, total: 93, grade: "A", gradePoint: 5.0, published: true, publishedAt: "2024-02-12T09:30:00.000Z", submittedAt: "2024-02-12T09:00:00.000Z", submittedBy: "Mr. Ola", reviewStatus: "approved" },
];

const SEED_SEMESTER_RESULTS: Record<string, SemesterResult[]> = {
  STU001: [
    { semester: "2022/1", gpa: 3.8, units: 18 },
    { semester: "2022/2", gpa: 4.1, units: 18 },
    { semester: "2023/1", gpa: 3.9, units: 21 },
    { semester: "2023/2", gpa: 4.4, units: 20 },
    { semester: "2024/1", gpa: 4.6, units: 19 },
  ],
  STU002: [
    { semester: "2022/1", gpa: 3.2, units: 18 },
    { semester: "2022/2", gpa: 3.0, units: 18 },
    { semester: "2023/1", gpa: 2.8, units: 21 },
  ],
  STU003: [
    { semester: "2022/1", gpa: 4.5, units: 18 },
    { semester: "2022/2", gpa: 4.7, units: 18 },
  ],
};

function readStore(): DataStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    return normalizeStore(JSON.parse(raw) as Partial<DataStore>);
  } catch {
    return emptyStore();
  }
}

function normalizeStore(parsed: Partial<DataStore>): DataStore {
  const empty = emptyStore();
  return {
    version: typeof parsed.version === "number" ? parsed.version : empty.version,
    courses: Array.isArray(parsed.courses) ? parsed.courses : empty.courses,
    registrations: Array.isArray(parsed.registrations) ? parsed.registrations : empty.registrations,
    scores: Array.isArray(parsed.scores) ? parsed.scores : empty.scores,
    departments: Array.isArray(parsed.departments) ? parsed.departments : empty.departments,
    semesterResults: parsed.semesterResults && typeof parsed.semesterResults === "object"
      ? parsed.semesterResults
      : empty.semesterResults,
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : empty.notifications,
    courseApprovalSubmissions: Array.isArray(parsed.courseApprovalSubmissions)
      ? parsed.courseApprovalSubmissions
      : empty.courseApprovalSubmissions,
  };
}

function emptyStore(): DataStore {
  return {
    version: STORE_VERSION,
    courses: [],
    registrations: [],
    scores: [],
    departments: [],
    semesterResults: {},
    notifications: [],
    courseApprovalSubmissions: [],
  };
}

function buildDepartments(): Department[] {
  let idx = 0;
  return FACULTY_STRUCTURE.flatMap(f =>
    f.departments.map(name => ({
      id: `D${++idx}`,
      name,
      faculty: f.faculty,
    }))
  );
}

function enrichRegistration(r: Registration, store: DataStore): Registration {
  const course = store.courses.find(c => c.id === r.courseId);
  const student = getAllUsers().find(u => u.id === r.studentId);
  const units = course?.units ?? 3;
  return {
    ...r,
    matricNo: r.matricNo || student?.matricNo || "—",
    subjects: r.subjects?.length ? r.subjects : course?.subjects.map(s => s.title) ?? [],
    faculty: r.faculty || course?.faculty || getFacultyForDepartment(course?.department || ""),
    department: r.department || course?.department || student?.department || "—",
    registeredAt: r.registeredAt || `${r.date}T09:00:00.000Z`,
    lecturerStatus: r.lecturerStatus ?? (r.status === "approved" ? "approved" : "pending"),
    submittedToAdmin: r.submittedToAdmin ?? r.submittedToRegistrar ?? (r.status !== "pending"),
    submittedToRegistrar: r.submittedToRegistrar ?? r.submittedToAdmin ?? (r.status !== "pending"),
    lecturerId: r.lecturerId || course?.lecturerId,
    lecturerName: r.lecturerName || course?.lecturer || "—",
    courseFee: r.courseFee ?? computeCourseFee(),
    paymentStatus: r.paymentStatus ?? (r.status === "approved" ? "paid" : "unpaid"),
  };
}

function migrateStore(store: DataStore): boolean {
  let changed = false;
  if (!store.courseApprovalSubmissions) {
    store.courseApprovalSubmissions = [];
    changed = true;
  }
  if (store.version < 4) {
    store.departments = store.departments?.length ? store.departments : buildDepartments();
    store.courses = store.courses.map(c => ({
      ...c,
      faculty: getFacultyForDepartment(c.department) || c.faculty,
      subjects: c.subjects?.length ? c.subjects : buildSubjects(c.code, c.title),
    }));
    store.registrations = store.registrations.map(r => enrichRegistration(r, store));
    store.scores = store.scores.map(s => {
      const course = store.courses.find(c => c.code === s.courseCode);
      const published = Boolean(s.published);
      return {
        ...s,
        courseTitle: s.courseTitle || course?.title,
        published,
        publishedAt: published ? (s.publishedAt || s.submittedAt) : undefined,
        submittedAt: s.submittedAt || new Date().toISOString(),
        reviewStatus: s.reviewStatus ?? (published ? "approved" : "draft"),
      };
    });
    store.version = 4;
    changed = true;
  }
  if (store.version < STORE_VERSION) {
    store.registrations = store.registrations.map(r => ({
      ...enrichRegistration(r, store),
      courseFee: COURSE_REGISTRATION_FEE,
    }));
    store.version = STORE_VERSION;
    changed = true;
  }
  return changed;
}

function writeStore(store: DataStore): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("wawuhub:data-changed"));
  scheduleCloudPush();
}

let storeInitialized = false;

export function initStore(): void {
  if (storeInitialized) return;
  let store = readStore();
  if (store.courses.length === 0) {
    store.courses = [...SEED_COURSES];
    store.registrations = [...SEED_REGISTRATIONS];
    store.scores = [...SEED_SCORES];
    store.semesterResults = { ...SEED_SEMESTER_RESULTS };
    store.departments = buildDepartments();
    store.version = STORE_VERSION;
    const now = new Date().toISOString();
    store.notifications = [
      { id: "N001", userId: "REG001", title: "Pending Registrations", message: "2 course registrations await your approval.", type: "registration", read: false, createdAt: now, link: "approvals" },
      { id: "N002", userId: "STU001", title: "Registration Pending", message: "Your registration for CMP513 is pending admin approval.", type: "registration", read: false, createdAt: now, link: "registration" },
      { id: "N003", userId: "STU001", title: "Results Published", message: "Your score for COMP101 has been uploaded. Grade: A.", type: "score", read: false, createdAt: now, link: "results" },
      { id: "N004", userId: "STU002", title: "Registration Pending", message: "Your registration for COMP115 is pending admin approval.", type: "registration", read: false, createdAt: now, link: "registration" },
      { id: "N005", userId: "LEC001", title: "New Student Enrolled", message: "Adaeze Okonkwo joined COMP101.", type: "registration", read: false, createdAt: now, link: "students" },
      { id: "N006", userId: "LEC001", title: "Course Assignment", message: "You have been assigned to teach COMP101 — Introduction to Computer Science.", type: "course", read: true, createdAt: now, link: "courses" },
    ];
    store.courseApprovalSubmissions = [];
    writeStore(store);
  } else if (migrateStore(store)) {
    writeStore(store);
  }
  storeInitialized = true;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function getNotifications(userId: string): Notification[] {
  return readStore().notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadCount(userId: string): number {
  return getNotifications(userId).filter(n => !n.read).length;
}

export function addNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: View;
}): Notification {
  const store = readStore();
  const notification: Notification = {
    id: uid("N"),
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    read: false,
    createdAt: new Date().toISOString(),
    link: input.link,
  };
  store.notifications.unshift(notification);
  if (store.notifications.length > 200) store.notifications = store.notifications.slice(0, 200);
  writeStore(store);
  return notification;
}

export function notifyAdmins(title: string, message: string, type: NotificationType, link?: View): void {
  notifyRegistrars(title, message, type, link);
}

export function notifyRegistrars(title: string, message: string, type: NotificationType, link?: View): void {
  getAllUsers().filter(u => isRegistrarRole(u.role)).forEach(registrar => {
    addNotification({ userId: registrar.id, title, message, type, link });
  });
}

export function markNotificationRead(id: string): void {
  const store = readStore();
  const n = store.notifications.find(x => x.id === id);
  if (n) n.read = true;
  writeStore(store);
}

export function markAllNotificationsRead(userId: string): void {
  const store = readStore();
  store.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
  writeStore(store);
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export function getCourses(): Course[] {
  return readStore().courses;
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find(c => c.id === id);
}

export function addCourse(course: Omit<Course, "id">): Course {
  const store = readStore();
  const newCourse: Course = {
    ...course,
    id: uid("C"),
    subjects: course.subjects?.length ? course.subjects : buildSubjects(course.code, course.title),
  };
  store.courses.push(newCourse);
  writeStore(store);
  notifyRegistrars("New Course Created", `${newCourse.code} — ${newCourse.title} was added.`, "course", "course-mgmt");
  return newCourse;
}

export function addLecturerCourse(
  lecturer: User,
  input: Omit<Course, "id" | "lecturer" | "lecturerId" | "subjects"> & { subjects?: Course["subjects"] }
): Course {
  const store = readStore();
  const owned = store.courses.filter(c => c.lecturerId === lecturer.id);
  if (owned.length >= MAX_LECTURER_COURSES) {
    throw new Error(`You can manage at most ${MAX_LECTURER_COURSES} courses. Remove one before adding another.`);
  }
  if (!lecturer.department || !lecturer.faculty) {
    throw new Error("Set your faculty and department in Settings before adding courses.");
  }
  if (store.courses.some(c => c.code.toUpperCase() === input.code.toUpperCase())) {
    throw new Error("A course with this code already exists.");
  }
  const newCourse: Course = {
    ...input,
    code: input.code.toUpperCase(),
    department: lecturer.department,
    faculty: lecturer.faculty,
    lecturer: lecturer.name,
    lecturerId: lecturer.id,
    id: uid("C"),
    subjects: input.subjects?.length ? input.subjects : buildSubjects(input.code, input.title),
  };
  store.courses.push(newCourse);
  writeStore(store);
  notifyRegistrars("Lecturer Course Added", `${lecturer.name} added ${newCourse.code} — ${newCourse.title}.`, "course", "course-mgmt");
  return newCourse;
}

export function updateLecturerCourse(
  lecturer: User,
  courseId: string,
  patch: Partial<Pick<Course, "code" | "title" | "units" | "level" | "semester">>
): Course | null {
  const store = readStore();
  const course = store.courses.find(c => c.id === courseId && c.lecturerId === lecturer.id);
  if (!course) return null;
  if (patch.code) course.code = patch.code.toUpperCase();
  if (patch.title) course.title = patch.title;
  if (patch.units !== undefined) course.units = patch.units;
  if (patch.level) course.level = patch.level;
  if (patch.semester !== undefined) course.semester = patch.semester;
  writeStore(store);
  return course;
}

export function removeLecturerCourse(lecturer: User, courseId: string): boolean {
  const store = readStore();
  const idx = store.courses.findIndex(c => c.id === courseId && c.lecturerId === lecturer.id);
  if (idx < 0) return false;
  const hasActiveRegs = store.registrations.some(
    r => r.courseId === courseId && r.status !== "rejected"
  );
  if (hasActiveRegs) {
    throw new Error("Cannot remove a course with active student enrollments.");
  }
  store.courses.splice(idx, 1);
  writeStore(store);
  return true;
}

export function countApprovedStudents(courseId: string): number {
  return getRegistrations().filter(r => r.courseId === courseId && r.status === "approved").length;
}

export function updateCourseLecturer(courseId: string, lecturerId: string, lecturerName: string): void {
  const store = readStore();
  const course = store.courses.find(c => c.id === courseId);
  if (!course) return;
  course.lecturerId = lecturerId || undefined;
  course.lecturer = lecturerId ? lecturerName : "Unassigned";
  writeStore(store);
  if (lecturerId) {
    addNotification({
      userId: lecturerId,
      title: "Course Assignment",
      message: `You have been assigned to teach ${course.code} — ${course.title}.`,
      type: "course",
      link: "courses",
    });
  }
}

/** Remove lecturer from courses and notifications when account is deleted */
export function purgeLecturerReferences(lecturerId: string, lecturerName: string): void {
  const store = readStore();
  let changed = false;
  store.courses.forEach(c => {
    if (c.lecturerId === lecturerId) {
      c.lecturerId = undefined;
      c.lecturer = "Unassigned";
      changed = true;
    } else if (!c.lecturerId && c.lecturer === lecturerName) {
      c.lecturer = "Unassigned";
      changed = true;
    }
  });
  const before = store.notifications.length;
  store.notifications = store.notifications.filter(n => n.userId !== lecturerId);
  if (store.notifications.length !== before) changed = true;
  if (changed) writeStore(store);
}

export function getLecturerCourses(lecturer: User): Course[] {
  return getCourses().filter(c => c.lecturerId === lecturer.id);
}

// ─── Registrations ───────────────────────────────────────────────────────────

export function getRegistrations(): Registration[] {
  return readStore().registrations;
}

export function getStudentRegistrations(studentId: string): Registration[] {
  return getRegistrations().filter(r => r.studentId === studentId);
}

export function addRegistration(student: User, course: Course, selectedSubjects: string[]): Registration {
  const store = readStore();
  const existing = store.registrations.find(
    r => r.studentId === student.id && r.courseId === course.id && r.status !== "rejected"
  );
  if (existing) throw new Error("You are already registered or pending for this course.");
  if (student.department && course.department !== student.department) {
    throw new Error(`You can only register for courses in your department (${student.department}).`);
  }

  const now = new Date().toISOString();
  const reg: Registration = {
    id: uid("R"),
    studentId: student.id,
    studentName: student.name,
    matricNo: student.matricNo || "—",
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    subjects: selectedSubjects.length ? selectedSubjects : course.subjects.map(s => s.title),
    faculty: course.faculty,
    department: course.department,
    status: "pending",
    lecturerStatus: "pending",
    submittedToAdmin: false,
    submittedToRegistrar: false,
    lecturerId: course.lecturerId,
    lecturerName: course.lecturer,
    courseFee: computeCourseFee(),
    paymentStatus: "unpaid",
    date: today(),
    registeredAt: now,
  };
  store.registrations.push(reg);
  writeStore(store);

  const subjectList = reg.subjects.join(", ");
  addNotification({
    userId: student.id,
    title: "Registration Submitted",
    message: `Your registration for ${course.code} (${subjectList}) is pending. Pay course fees at the bursary, then your lecturer will confirm payment.`,
    type: "registration",
    link: "registration",
  });
  notifyRegistrars(
    "New Registration Request",
    `${student.name} (${student.matricNo}) registered for ${course.code} — lecturer: ${course.lecturer}. Fee: unpaid.`,
    "registration",
    "approvals"
  );
  if (course.lecturerId) {
    addNotification({
      userId: course.lecturerId,
      title: "New Student Registration",
      message: `${student.name} registered for ${course.code}. Confirm fee payment after they pay at the bursary.`,
      type: "registration",
      link: "fee-payments",
    });
  }
  return reg;
}

export function approveCoursePayment(registrationId: string, lecturer: User): boolean {
  const store = readStore();
  const reg = store.registrations.find(r => r.id === registrationId);
  if (!reg) return false;
  const course = store.courses.find(c => c.id === reg.courseId);
  if (!course) return false;
  const ownsCourse =
    course.lecturerId === lecturer.id ||
    course.lecturer === lecturer.name;
  if (!ownsCourse) return false;
  if (reg.paymentStatus === "paid") return true;

  reg.paymentStatus = "paid";
  reg.paymentApprovedAt = new Date().toISOString();
  reg.paymentApprovedBy = lecturer.name;
  writeStore(store);

  addNotification({
    userId: reg.studentId,
    title: "Course Fee Confirmed",
    message: `Your payment for ${reg.courseCode} (${formatCourseFee(reg.courseFee)}) has been confirmed by ${lecturer.name}.`,
    type: "approval",
    link: "registration",
  });
  notifyRegistrars(
    "Course Fee Confirmed",
    `${lecturer.name} confirmed fee payment for ${reg.studentName} — ${reg.courseCode}.`,
    "approval",
    "approvals"
  );
  return true;
}

export function updateRegistrationStatus(id: string, status: "approved" | "rejected"): Registration | null {
  const store = readStore();
  const reg = store.registrations.find(r => r.id === id);
  if (!reg) return null;
  reg.status = status;
  writeStore(store);

  addNotification({
    userId: reg.studentId,
    title: status === "approved" ? "Registration Approved" : "Registration Rejected",
    message: status === "approved"
      ? `Your registration for ${reg.courseCode} has been approved.`
      : `Your registration for ${reg.courseCode} was rejected.`,
    type: "approval",
    link: "registration",
  });

  if (status === "approved") {
    const course = store.courses.find(c => c.id === reg.courseId);
    if (course?.lecturerId) {
      addNotification({
        userId: course.lecturerId,
        title: "New Student Enrolled",
        message: `${reg.studentName} (${reg.matricNo}) enrolled in ${reg.courseCode} — ${reg.subjects.join(", ")}.`,
        type: "registration",
        link: "students",
      });
    }
  }
  return reg;
}

export function dropRegistration(id: string, studentId: string): boolean {
  const store = readStore();
  const idx = store.registrations.findIndex(r => r.id === id && r.studentId === studentId && r.status === "pending");
  if (idx < 0) return false;
  store.registrations.splice(idx, 1);
  writeStore(store);
  return true;
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export function getScores(): Score[] {
  return readStore().scores;
}

export function getStudentScores(studentId: string): Score[] {
  return getScores().filter(
    s => s.studentId === studentId && s.published && (s.reviewStatus === "approved" || !s.reviewStatus)
  );
}

export function getCourseScores(courseCode: string): Score[] {
  return getScores().filter(s => s.courseCode === courseCode);
}

export function upsertScore(input: {
  studentId: string;
  studentName: string;
  matricNo: string;
  courseCode: string;
  courseId?: string;
  courseTitle?: string;
  ca: number;
  exam: number;
  submittedBy?: string;
  publish?: boolean;
  reviewStatus?: ReviewStatus;
  feedback?: string;
}): Score {
  const store = readStore();
  const total = input.ca + input.exam;
  const { grade, point } = calcGrade(total);
  const course = store.courses.find(c => c.code === input.courseCode);
  const idx = store.scores.findIndex(
    s => s.studentId === input.studentId && s.courseCode === input.courseCode
  );
  const existing = idx >= 0 ? store.scores[idx] : undefined;
  if (existing?.locked && (input.reviewStatus ?? existing.reviewStatus) === "draft") {
    throw new Error("Grade sheet is locked after submission to the registrar.");
  }
  const reviewStatus = input.reviewStatus ?? existing?.reviewStatus ?? "draft";
  const submittingToRegistrar = reviewStatus === "pending" && existing?.reviewStatus !== "pending";
  const shouldPublish = reviewStatus === "approved" && (input.publish ?? existing?.published ?? false);
  const score: Score = {
    ...input,
    courseTitle: input.courseTitle || course?.title,
    total,
    grade,
    gradePoint: point,
    published: shouldPublish,
    publishedAt: shouldPublish ? (existing?.publishedAt || new Date().toISOString()) : undefined,
    feedback: input.feedback ?? existing?.feedback,
    submittedAt: new Date().toISOString(),
    submittedBy: input.submittedBy,
    reviewStatus,
    reviewNote: existing?.reviewNote,
    reviewedAt: existing?.reviewedAt,
    reviewedBy: existing?.reviewedBy,
    locked: submittingToRegistrar ? true : (existing?.locked ?? false),
  };
  if (idx >= 0) store.scores[idx] = score;
  else store.scores.push(score);
  writeStore(store);
  return score;
}

export function submitCourseScores(
  course: Course,
  entries: Array<{ studentId: string; studentName: string; matricNo: string; ca: number; exam: number }>,
  lecturer: User,
  options?: { publish?: boolean }
): void {
  entries.forEach(e => {
    if (e.ca > 0 || e.exam > 0) {
      upsertScore({
        studentId: e.studentId,
        studentName: e.studentName,
        matricNo: e.matricNo,
        courseCode: course.code,
        courseId: course.id,
        courseTitle: course.title,
        ca: e.ca,
        exam: e.exam,
        submittedBy: lecturer.name,
        publish: false,
        reviewStatus: options?.publish ? "pending" : "draft",
      });
      if (options?.publish) {
        addNotification({
          userId: e.studentId,
          title: "Results Submitted for Review",
          message: `Your score for ${course.code} has been submitted and is awaiting registrar approval.`,
          type: "score",
          link: "results",
        });
      }
    }
  });
  notifyRegistrars(
    options?.publish ? "Final Grade Sheet Submitted" : "Scores Saved as Draft",
    `${lecturer.name} ${options?.publish ? "submitted final grades for" : "saved draft scores for"} ${course.code}.`,
    "score",
    "result-reviews"
  );
}

export function submitCourseScoresForReview(courseCode: string, lecturer: User): number {
  const store = readStore();
  let count = 0;
  store.scores.forEach(score => {
    if (score.courseCode === courseCode && score.reviewStatus === "draft" && !score.locked) {
      score.reviewStatus = "pending";
      score.locked = true;
      count++;
    }
  });
  if (count > 0) {
    writeStore(store);
    notifyAdmins(
      "Results Awaiting Review",
      `${lecturer.name} submitted ${count} result(s) for ${courseCode}.`,
      "score",
      "result-reviews"
    );
  }
  return count;
}

export function adminReviewScore(
  studentId: string,
  courseCode: string,
  decision: "approved" | "rejected",
  adminName: string,
  note?: string
): boolean {
  const store = readStore();
  const score = store.scores.find(s => s.studentId === studentId && s.courseCode === courseCode);
  if (!score || score.reviewStatus !== "pending") return false;

  const now = new Date().toISOString();
  score.reviewStatus = decision;
  score.reviewNote = note;
  score.reviewedAt = now;
  score.reviewedBy = adminName;

  if (decision === "approved") {
    score.published = true;
    score.publishedAt = now;
    addNotification({
      userId: score.studentId,
      title: "Results Published",
      message: `Your score for ${score.courseCode} has been approved. Grade: ${score.grade}.`,
      type: "score",
      link: "results",
    });
  } else {
    score.published = false;
    score.locked = false;
    score.reviewStatus = "draft";
    const course = store.courses.find(c => c.code === courseCode);
    if (course?.lecturerId) {
      addNotification({
        userId: course.lecturerId,
        title: "Results Returned",
        message: `Results for ${courseCode} were returned: ${note || "Please revise and resubmit."}`,
        type: "score",
        link: "scores",
      });
    }
    score.reviewStatus = "rejected";
  }
  writeStore(store);
  return true;
}

export function adminReviewAllPendingScores(
  courseCode: string,
  decision: "approved" | "rejected",
  adminName: string,
  note?: string
): number {
  const pending = getScores().filter(s => s.courseCode === courseCode && s.reviewStatus === "pending");
  pending.forEach(s => adminReviewScore(s.studentId, s.courseCode, decision, adminName, note));
  return pending.length;
}

export function publishCourseScores(courseCode: string, publishedBy: string): number {
  const store = readStore();
  const toPublish = store.scores.filter(s => s.courseCode === courseCode && !s.published);
  if (!toPublish.length) return 0;
  const publishedAt = new Date().toISOString();
  toPublish.forEach(score => {
    score.published = true;
    score.publishedAt = publishedAt;
    score.submittedBy = score.submittedBy || publishedBy;
    store.notifications.unshift({
      id: uid("N"),
      userId: score.studentId,
      title: "Results Published",
      message: `Your score for ${score.courseCode} has been published. Grade: ${score.grade}.`,
      type: "score",
      read: false,
      createdAt: publishedAt,
      link: "results",
    });
  });
  if (store.notifications.length > 200) store.notifications = store.notifications.slice(0, 200);
  writeStore(store);
  return toPublish.length;
}

// ─── Departments ─────────────────────────────────────────────────────────────

export function getDepartments(): Department[] {
  return readStore().departments;
}

export function addDepartment(name: string, faculty: string): Department {
  const store = readStore();
  const dept: Department = { id: uid("D"), name, faculty };
  store.departments.push(dept);
  writeStore(store);
  notifyAdmins("Department Added", `${name} was added under ${faculty}.`, "system", "departments");
  return dept;
}

// ─── Semester Results ────────────────────────────────────────────────────────

export function getSemesterResults(studentId: string): SemesterResult[] {
  return readStore().semesterResults[studentId] || [];
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function computeGradeDistribution(): { name: string; value: number; color: string }[] {
  const scores = getScores();
  if (!scores.length) {
    return [
      { name: "A (70-100)", value: 0, color: "#5c1a2e" },
      { name: "B (60-69)", value: 0, color: "#c9a227" },
      { name: "C (50-59)", value: 0, color: "#8b4513" },
      { name: "D (45-49)", value: 0, color: "#d97706" },
      { name: "F (0-44)", value: 0, color: "#9b1c31" },
    ];
  }
  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  scores.forEach(s => { if (counts[s.grade as keyof typeof counts] !== undefined) counts[s.grade as keyof typeof counts]++; });
  const total = scores.length;
  return [
    { name: "A (70-100)", value: Math.round((counts.A / total) * 100), color: "#5c1a2e" },
    { name: "B (60-69)", value: Math.round((counts.B / total) * 100), color: "#c9a227" },
    { name: "C (50-59)", value: Math.round((counts.C / total) * 100), color: "#8b4513" },
    { name: "D (45-49)", value: Math.round((counts.D / total) * 100), color: "#d97706" },
    { name: "F (0-44)", value: Math.round((counts.F / total) * 100), color: "#9b1c31" },
  ];
}

export function computePassFailByCourse(): { course: string; pass: number; fail: number }[] {
  const courses = getCourses();
  return courses.slice(0, 6).map(c => {
    const courseScores = getCourseScores(c.code);
    if (!courseScores.length) return { course: c.code, pass: 0, fail: 0 };
    const pass = courseScores.filter(s => s.total >= 45).length;
    const fail = courseScores.length - pass;
    const total = courseScores.length;
    return {
      course: c.code,
      pass: Math.round((pass / total) * 100),
      fail: Math.round((fail / total) * 100),
    };
  });
}

export function computeEnrollmentByFaculty(): { faculty: string; students: number }[] {
  const students = getAllUsers().filter(u => u.role === "student");
  const map = new Map<string, number>();
  students.forEach(s => {
    const key = s.faculty || getFacultyForDepartment(s.department || "") || "General";
    map.set(key, (map.get(key) || 0) + 1);
  });
  if (map.size === 0) {
    return FACULTIES.map(f => ({ faculty: f.split(" ")[0], students: 0 }));
  }
  return Array.from(map.entries()).map(([faculty, count]) => ({
    faculty: faculty.length > 18 ? faculty.split("/")[0] : faculty,
    students: count,
  }));
}

/** Group registrations by student for admin overview */
export function getStudentRegistrationSummary(): {
  studentId: string;
  studentName: string;
  matricNo: string;
  faculty: string;
  department: string;
  courses: { code: string; title: string; subjects: string[]; status: string; registeredAt: string; lecturerName: string; paymentStatus: string; courseFee: number }[];
}[] {
  const regs = getRegistrations();
  const map = new Map<string, ReturnType<typeof getStudentRegistrationSummary>[0]>();
  regs.forEach(r => {
    if (!map.has(r.studentId)) {
      map.set(r.studentId, {
        studentId: r.studentId,
        studentName: r.studentName,
        matricNo: r.matricNo,
        faculty: r.faculty,
        department: r.department,
        courses: [],
      });
    }
    map.get(r.studentId)!.courses.push({
      code: r.courseCode,
      title: r.courseTitle,
      subjects: r.subjects,
      status: r.status,
      registeredAt: r.registeredAt,
      lecturerName: r.lecturerName,
      paymentStatus: r.paymentStatus,
      courseFee: r.courseFee,
    });
  });
  return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
}

/** Latest submitted results for admin/lecturer dashboards */
export function getRecentScores(limit = 10): Score[] {
  return [...getScores()]
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
    .slice(0, limit);
}

export function computeAdminStats() {
  const users = getAllUsers();
  const regs = getRegistrations();
  const scores = getScores();
  const passCount = scores.filter(s => s.total >= 45).length;
  const passRate = scores.length ? Math.round((passCount / scores.length) * 1000) / 10 : 0;
  const allGpas = users
    .filter(u => u.role === "student")
    .map(u => {
      const sem = getSemesterResults(u.id);
      if (!sem.length) return calcGPAFromScores(u.id);
      return sem.reduce((a, s) => a + s.gpa * s.units, 0) / sem.reduce((a, s) => a + s.units, 0);
    })
    .filter(g => g > 0);
  const avgGpa = allGpas.length
    ? Math.round((allGpas.reduce((a, b) => a + b, 0) / allGpas.length) * 100) / 100
    : 0;

  return {
    totalStudents: users.filter(u => u.role === "student").length,
    totalLecturers: users.filter(u => u.role === "lecturer").length,
    activeCourses: getCourses().length,
    pendingApprovals: regs.filter(r => r.status === "pending" && r.submittedToAdmin).length,
    departments: getDepartments().length,
    avgGpa,
    passRate,
    registeredThisSemester: regs.filter(r => r.status === "approved").length,
  };
}

function calcGPAFromScores(studentId: string): number {
  const scores = getStudentScores(studentId);
  const courses = getCourses();
  if (!scores.length) return 0;
  let pts = 0, units = 0;
  scores.forEach(s => {
    const u = courses.find(c => c.code === s.courseCode)?.units || 3;
    pts += s.gradePoint * u;
    units += u;
  });
  return units > 0 ? Math.round((pts / units) * 100) / 100 : 0;
}

export function computeGPATrend(): { month: string; avgGPA: number }[] {
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const students = getAllUsers().filter(u => u.role === "student");
  const base = students.length
    ? students.reduce((a, u) => a + calcGPAFromScores(u.id), 0) / students.length
    : 3.0;
  return months.map((month, i) => ({
    month,
    avgGPA: Math.round((base - 0.3 + i * 0.08) * 100) / 100,
  }));
}

export function welcomeUser(user: User): void {
  addNotification({
    userId: user.id,
    title: "Account activated",
    message: `Your ${user.role} account has been created and is ready to use.`,
    type: "system",
    link: "dashboard",
  });
}

// ─── Lecturer course registration review ─────────────────────────────────────

export function getCourseApprovalSubmissions(): CourseApprovalSubmission[] {
  return readStore().courseApprovalSubmissions;
}

export function lecturerReviewRegistration(
  registrationId: string,
  decision: "approved" | "rejected",
  note?: string
): Registration | null {
  const store = readStore();
  const reg = store.registrations.find(r => r.id === registrationId);
  if (!reg) return null;

  reg.lecturerStatus = decision;
  reg.lecturerNote = note;
  if (decision === "rejected") {
    reg.status = "rejected";
    addNotification({
      userId: reg.studentId,
      title: "Registration Rejected",
      message: `Your registration for ${reg.courseCode} was rejected by the lecturer.${note ? ` Note: ${note}` : ""}`,
      type: "approval",
      link: "registration",
    });
  }
  writeStore(store);
  return reg;
}

export function submitCourseApprovalsToAdmin(courseId: string, lecturer: User): CourseApprovalSubmission | null {
  const store = readStore();
  const course = store.courses.find(c => c.id === courseId);
  if (!course) return null;

  const approvedRegs = store.registrations.filter(
    r => r.courseId === courseId && r.lecturerStatus === "approved" && !r.submittedToAdmin && r.status === "pending"
  );
  if (!approvedRegs.length) return null;

  approvedRegs.forEach(r => {
    r.submittedToAdmin = true;
    r.submittedToRegistrar = true;
  });

  const submission: CourseApprovalSubmission = {
    id: uid("CAS"),
    courseId,
    courseCode: course.code,
    courseTitle: course.title,
    lecturerId: lecturer.id,
    lecturerName: lecturer.name,
    registrationIds: approvedRegs.map(r => r.id),
    studentCount: approvedRegs.length,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  store.courseApprovalSubmissions.unshift(submission);
  writeStore(store);

  notifyAdmins(
    "Course Registration Batch Submitted",
    `${lecturer.name} submitted ${approvedRegs.length} approved registration(s) for ${course.code}.`,
    "registration",
    "approvals"
  );
  return submission;
}

export function adminReviewCourseSubmission(
  submissionId: string,
  decision: "approved" | "rejected",
  adminName: string,
  note?: string
): boolean {
  const store = readStore();
  const submission = store.courseApprovalSubmissions.find(s => s.id === submissionId);
  if (!submission || submission.status !== "pending") return false;

  const now = new Date().toISOString();
  submission.status = decision;
  submission.adminNote = note;
  submission.reviewedAt = now;

  submission.registrationIds.forEach(regId => {
    const reg = store.registrations.find(r => r.id === regId);
    if (!reg) return;
    reg.status = decision === "approved" ? "approved" : "rejected";
    addNotification({
      userId: reg.studentId,
      title: decision === "approved" ? "Registration Approved" : "Registration Rejected",
      message: decision === "approved"
        ? `Your registration for ${reg.courseCode} has been finalized by the registrar.`
        : `Your registration for ${reg.courseCode} was rejected by the registrar.${note ? ` Note: ${note}` : ""}`,
      type: "approval",
      link: "registration",
    });
  });

  if (decision === "rejected" && submission.lecturerId) {
    addNotification({
      userId: submission.lecturerId,
      title: "Course Approvals Returned",
      message: `Your submission for ${submission.courseCode} was returned.${note ? ` ${note}` : ""}`,
      type: "approval",
      link: "course-approvals",
    });
  }

  writeStore(store);
  return true;
}

export function getPendingResultReviews(): Score[] {
  return getScores().filter(s => s.reviewStatus === "pending");
}

// ─── Dean / Faculty-scoped queries ──────────────────────────────────────────

export function getFacultyCourses(faculty: string): Course[] {
  return getCourses().filter(c => c.faculty === faculty);
}

export function getFacultyStudents(faculty: string): User[] {
  return getAllUsers().filter(u =>
    u.role === "student" &&
    (u.faculty === faculty || getFacultyForDepartment(u.department || "") === faculty)
  );
}

export function getFacultyLecturers(faculty: string): User[] {
  return getAllUsers().filter(u =>
    u.role === "lecturer" &&
    (u.faculty === faculty || getFacultyForDepartment(u.department || "") === faculty)
  );
}

export function getFacultyRegistrations(faculty: string): Registration[] {
  const facultyCourseIds = new Set(getFacultyCourses(faculty).map(c => c.id));
  return getRegistrations().filter(r => facultyCourseIds.has(r.courseId));
}

export function getFacultyScores(faculty: string): Score[] {
  const facultyCourseCodes = new Set(getFacultyCourses(faculty).map(c => c.code));
  return getScores().filter(s => facultyCourseCodes.has(s.courseCode));
}

/**
 * Dean assigns a student to a course.
 * Creates a registration with status "pending" (lecturer approves after payment).
 */
export function deanAssignStudentToCourse(
  studentId: string,
  courseId: string,
  selectedSubjects: string[]
): Registration | null {
  const student = getAllUsers().find(u => u.id === studentId);
  const course = getCourses().find(c => c.id === courseId);
  if (!student || !course) return null;

  const store = readStore();
  const existing = store.registrations.find(
    r => r.studentId === studentId && r.courseId === courseId && r.status !== "rejected"
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const reg: Registration = {
    id: uid("R"),
    studentId: student.id,
    studentName: student.name,
    matricNo: student.matricNo || "—",
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    subjects: selectedSubjects.length ? selectedSubjects : course.subjects.map(s => s.title),
    faculty: course.faculty,
    department: course.department,
    status: "pending",
    lecturerStatus: "pending",
    submittedToAdmin: false,
    submittedToRegistrar: false,
    lecturerId: course.lecturerId,
    lecturerName: course.lecturer,
    courseFee: computeCourseFee(),
    paymentStatus: "unpaid",
    date: today(),
    registeredAt: now,
  };
  store.registrations.push(reg);
  writeStore(store);

  addNotification({
    userId: studentId,
    title: "Course Assigned by Dean",
    message: `You have been assigned to ${course.code} — ${course.title} by the faculty dean. Pay the course fee (1,000 XAF) at the bursary, then your lecturer will confirm.`,
    type: "registration",
    link: "registration",
  });

  if (course.lecturerId) {
    addNotification({
      userId: course.lecturerId,
      title: "Student Assigned by Dean",
      message: `${student.name} (${student.matricNo}) was assigned to ${course.code} by the dean. Confirm fee payment after they pay at the bursary.`,
      type: "registration",
      link: "fee-payments",
    });
  }

  notifyRegistrars(
    "Dean Assigned Registration",
    `${student.name} (${student.matricNo}) was assigned to ${course.code} by the faculty dean.`,
    "registration",
    "approvals"
  );

  return reg;
}
