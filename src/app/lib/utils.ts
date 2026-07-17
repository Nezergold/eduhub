import type { Course, Score } from "./types";

export function calcGrade(total: number): { grade: string; point: number } {
  if (total >= 70) return { grade: "A", point: 5.0 };
  if (total >= 60) return { grade: "B", point: 4.0 };
  if (total >= 50) return { grade: "C", point: 3.0 };
  if (total >= 45) return { grade: "D", point: 2.0 };
  return { grade: "F", point: 0.0 };
}

export function calcGPA(scores: Score[], userId: string, courses: Course[]): number {
  const userScores = scores.filter(s => s.studentId === userId);
  if (!userScores.length) return 0;
  let totalPoints = 0;
  let totalUnits = 0;
  userScores.forEach(s => {
    const course = courses.find(c => c.code === s.courseCode);
    const units = course?.units || 3;
    totalPoints += s.gradePoint * units;
    totalUnits += units;
  });
  return totalUnits > 0 ? Math.round((totalPoints / totalUnits) * 100) / 100 : 0;
}

export function calcCGPA(semResults: { gpa: number; units: number }[]): number {
  if (!semResults.length) return 0;
  const total = semResults.reduce((acc, s) => acc + s.gpa * s.units, 0);
  const units = semResults.reduce((acc, s) => acc + s.units, 0);
  return units > 0 ? Math.round((total / units) * 100) / 100 : 0;
}

export function gradeBg(grade: string): string {
  if (grade === "A") return "bg-green-50 text-green-700 border border-green-200";
  if (grade === "B") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (grade === "C") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (grade === "D") return "bg-orange-50 text-orange-700 border border-orange-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

export function statusBadge(status: string): string {
  if (status === "approved") return "bg-green-50 text-green-700 border border-green-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

export function paymentBadge(status: string): string {
  if (status === "paid") return "bg-green-50 text-green-700 border border-green-200";
  return "bg-amber-50 text-amber-800 border border-amber-200";
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export const CHART_WINE = "#5c1a2e";
export const CHART_GOLD = "#c9a227";
