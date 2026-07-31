import { INSTITUTION_MOTTO, INSTITUTION_NAME, PORTAL_NAME } from "../lib/types";

interface LogoProps {
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: "h-8 w-8", text: "text-xs", sub: "text-[8px]", portal: "text-[9px]" },
  md: { img: "h-10 w-10", text: "text-sm", sub: "text-[9px]", portal: "text-[10px]" },
  lg: { img: "h-14 w-14", text: "text-base", sub: "text-[10px]", portal: "text-xs" },
  xl: { img: "h-20 w-20", text: "text-lg", sub: "text-xs", portal: "text-sm" },
};

export function Logo({ onClick, size = "md", light = false, showText = true, className = "" }: LogoProps) {
  const s = sizes[size];
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex items-center gap-2.5 group ${onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""} ${className}`}
      aria-label={onClick ? "Return to homepage" : PORTAL_NAME}
    >
      <img
        src="/wauu-logo.png"
        alt={`${INSTITUTION_NAME} logo`}
        className={`${s.img} object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105 rounded-full`}
      />
      {showText && (
        <div className="min-w-0 text-left">
          <p className={`font-bold font-[Outfit] leading-tight tracking-wide ${s.text} ${light ? "text-white" : "text-primary"}`}>
            WA<span className={light ? "text-gold-light" : "text-accent"}>UU</span>
            <span className={`${s.portal} font-semibold ml-1 ${light ? "text-white/70" : "text-muted-foreground"}`}>HUB</span>
          </p>
          <p className={`${s.sub} truncate ${light ? "text-white/50" : "text-muted-foreground"}`}>
            {INSTITUTION_NAME}
          </p>
        </div>
      )}
    </Wrapper>
  );
}

/** Header shown on print / export views */
export function PrintBranding() {
  return (
    <div className="hidden print:flex print:items-center print:gap-4 print:mb-6 print:pb-4 print:border-b print:border-gray-300">
      <img src="/wauu-logo.png" alt="WAUU" className="h-16 w-16 object-contain" />
      <div>
        <p className="text-lg font-bold text-gray-900 font-[Outfit]">{INSTITUTION_NAME}</p>
        <p className="text-sm text-gray-600">{PORTAL_NAME} — Academic Portal</p>
        <p className="text-xs text-gray-500 italic mt-0.5">{INSTITUTION_MOTTO}</p>
      </div>
    </div>
  );
}
