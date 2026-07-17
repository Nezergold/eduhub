import { useCallback, useMemo, useState } from "react";
import {
  applyLocalLecturerFilters,
  fetchLecturerCourses,
  fetchLecturerStudentsAndGrades,
  type LecturerCourse,
  type LecturerFilters,
  type LecturerStudentGradeRow,
  upsertStudentGrade,
  uploadCourseMaterial,
} from "../lib/supabaseApi";

export function useLecturerPortal(lecturerId: string) {
  const [courses, setCourses] = useState<LecturerCourse[]>([]);
  const [rows, setRows] = useState<LecturerStudentGradeRow[]>([]);
  const [filters, setFilters] = useState<LecturerFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRows = useMemo(() => applyLocalLecturerFilters(rows, filters), [rows, filters]);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLecturerCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudentGrades = useCallback(async (nextFilters: LecturerFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLecturerStudentsAndGrades(nextFilters);
      setRows(data);
      setFilters(nextFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch grade table.");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGrade = useCallback(
    async (params: { studentId: string; courseId: string; grade: string }) => {
      setLoading(true);
      setError(null);
      try {
        await upsertStudentGrade({
          studentId: params.studentId,
          courseId: params.courseId,
          grade: params.grade,
          lecturerId,
        });
        await loadStudentGrades(filters);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update grade.");
      } finally {
        setLoading(false);
      }
    },
    [filters, lecturerId, loadStudentGrades]
  );

  const uploadMaterial = useCallback(
    async (params: { courseId: string; file: File }) => {
      setLoading(true);
      setError(null);
      try {
        await uploadCourseMaterial({
          courseId: params.courseId,
          file: params.file,
          lecturerId,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload material.");
      } finally {
        setLoading(false);
      }
    },
    [lecturerId]
  );

  return {
    courses,
    rows,
    filteredRows,
    filters,
    loading,
    error,
    setFilters,
    loadCourses,
    loadStudentGrades,
    saveGrade,
    uploadMaterial,
  };
}

