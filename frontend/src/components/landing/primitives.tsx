// Small presentational pieces shared by the landing page sections.
// Everything here is static demo content — no live data.
import { useEffect, useRef, useState, type ReactNode } from "react";

// ── Reveal on scroll (16px rise, 850ms ease-out) ──────────────────────────────
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Skip the reveal entirely when the user prefers reduced motion or the
  // browser has no IntersectionObserver — the content is simply visible.
  const [shown, setShown] = useState(
    () =>
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-[850ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

// ── Section head: eyebrow + headline + support ────────────────────────────────
export function SectionHead({
  index,
  label,
  title,
  support,
  wide = false,
}: {
  index: string;
  label: string;
  title: ReactNode;
  support: ReactNode;
  wide?: boolean;
}) {
  return (
    <Reveal>
      <div className="mono text-[10px] tracking-[.1em] text-[var(--ink-2)] md:text-[10.5px]">
        {index}&nbsp;&nbsp;/&nbsp;&nbsp;{label}
      </div>
      <h2 className="mt-[18px] text-[34px] font-medium leading-[1.12] tracking-[-.03em] md:mt-[22px] md:text-[48px] md:leading-[1.1] md:tracking-[-.032em]">
        {title}
      </h2>
      <p
        className={`mt-4 text-[16.5px] leading-[1.55] text-muted-foreground md:mt-5 md:text-lg ${
          wide ? "md:max-w-[620px]" : "md:max-w-[580px]"
        }`}
      >
        {support}
      </p>
    </Reveal>
  );
}

// ── Avatars ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  SM: "#2F4A40",
  DO: "#6A5A46",
  MC: "#3E4A5C",
  JW: "#5C4550",
  AB: "#4A5240",
  TB: "#55504A",
};

export function Avatar({ initials, size = 22 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * 0.4)),
        background: AVATAR_COLORS[initials] ?? "#55504A",
      }}
    >
      {initials}
    </span>
  );
}

// ── Tiny icons (decorative) ───────────────────────────────────────────────────
export function DocIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="16" viewBox="0 0 13 16" aria-hidden="true" className={`mt-px shrink-0 ${className}`}>
      <rect x=".7" y=".7" width="11.6" height="14.6" rx="1.8" stroke="#9A8C6E" strokeWidth="1.3" fill="#F9F6EE" />
      <path d="M3.6 5.2h5.8M3.6 8h5.8M3.6 10.8h3.4" stroke="#B9AB8B" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ChipDocIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <rect x=".6" y=".6" width="8.8" height="10.8" rx="1.4" stroke="#9A8C6E" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function UpIcon() {
  return (
    <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
      <path d="M4.5.8 8.2 7H.8z" fill="var(--ai-meta)" />
    </svg>
  );
}

export function ForkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.8v4.4c0 1.3 1 2.3 2.3 2.3H9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="3" cy="1.8" r="1.3" fill="currentColor" />
      <circle cx="9.4" cy="8.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2" y="5.2" width="8" height="5.4" rx="1.3" stroke="var(--ink-2)" strokeWidth="1.2" fill="none" />
      <path d="M4 5.2V4a2 2 0 0 1 4 0v1.2" stroke="var(--ink-2)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// ── Chips & faux controls inside the screenshots ──────────────────────────────
export function MaterialChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-[#E7DFCD] bg-[var(--chip)] px-2.5 text-[11.5px] text-[#5E5342] transition-colors hover:bg-[#EFEADD]">
      <ChipDocIcon />
      {children}
    </span>
  );
}

export function GhostPill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-[7px] border border-[#E4E0D6] bg-white text-[#3D3A34] transition-colors hover:bg-[#F1EFE8] ${className}`}
    >
      {children}
    </span>
  );
}

export function PrimaryPill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-primary font-medium text-primary-foreground transition-colors hover:bg-[#143A2F] ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mono text-[9.5px] tracking-[.09em] text-[var(--ink-2)] ${className}`}>{children}</div>;
}

// Frame that wraps each product mockup. The inside is decorative; the
// aria-label carries what a screen reader needs.
export function Mockup({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="img" aria-label={label} className={className}>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  );
}
