import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import HorizonLogo from "../components/HorizonLogo";

// ── Classroom visualization ────────────────────────────────────────────────────
const W = 580;
const H = 320;

const STUDENTS = [
  { id: "A", initials: "KL", x: 62,  y: 66,  cluster: 2 },
  { id: "B", initials: "MR", x: 188, y: 38,  cluster: 1 },
  { id: "C", initials: "JT", x: 326, y: 52,  cluster: 1 },
  { id: "D", initials: "AP", x: 468, y: 44,  cluster: 3 },
  { id: "E", initials: "SW", x: 96,  y: 234, cluster: 2 },
  { id: "F", initials: "DN", x: 234, y: 252, cluster: 1 },
  { id: "G", initials: "RB", x: 374, y: 238, cluster: 3 },
  { id: "H", initials: "YC", x: 502, y: 222, cluster: 3 },
];

const PROF = { x: 290, y: 142 };

function bezierPath(x1: number, y1: number, x2: number, y2: number, curvature = 0.18): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

const CLUSTER_COLORS: Record<number, string> = { 1: "#7c83f5", 2: "#f5a623", 3: "#4ade80" };
const CLUSTER_META: Record<number, { label: string; count: string }> = {
  1: { label: "Lecture 6 — derivatives", count: "3 students" },
  2: { label: "Problem set 4",           count: "2 students" },
  3: { label: "Exam strategy",           count: "3 students" },
};

const CONNECTIONS = [
  { from: "B", to: "C", cluster: 1 }, { from: "C", to: "F", cluster: 1 },
  { from: "B", to: "F", cluster: 1 }, { from: "A", to: "E", cluster: 2 },
  { from: "D", to: "G", cluster: 3 }, { from: "G", to: "H", cluster: 3 },
  { from: "D", to: "H", cluster: 3 },
];

const PRIVATE_TARGETS = [
  { id: "A", tx: -30, ty: 10 }, { id: "B", tx: 120, ty: -30 },
  { id: "C", tx: 290, ty: -30 }, { id: "D", tx: 530, ty: -20 },
  { id: "E", tx: -30, ty: 270 }, { id: "F", tx: 160, ty: 340 },
  { id: "G", tx: 400, ty: 340 }, { id: "H", tx: 580, ty: 290 },
];

function getNode(id: string) { return STUDENTS.find((s) => s.id === id)!; }

