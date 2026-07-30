import type { Course } from "../lib/types";

interface CourseSwitcherProps {
  courses: Course[];
  selectedId: string;
  onSelect: (courseId: string) => void;
  className?: string;
}

export function CourseSwitcher({ courses, selectedId, onSelect, className = "" }: CourseSwitcherProps) {
  if (!courses.length) return null;

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {courses.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            selectedId === c.id
              ? "bg-accent text-white border-accent"
              : "border-border text-muted-foreground hover:border-accent/50"
          }`}
        >
          {c.code}
        </button>
      ))}
    </div>
  );
}
