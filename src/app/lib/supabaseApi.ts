import { supabase } from "./supabaseClient";

export type AppRole = "admin" | "lecturer" | "student";

export interface LecturerCourse {
  id: string;
  course_code: string;
  title: string;
  semester: string | null;
}

export interface LecturerStudentGradeRow {
  student_id: string;
  student_name: string;
  student_username: string;
  course_id: string;
  course_code: string;
  semester: string | null;
  grade: string | null;
}

export interface LecturerFilters {
  courseCode?: string;
  semester?: string;
  studentQuery?: string;
}

export function getRoleDashboardPath(role: AppRole): string {
  if (role === "student") return "/portal/student";
  if (role === "lecturer") return "/portal/faculty";
  return "/portal/admin";
}

export async function redirectByAuthState(navigate: (path: string) => void): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    navigate("/");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile?.role) {
    navigate("/");
    return;
  }

  navigate(getRoleDashboardPath(profile.role as AppRole));
}

export async function requireAuthenticatedUser(redirect: (path: string) => void): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/");
    return null;
  }
  return data.user.id;
}

/**
 * Admin should call an edge function with service role credentials to:
 * 1) invite user by email using auth.admin.inviteUserByEmail
 * 2) create the corresponding profile record in public.profiles
 */
export async function adminInviteAndCreateProfile(payload: {
  email: string;
  username: string;
  full_name: string;
  role: AppRole;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-invite-user", {
    body: payload,
  });
  if (error) throw error;
}

export async function fetchLecturerCourses(): Promise<LecturerCourse[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, course_code, title, semester")
    .order("course_code", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LecturerCourse[];
}

export async function uploadCourseMaterial(params: {
  courseId: string;
  file: File;
  lecturerId: string;
}): Promise<void> {
  const { courseId, file, lecturerId } = params;
  const objectPath = `${courseId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  const { error: uploadError } = await supabase.storage
    .from("course-materials")
    .upload(objectPath, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(objectPath);
  const fileUrl = pub.publicUrl;

  const { error: insertError } = await supabase.from("course_materials").insert({
    course_id: courseId,
    file_url: fileUrl,
    file_name: file.name,
    uploaded_by: lecturerId,
  });
  if (insertError) throw insertError;
}

export async function fetchLecturerStudentsAndGrades(
  filters: LecturerFilters = {}
): Promise<LecturerStudentGradeRow[]> {
  const { courseCode, semester, studentQuery } = filters;

  let query = supabase
    .from("enrollments")
    .select(
      `
      student_id,
      course_id,
      courses!inner(id, course_code, semester),
      profiles!enrollments_student_id_fkey(id, full_name, username),
      results(grade)
    `
    );

  if (courseCode) query = query.eq("courses.course_code", courseCode);
  if (semester) query = query.eq("courses.semester", semester);
  if (studentQuery) query = query.or(`profiles.full_name.ilike.%${studentQuery}%,profiles.username.ilike.%${studentQuery}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    student_id: row.student_id,
    student_name: row.profiles?.full_name ?? "Unknown Student",
    student_username: row.profiles?.username ?? "",
    course_id: row.course_id,
    course_code: row.courses?.course_code ?? "",
    semester: row.courses?.semester ?? null,
    grade: row.results?.[0]?.grade ?? null,
  }));
}

export async function upsertStudentGrade(params: {
  studentId: string;
  courseId: string;
  grade: string;
  lecturerId: string;
}): Promise<void> {
  const { studentId, courseId, grade, lecturerId } = params;
  const { error } = await supabase.from("results").upsert(
    {
      student_id: studentId,
      course_id: courseId,
      grade,
      updated_by: lecturerId,
    },
    { onConflict: "student_id,course_id" }
  );
  if (error) throw error;
}

export function applyLocalLecturerFilters(
  rows: LecturerStudentGradeRow[],
  filters: LecturerFilters
): LecturerStudentGradeRow[] {
  const courseCode = filters.courseCode?.trim().toLowerCase();
  const semester = filters.semester?.trim().toLowerCase();
  const studentQuery = filters.studentQuery?.trim().toLowerCase();

  return rows.filter((row) => {
    const courseOk = !courseCode || row.course_code.toLowerCase().includes(courseCode);
    const semesterOk = !semester || (row.semester ?? "").toLowerCase().includes(semester);
    const studentOk =
      !studentQuery ||
      row.student_name.toLowerCase().includes(studentQuery) ||
      row.student_username.toLowerCase().includes(studentQuery) ||
      row.student_id.toLowerCase().includes(studentQuery);
    return courseOk && semesterOk && studentOk;
  });
}

