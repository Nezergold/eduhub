import { useState } from "react";

export interface LecturerFilterValues {
  courseCode: string;
  semester: string;
  studentQuery: string;
}

interface LecturerTableFiltersProps {
  onApply: (filters: LecturerFilterValues) => void;
  loading?: boolean;
}

export function LecturerTableFilters({ onApply, loading = false }: LecturerTableFiltersProps) {
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [studentQuery, setStudentQuery] = useState("");

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          placeholder="Course Code (e.g. CSC401)"
          className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <input
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Semester (e.g. First Semester)"
          className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <input
          value={studentQuery}
          onChange={(e) => setStudentQuery(e.target.value)}
          placeholder="Student Name / ID"
          className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onApply({
              courseCode: courseCode.trim(),
              semester: semester.trim(),
              studentQuery: studentQuery.trim(),
            })
          }
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
        >
          Filter
        </button>
      </div>
    </div>
  );
}