function ClassroomVisual({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#0a0820" floodOpacity="0.5" />
          </filter>
          {Object.entries(CLUSTER_COLORS).map(([k, color]) => (
            <radialGradient key={k} id={`grad${k}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0.04" />
            </radialGradient>
          ))}
          {Object.entries(CLUSTER_COLORS).map(([k, color]) => (
            <marker key={k} id={`arrow${k}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={color} opacity="0.6" />
            </marker>
          ))}
        </defs>

        {PRIVATE_TARGETS.map(({ id, tx, ty }) => {
          const s = getNode(id);
          return (
            <path key={`ghost-${id}`} d={bezierPath(s.x, s.y, tx, ty, 0.12)} fill="none"
              stroke="rgba(182,177,217,0.18)" strokeWidth="1" strokeDasharray="3 5"
              style={{ opacity: active ? 0 : (mounted ? 1 : 0), transition: "opacity 0.5s ease" }} />
          );
        })}
        {PRIVATE_TARGETS.map(({ id, tx, ty }) => (
          <g key={`cloud-${id}`} style={{ opacity: active ? 0 : (mounted ? 0.35 : 0), transition: "opacity 0.4s ease" }}>
            <circle cx={tx < 0 ? tx + 18 : tx > W ? tx - 18 : tx} cy={ty < 0 ? ty + 18 : ty > H ? ty - 18 : ty}
              r="10" fill="rgba(42,38,80,0.8)" stroke="rgba(182,177,217,0.2)" strokeWidth="1" />
            <text x={tx < 0 ? tx + 18 : tx > W ? tx - 18 : tx}
              y={(ty < 0 ? ty + 18 : ty > H ? ty - 18 : ty) + 4}
              textAnchor="middle" fontSize="9" fontFamily="Inter, sans-serif" fill="rgba(182,177,217,0.5)">AI</text>
          </g>
        ))}

        {[{ cluster: 1, cx: 249, cy: 114 }, { cluster: 2, cx: 79, cy: 150 }, { cluster: 3, cx: 448, cy: 168 }]
          .map(({ cluster, cx, cy }) => (
            <ellipse key={`halo-${cluster}`} cx={cx} cy={cy} rx={95} ry={115}
              fill={`url(#grad${cluster})`}
              style={{ opacity: active ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }} />
          ))}

        {CONNECTIONS.map(({ from, to, cluster }, i) => {
          const a = getNode(from); const b = getNode(to);
          return (
            <path key={`conn-${from}-${to}`} d={bezierPath(a.x, a.y, b.x, b.y)} fill="none"
              stroke={CLUSTER_COLORS[cluster]} strokeWidth="1.5" strokeLinecap="round"
              style={{ opacity: active ? 0.5 : 0, transition: `opacity 0.5s ease ${200 + i * 60}ms` }} />
          );
        })}

        {[{ to: "C", cluster: 1 }, { to: "E", cluster: 2 }, { to: "G", cluster: 3 }].map(({ to, cluster }) => {
          const node = getNode(to);
          return (
            <path key={`prof-${to}`} d={bezierPath(PROF.x, PROF.y, node.x, node.y, -0.15)} fill="none"
              stroke={CLUSTER_COLORS[cluster]} strokeWidth="1" strokeDasharray="5 4" strokeLinecap="round"
              markerEnd={`url(#arrow${cluster})`}
              style={{ opacity: active ? 0.35 : 0, transition: "opacity 0.6s ease 0.6s" }} />
          );
        })}

        {STUDENTS.map((s, i) => {
          const color = CLUSTER_COLORS[s.cluster];
          const personFill = active ? color : "rgba(182,177,217,0.35)";
          const transFill = `fill 0.5s ease ${i * 40}ms`;
          return (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r={28} fill="none" stroke={color} strokeWidth="1"
                style={{ opacity: active ? 0.2 : 0, transition: `opacity 0.5s ease ${i * 50}ms` }} />
              <circle cx={s.x} cy={s.y} r={20}
                fill={active ? `${color}1a` : "rgba(30,27,70,0.75)"}
                stroke={active ? color : "rgba(120,114,168,0.4)"}
                strokeWidth={active ? "1.5" : "1"}
                filter={active ? "url(#glow)" : undefined}
                style={{ transition: `all 0.5s ease ${i * 40}ms` }} />
              <circle cx={s.x} cy={s.y - 7} r={5.5} fill={personFill}
                style={{ transition: transFill }} />
              <path d={`M ${s.x - 10} ${s.y + 15} Q ${s.x - 11} ${s.y + 1} ${s.x} ${s.y + 1} Q ${s.x + 11} ${s.y + 1} ${s.x + 10} ${s.y + 15}`}
                fill={personFill} style={{ transition: transFill }} />
              <g style={{ opacity: active ? 0 : (mounted ? 0.7 : 0), transition: "opacity 0.35s ease" }}>
                <rect x={s.x + 13} y={s.y - 31} width="16" height="16" rx="8"
                  fill="rgba(30,27,70,0.9)" stroke="rgba(120,114,168,0.35)" strokeWidth="1" />
                <text x={s.x + 21} y={s.y - 20} textAnchor="middle" fontSize="8" fill="rgba(182,177,217,0.55)">🔒</text>
              </g>
              <circle cx={s.x + 14} cy={s.y - 14} r="5" fill={color}
                style={{ opacity: active ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.04}s`, filter: active ? "url(#glow)" : undefined }} />
            </g>
          );
        })}

        <g style={{ opacity: active ? 1 : 0, transition: "opacity 0.7s ease 0.4s" }}>
          <circle cx={PROF.x} cy={PROF.y} r={32} fill="none" stroke="#f5a623" strokeWidth="0.75" strokeDasharray="6 4" opacity="0.3" />
          <circle cx={PROF.x} cy={PROF.y} r={24} fill="rgba(245,166,35,0.1)" stroke="#f5a623" strokeWidth="1.5" />
          <circle cx={PROF.x} cy={PROF.y - 7} r={6} fill="#f5a623" opacity={0.9} />
          <path d={`M ${PROF.x - 11} ${PROF.y + 16} Q ${PROF.x - 12} ${PROF.y + 1} ${PROF.x} ${PROF.y + 1} Q ${PROF.x + 12} ${PROF.y + 1} ${PROF.x + 11} ${PROF.y + 16}`}
            fill="#f5a623" opacity={0.9} />
          <rect x={PROF.x - 11} y={PROF.y - 17} width="22" height="3" rx="1.5" fill="#f5a623" />
          <line x1={PROF.x} y1={PROF.y - 17} x2={PROF.x} y2={PROF.y - 14} stroke="#f5a623" strokeWidth="2.5" />
          <rect x={PROF.x - 66} y={PROF.y - 54} width="132" height="18" rx="9" fill="rgba(245,166,35,0.12)" stroke="rgba(245,166,35,0.25)" strokeWidth="1" />
          <text x={PROF.x} y={PROF.y - 41} textAnchor="middle" fontSize="8.5" fontFamily="'DM Mono', monospace" fill="#f5a623" letterSpacing="0.5">VISIBLE TO INSTRUCTOR</text>
        </g>

        {[{ cluster: 1, x: 186, y: 172 }, { cluster: 2, x: 20, y: 158 }, { cluster: 3, x: 392, y: 184 }]
          .map(({ cluster, x, y }) => {
            const color = CLUSTER_COLORS[cluster]; const meta = CLUSTER_META[cluster]; const w = 142, h = 34;
            return (
              <g key={`card-${cluster}`} style={{ opacity: active ? 1 : 0, transition: `opacity 0.5s ease ${0.55 + cluster * 0.08}s` }}>
                <rect x={x} y={y} width={w} height={h} rx="7" fill="rgba(20,18,52,0.88)" stroke={`${color}40`} strokeWidth="1" filter="url(#shadow)" />
                <rect x={x} y={y} width="3" height={h} rx="1.5" fill={color} opacity="0.8" />
                <text x={x + 11} y={y + 13} fontSize="9" fontFamily="'DM Mono', monospace" fill={color} letterSpacing="0.2">{meta.count}</text>
                <text x={x + 11} y={y + 26} fontSize="8.5" fontFamily="Inter, sans-serif" fill="rgba(182,177,217,0.7)">{meta.label}</text>
              </g>
            );
          })}

      </svg>
    </div>
  );
}

// ── Shared reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

// ── Section 2: The Learning Visibility Gap (defined, available for future use) ──
function VisibilityGapSection() {
  const { ref, on } = useReveal(0.06);

  const f = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${d}ms, transform 0.7s ease ${d}ms`,
  });

  const na = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: `opacity 0.5s ease ${d}ms`,
  });

  return (
    <section ref={ref} className="py-20 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
      <div className="max-w-6xl mx-auto">

        <p style={{ ...f(0), fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "rgba(182,177,217,0.42)", marginBottom: "2rem" }}>
          WHAT'S ACTUALLY HAPPENING
        </p>

        <h2 style={{ ...f(80), fontFamily: "'Instrument Serif', serif", fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 400, color: "#f5f3ff", lineHeight: 1.04, letterSpacing: "-0.01em", marginBottom: "2.75rem" }}>
          The Learning<br />
          <span style={{ color: "rgba(245,243,255,0.28)" }}>Visibility Gap</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_64px_1fr] rounded-2xl overflow-hidden mb-14"
          style={{ ...f(180), border: "1px solid rgba(182,177,217,0.09)" }}>

          <div className="p-8 lg:p-10" style={{ background: "rgba(124,131,245,0.04)" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#7c83f5", marginBottom: "1.75rem" }}>
              BEFORE AI
            </p>

            <svg viewBox="0 0 200 90" className="w-full mb-5" style={{ maxHeight: "68px" }} aria-hidden>
              <defs>
                <filter id="lglow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {[
                { d: "M 20 18 Q 100 18 178 45", delay: 380 },
                { d: "M 20 45 L 178 45",         delay: 460 },
                { d: "M 20 72 Q 100 72 178 45",  delay: 540 },
              ].map((path, i) => (
                <path key={i} d={path.d} fill="none" stroke="#7c83f5" strokeWidth="1.5" strokeLinecap="round"
                  pathLength={1} strokeDasharray={1}
                  strokeDashoffset={on ? 0 : 1}
                  style={{ transition: `stroke-dashoffset 0.95s cubic-bezier(0.4,0,0.2,1) ${path.delay}ms` }}
                />
              ))}
              {[18, 45, 72].map((y, i) => (
                <g key={y} style={na(120 + i * 75)}>
                  <circle cx={20} cy={y} r={8} fill="rgba(124,131,245,0.14)" stroke="#7c83f5" strokeWidth="1.5" />
                  <circle cx={20} cy={y} r={3.5} fill="#7c83f5" opacity={0.8} />
                </g>
              ))}
              <g style={na(760)}>
                <circle cx={178} cy={45} r={17} fill="rgba(245,166,35,0.1)" stroke="#f5a623" strokeWidth="1.5" filter="url(#lglow)" />
                <circle cx={178} cy={45} r={25} fill="none" stroke="#f5a623" strokeWidth="0.5" strokeDasharray="2 3" opacity={0.3} />
              </g>
            </svg>

            <div className="space-y-3 mb-6">
              {["Class Questions", "Discussion Forums", "Office Hours"].map((item, i) => (
                <div key={item} className="flex items-center gap-3" style={na(320 + i * 80)}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#7c83f5", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "#f5f3ff", fontFamily: "'Inter', sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ ...na(640), background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: "10.5px", fontFamily: "'DM Mono', monospace", color: "#4ade80", letterSpacing: "0.04em" }}>
                VISIBLE TO INSTRUCTORS
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center py-5 lg:py-0"
            style={{ background: "rgba(8,6,24,0.4)", borderTop: "1px solid rgba(182,177,217,0.06)", borderBottom: "1px solid rgba(182,177,217,0.06)" }}>
            <div style={na(480)}>
              <svg viewBox="0 0 28 60" width="28" height="60" className="hidden lg:block" aria-hidden>
                <line x1="14" y1="6" x2="14" y2="44" stroke="rgba(182,177,217,0.2)" strokeWidth="1" strokeDasharray="3 4" />
                <polyline points="8,38 14,50 20,38" fill="none" stroke="rgba(182,177,217,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 60 28" width="60" height="28" className="lg:hidden" aria-hidden>
                <line x1="6" y1="14" x2="44" y2="14" stroke="rgba(182,177,217,0.2)" strokeWidth="1" strokeDasharray="3 4" />
                <polyline points="38,8 50,14 38,20" fill="none" stroke="rgba(182,177,217,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="p-8 lg:p-10" style={{ background: "rgba(8,6,24,0.45)" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "rgba(182,177,217,0.4)", marginBottom: "1.75rem" }}>
              TODAY
            </p>

            <svg viewBox="0 0 200 90" className="w-full mb-5" style={{ maxHeight: "68px" }} aria-hidden>
              <defs>
                <linearGradient id="linefade" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(182,177,217,0.28)" />
                  <stop offset="70%" stopColor="rgba(182,177,217,0.06)" />
                  <stop offset="100%" stopColor="rgba(182,177,217,0)" />
                </linearGradient>
              </defs>
              {[18, 45, 72].map((y, i) => (
                <g key={y}>
                  <line x1={28} y1={y} x2={192} y2={y}
                    stroke="url(#linefade)" strokeWidth="1" strokeDasharray="4 6"
                    style={na(260 + i * 90)} />
                  <circle cx={20} cy={y} r={8}
                    fill="rgba(20,17,48,0.85)" stroke="rgba(182,177,217,0.18)" strokeWidth="1" strokeDasharray="2 2"
                    style={na(120 + i * 75)} />
                  <text x={20} y={y + 4} textAnchor="middle" fontSize="8.5" fill="rgba(182,177,217,0.35)">⊗</text>
                </g>
              ))}
              <circle cx={178} cy={45} r={17}
                fill="none" stroke="rgba(182,177,217,0.07)" strokeWidth="1" strokeDasharray="3 3"
                style={na(760)} />
              <text x={178} y={49} textAnchor="middle" fontSize="9" fontFamily="'DM Mono', monospace" fill="rgba(182,177,217,0.15)"
                style={na(820)}>?</text>
            </svg>

            <div className="space-y-3 mb-4">
              {["ChatGPT", "Claude", "NotebookLM"].map((item, i) => (
                <div key={item} className="flex items-center gap-3" style={na(320 + i * 80)}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", border: "1.5px solid rgba(182,177,217,0.22)", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "rgba(182,177,217,0.5)", fontFamily: "'Inter', sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>

            <p style={{ ...na(560), fontSize: "10.5px", fontFamily: "'DM Mono', monospace", color: "rgba(182,177,217,0.3)", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
              PRIVATE AI CONVERSATIONS
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ ...na(640), background: "rgba(182,177,217,0.04)", border: "1px solid rgba(182,177,217,0.1)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(182,177,217,0.25)" }} />
              <span style={{ fontSize: "10.5px", fontFamily: "'DM Mono', monospace", color: "rgba(182,177,217,0.4)", letterSpacing: "0.04em" }}>
                INVISIBLE TO INSTRUCTORS
              </span>
            </div>
          </div>
        </div>

        <div style={{ ...f(700), textAlign: "center" }}>
          <div className="flex items-center gap-6 mb-8">
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(182,177,217,0.12))" }} />
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(182,177,217,0.3)", whiteSpace: "nowrap" }}>KEY INSIGHT</p>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(182,177,217,0.12), transparent)" }} />
          </div>

          <h3 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(1.9rem, 3.8vw, 3rem)",
            fontWeight: 400, color: "#f5f3ff", lineHeight: 1.18,
            marginBottom: "1.5rem",
          }}>
            The questions didn't disappear.
            <br />
            <span style={{ color: "rgba(245,243,255,0.42)" }}>The visibility did.</span>
          </h3>

          <p style={{ fontSize: "15px", color: "rgba(182,177,217,0.65)", lineHeight: 1.78, maxWidth: "52ch", margin: "0 auto" }}>
            Students are still asking questions, struggling with concepts, and seeking help. Increasingly, those interactions happen inside AI systems that instructors never see.
          </p>
        </div>

      </div>
    </section>
  );
}

// ── Section 3: AI Didn't Reduce Questions ─────────────────────────────────────
function InsightSection() {
  const { ref, on } = useReveal(0.1);
  const [count, setCount] = useState(0);
  const [barsOn, setBarsOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const totalFrames = 96;
    const timer = setInterval(() => {
      frame++;
      const t = frame / totalFrames;
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.min(Math.round(eased * 90), 90));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);
    const barDelay = setTimeout(() => setBarsOn(true), 500);
    return () => { clearInterval(timer); clearTimeout(barDelay); };
  }, [on]);

  const fade = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${d}ms, transform 0.7s ease ${d}ms`,
  });

  const slideLeft = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateX(0)" : "translateX(-24px)",
    transition: `opacity 0.75s ease ${d}ms, transform 0.75s ease ${d}ms`,
  });

  return (
    <section ref={ref} className="py-20 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl p-10 md:p-14"
          style={{ background: "rgba(14,12,38,0.8)", border: "1px solid rgba(182,177,217,0.09)" }}>

          <div style={{ ...fade(0), width: "40px", height: "2px", background: "#7c83f5", opacity: 0.6, marginBottom: "2.5rem" }} />

          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">

            <div className="lg:col-span-3 flex flex-col gap-8">

              <div>
                {[
                  { text: "Here's how big", delay: 80, bright: true },
                  { text: "the gap actually is.", delay: 200, bright: false },
                ].map(({ text, delay, bright }) => (
                  <div key={text} style={slideLeft(delay)}>
                    <span style={{
                      display: "block",
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "clamp(2rem, 4.2vw, 3.4rem)",
                      fontWeight: 400,
                      lineHeight: 1.12,
                      color: bright ? "#f5f3ff" : "rgba(245,243,255,0.38)",
                    }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-7" style={{ paddingLeft: "1.5rem" }}>

              <div style={fade(160)}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem" }}>
                  <div>
                    <span style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "clamp(5.5rem, 10vw, 8rem)",
                      fontWeight: 400,
                      color: "#7c83f5",
                      lineHeight: 1,
                      display: "block",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {count}%
                    </span>
                    <p style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "9.5px",
                      letterSpacing: "0.07em", color: "rgba(182,177,217,0.42)",
                      marginTop: "8px", lineHeight: 1.6,
                    }}>
                      OF STUDENTS USE<br />GENERATIVE AI
                    </p>
                  </div>

                  <div style={{ paddingBottom: "2px" }}>
                    <span style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "clamp(2.2rem, 4vw, 3rem)",
                      fontWeight: 400,
                      color: "#f5a623",
                      lineHeight: 1,
                      display: "block",
                    }}>25%</span>
                    <p style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "9.5px",
                      letterSpacing: "0.07em", color: "rgba(182,177,217,0.42)",
                      marginTop: "6px", lineHeight: 1.6,
                    }}>
                      REPORT AI SUBSTITUTING<br />FOR OFFICE HOURS &amp;<br />REQUIRED READINGS
                    </p>
                  </div>
                </div>
                <a
                  href="https://arxiv.org/abs/2406.00833"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "1rem",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(124,131,245,0.55)",
                    letterSpacing: "0.05em",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(124,131,245,0.2)",
                    paddingBottom: "1px",
                    transition: "color 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(124,131,245,0.9)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(124,131,245,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(124,131,245,0.55)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(124,131,245,0.2)";
                  }}
                >
                  Harvard Study, 2024 ↗
                </a>
              </div>

              <div style={{ borderTop: "1px solid rgba(182,177,217,0.09)", paddingTop: "1.5rem", ...fade(400) }}>
                <div className="space-y-5">
                  {[
                    { label: "Questions being asked", pct: 100, fill: "#7c83f5", val: "—", bright: true, barDelay: 0 },
                    { label: "Visible to instructors", pct: 10, fill: "rgba(124,131,245,0.3)", val: "10%", bright: false, barDelay: 200 },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span style={{ fontSize: "12px", fontFamily: "'Inter', sans-serif", color: row.bright ? "rgba(182,177,217,0.65)" : "rgba(182,177,217,0.38)" }}>
                          {row.label}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: row.bright ? "#7c83f5" : "rgba(182,177,217,0.38)" }}>
                          {row.val}
                        </span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "2px", background: "rgba(255,255,255,0.055)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "2px",
                          background: row.fill,
                          width: barsOn ? `${row.pct}%` : "0%",
                          transition: `width 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${row.barDelay}ms`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: What Horizon Does ────────────────────────────────────────────────
function BenefitsSection() {
  const { ref, on } = useReveal(0.08);

  const fade = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${d}ms, transform 0.7s ease ${d}ms`,
  });

  const studentBullets = [
    "Get AI answers grounded in your actual course materials",
    "See how classmates are thinking about the same problems",
    "Know you're not the only one when something doesn't click",
  ];

  const instructorBullets = [
    "Know where students are stuck before exams reveal it",
    "See the questions students ask AI but never raise in class",
    "Understand which concepts need more time before moving on",
  ];

  return (
    <section ref={ref} className="py-20 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
      <div className="max-w-6xl mx-auto">
        <p style={{ ...fade(0), fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "rgba(182,177,217,0.42)", marginBottom: "2.5rem" }}>
          WHAT HORIZON DOES
        </p>
        <div className="rounded-2xl p-10 md:p-14"
          style={{ ...fade(80), background: "rgba(14,12,38,0.8)", border: "1px solid rgba(182,177,217,0.09)" }}>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#7c83f5", marginBottom: "1.75rem" }}>
                FOR STUDENTS
              </p>
              <div className="space-y-4">
                {studentBullets.map((text, i) => (
                  <div key={text} className="flex items-start gap-3"
                    style={{
                      opacity: on ? 1 : 0,
                      transform: on ? "translateY(0)" : "translateY(12px)",
                      transition: `opacity 0.6s ease ${200 + i * 80}ms, transform 0.6s ease ${200 + i * 80}ms`,
                    }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#7c83f5", flexShrink: 0, marginTop: "6px" }} />
                    <span style={{ fontSize: "14px", color: "#f5f3ff", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#f5a623", marginBottom: "1.75rem" }}>
                FOR INSTRUCTORS
              </p>
              <div className="space-y-4">
                {instructorBullets.map((text, i) => (
                  <div key={text} className="flex items-start gap-3"
                    style={{
                      opacity: on ? 1 : 0,
                      transform: on ? "translateY(0)" : "translateY(12px)",
                      transition: `opacity 0.6s ease ${200 + i * 80}ms, transform 0.6s ease ${200 + i * 80}ms`,
                    }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f5a623", flexShrink: 0, marginTop: "6px" }} />
                    <span style={{ fontSize: "14px", color: "#f5f3ff", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Cycling word animator ─────────────────────────────────────────────────────
function CyclingWord({ words, interval = 1800 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % words.length);
        setVisible(true);
      }, 350);
    }, interval);
    return () => clearInterval(cycle);
  }, [words, interval]);

  return (
    <span style={{
      display: "inline-block",
      color: "#f5f3ff",
      fontStyle: "italic",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-6px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
      minWidth: "7ch",
    }}>
      {words[index]}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [vizActive, setVizActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const vizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetVizTimer = () => {
    if (vizTimerRef.current) clearInterval(vizTimerRef.current);
    vizTimerRef.current = setInterval(() => setVizActive(prev => !prev), 3500);
  };

  useEffect(() => {
    resetVizTimer();
    return () => { if (vizTimerRef.current) clearInterval(vizTimerRef.current); };
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#211d45", color: "#f5f3ff", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(33,29,69,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(182,177,217,0.1)" : "none",
        }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center">
            <HorizonLogo variant="light" size="2rem" />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link to="/login" className="text-sm transition-colors whitespace-nowrap" style={{ color: "#b6b1d9" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f3ff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#b6b1d9")}>Sign in</Link>
            <Link to="/signup" className="text-sm px-4 py-2 rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: "#ede9fe", color: "#211d45", fontWeight: 500 }}>Get started</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(124,131,245,0.09) 0%, transparent 65%)" }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="mb-5 leading-[1.08] tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)", fontWeight: 400, color: "#f5f3ff" }}>
                Students already learn with AI.
                <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Horizon makes that learning visible.</span>
              </h1>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#b6b1d9", maxWidth: "42ch" }}>
                Students are asking ChatGPT questions anyway. Horizon turns those private conversations into shared learning, giving instructors insight into what their class actually struggles with.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#ede9fe", color: "#211d45" }}>
                Get started here <ArrowRight size={15} />
              </Link>
            </div>

            <div>
              <div className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(182,177,217,0.1)", background: "rgba(20,17,56,0.8)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(182,177,217,0.07)" }}>
                  <div className="flex items-center gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />)}
                  </div>
                  <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace", color: "rgba(182,177,217,0.35)" }}>
                    ECON 201 · 8 students active
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 pt-4 pb-1">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", whiteSpace: "nowrap", color: vizActive ? "#ede9fe" : "rgba(182,177,217,0.45)", transition: "color 0.4s ease" }}>
                    {vizActive ? "● WITH HORIZON" : "○ WITHOUT HORIZON"}
                  </span>
                  <div className="hidden sm:flex items-center gap-3" style={{ opacity: vizActive ? 1 : 0, transition: "opacity 0.5s ease 0.5s" }}>
                    {Object.entries(CLUSTER_COLORS).map(([k, color]) => (
                      <div key={k} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        <span style={{ fontSize: "9px", color: "rgba(182,177,217,0.5)", fontFamily: "'DM Mono', monospace" }}>
                          {CLUSTER_META[+k].label.split("—")[0].trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-3 pb-2"><ClassroomVisual active={vizActive} /></div>
                <div className="px-5 pb-5">
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.05em",
                    color: "rgba(182,177,217,0.45)",
                    textAlign: "center",
                    marginBottom: "0.75rem",
                    transition: "opacity 0.4s ease",
                  }}>
                    {vizActive
                      ? "3 question clusters identified · professor has full context"
                      : "8 private AI conversations · 0 shared · professor sees nothing"}
                  </p>
                  <button onClick={() => { setVizActive(prev => !prev); resetVizTimer(); }}
                    className="w-full py-2 rounded-xl font-medium transition-all duration-300 active:scale-[0.98]"
                    style={{
                      background: vizActive ? "rgba(124,131,245,0.1)" : "rgba(182,177,217,0.06)",
                      border: `1px solid ${vizActive ? "rgba(124,131,245,0.28)" : "rgba(182,177,217,0.12)"}`,
                      color: vizActive ? "#c4c7fa" : "#b6b1d9",
                      fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em",
                      fontSize: "11px",
                    }}>
                    {vizActive ? "← See what professors are missing" : "See what Horizon makes visible →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: INSIGHT / SCALE OF THE GAP ── */}
      <InsightSection />

      {/* ── SECTION 4: WHAT HORIZON DOES ── */}
      <BenefitsSection />

      {/* ── SOLUTION + CTA ── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
        <div className="max-w-xl mx-auto text-center">

          <h2 className="mb-8 leading-snug"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 400, color: "#f5f3ff", lineHeight: 1.15 }}>
            Learning is already happening with AI.
            <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Make sure it happens together.</span>
          </h2>

          <Link to="/signup"
            className="inline-flex items-center gap-3 rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] mb-5"
            style={{
              background: "#ede9fe",
              color: "#211d45",
              padding: "0.9rem 2rem",
              fontSize: "1.05rem",
              boxShadow: "0 8px 32px rgba(124,131,245,0.2)",
            }}>
            Get started here
            <ArrowRight size={18} />
          </Link>

          <p className="block text-sm" style={{ color: "rgba(182,177,217,0.4)" }}>
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-2 transition-colors" style={{ color: "rgba(182,177,217,0.6)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f3ff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(182,177,217,0.6)")}>Sign in</Link>
          </p>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-8" style={{ borderTop: "1px solid rgba(182,177,217,0.07)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <HorizonLogo variant="light" size="1.5rem" />
          </Link>
          <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace", color: "rgba(182,177,217,0.3)" }}>© 2026 Horizon Labs</span>
        </div>
      </footer>

      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
