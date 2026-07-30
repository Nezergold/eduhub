import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Registration, User } from "./types";
import { INSTITUTION_NAME } from "./types";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\-]+/g, "_").slice(0, 80);
}

export function exportOfficialCourseForm(
  student: User,
  registrations: Registration[],
  academicYear = new Date().getFullYear()
): void {
  const approved = registrations.filter(r => r.status === "approved");
  const doc = new jsPDF({ orientation: "portrait" });
  const margin = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(INSTITUTION_NAME, margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.text("OFFICIAL COURSE REGISTRATION FORM", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Academic Year: ${academicYear}/${academicYear + 1}  ·  Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Student Information", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const info = [
    ["Full Name", student.name],
    ["Matric No.", student.matricNo || "—"],
    ["Department", student.department || "—"],
    ["Faculty", student.faculty || "—"],
    ["Level", student.level ? `${student.level} Level` : "—"],
    ["Semester", student.semester ? `Semester ${student.semester}` : "—"],
    ["Email", student.email],
  ];
  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), margin + 42, y);
    y += 5;
  });
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Registered Courses (Approved)", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y + 2,
    head: [["Code", "Course Title", "Lecturer", "Units", "Status"]],
    body: approved.length
      ? approved.map(r => [r.courseCode, r.courseTitle, r.lecturerName, "—", r.status])
      : [["—", "No approved courses yet", "—", "—", "—"]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [92, 26, 46] },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  let sigY = finalY + 14;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Certification", margin, sigY);
  sigY += 6;
  doc.setFont("helvetica", "normal");
  doc.text(
    "I certify that the above course registration has been approved by the respective lecturers and the registrar.",
    margin,
    sigY,
    { maxWidth: 180 }
  );
  sigY += 16;

  const signatures = [
    ["Student Signature", "___________________________", "Date: _______________"],
    ["Head of Department", "___________________________", "Date: _______________"],
    ["Registrar", "___________________________", "Date: _______________"],
  ];
  signatures.forEach(([role, line, date]) => {
    doc.setFont("helvetica", "bold");
    doc.text(role, margin, sigY);
    doc.setFont("helvetica", "normal");
    doc.text(line, margin + 45, sigY);
    doc.text(date, margin + 120, sigY);
    sigY += 10;
  });

  doc.save(`${sanitizeFilename(`course_form_${student.matricNo || student.username}`)}.pdf`);
}
