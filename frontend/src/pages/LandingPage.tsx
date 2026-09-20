import { useState, useEffect, useRef } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import HorizonLogo from "../components/HorizonLogo";

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
function BenefitsSection() {
  const { ref, on } = useReveal(0.08);

  const fade = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${d}ms, transform 0.7s ease ${d}ms`,
  });

  const studentBullets = [
    "Answers grounded in your class materials, with the source cited",
    "One shared conversation — see what classmates are asking and how they think about it",
    "Fork any answer into a private chat to go deeper, then share what you find back",
  ];

  const instructorBullets = [
    "Know where students are stuck before exams reveal it",
    "See the questions students ask AI but never raise in class",
    "Understand which concepts need more time before moving on",
  ];

  return (
    <section ref={ref} className="py-20 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...fade(0), fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 400, color: "#f5f3ff", marginBottom: "2.5rem" }}>
          Built for study groups. <span style={{ color: "rgba(245,243,255,0.45)" }}>Works for whole classes too.</span>
        </h2>
        <div className="rounded-2xl p-10 md:p-14"
          style={{ ...fade(80), background: "rgba(14,12,38,0.8)", border: "1px solid rgba(182,177,217,0.09)" }}>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#7c83f5", marginBottom: "1.75rem" }}>
                FOR STUDY GROUPS
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
                FOR INSTRUCTORS &amp; TAs
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

// ── Hero: a still of a real group conversation ────────────────────────────────
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

function Avatar({ label, bg }: { label: string; bg: string }) {
  return (
    <span className="rounded-full flex items-center justify-center shrink-0 font-semibold text-white" style={{ width: 26, height: 26, fontSize: 11, background: bg }} aria-hidden>{label}</span>
  );
}

function Name({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[13px] font-medium" style={{ color: "#f5f3ff" }}>{children}</span>
      {sub && <span style={{ ...mono, fontSize: 10, color: "rgba(182,177,217,0.45)" }}>{sub}</span>}
    </div>
  );
}

function ConversationPreview() {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(182,177,217,0.1)", background: "rgba(20,17,56,0.8)", backdropFilter: "blur(12px)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(182,177,217,0.07)" }}>
        <div className="flex items-center gap-1.5">
          {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />)}
        </div>
        <span className="text-xs" style={{ ...mono, color: "rgba(182,177,217,0.35)" }}>EECS 551 · 12 members · 3 active now</span>
      </div>
      <div className="px-5 py-4 space-y-4 text-[13px] leading-relaxed" style={{ color: "#d9d6ef" }}>
        <div className="flex items-start gap-2.5">
          <Avatar label="A" bg="#8686AC" />
          <div className="min-w-0">
            <Name sub="4:21 PM">Alice</Name>
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 mt-1 mb-1" style={{ ...mono, fontSize: 10, color: "#c4c7fa", background: "rgba(124,131,245,0.14)" }}>
              <FileText size={10} /> Lecture 7 slides
            </span>
            <p>Why does truncating the SVD give the best low-rank approximation?</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Avatar label="H" bg="linear-gradient(135deg, #f59e0b, #ef6c00)" />
          <div className="min-w-0">
            <Name sub="BOT">Horizon</Name>
            <p>Because the singular values are ordered by how much variance each direction captures. Keeping the top <em>k</em> minimizes the Frobenius-norm error — that's the Eckart–Young theorem
              <sup style={{ ...mono, fontSize: 9, color: "#c4c7fa", marginLeft: 3 }}>[1]</sup>.</p>
            <p className="mt-1" style={{ ...mono, fontSize: 10, color: "rgba(182,177,217,0.45)" }}>Sources (1) · Save · Fork · Follow up</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 pl-8">
          <Avatar label="B" bg="#8686AC" />
          <div className="min-w-0">
            <Name sub="4:23 PM">Bob</Name>
            <p>This matches what she said in lecture — the "keep the directions with the most spread" intuition.</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 pl-8">
          <Avatar label="S" bg="#8686AC" />
          <div className="min-w-0">
            <Name sub="4:24 PM">Sara</Name>
            <p>So is that also why PCA uses it? Forking this to dig in.</p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(182,177,217,0.06)", border: "1px solid rgba(182,177,217,0.12)", color: "rgba(182,177,217,0.5)" }}>
          Message EECS 551…
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

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
            <Link to="/start" className="text-sm px-4 py-2 rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: "#ede9fe", color: "#211d45", fontWeight: 500 }}>Create a group</Link>
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
                Study together.
                <br />Ask anything.
                <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Know it's right.</span>
              </h1>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#b6b1d9", maxWidth: "44ch" }}>
                Make a study group for your class, drop in the lecture notes and homework, and invite your friends. Horizon answers from what your professor actually taught — with citations — and your group is right there to discuss it.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/start" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#ede9fe", color: "#211d45" }}>
                  Create a study group <ArrowRight size={15} />
                </Link>
                <span className="text-sm" style={{ color: "rgba(182,177,217,0.6)" }}>Free · takes 30 seconds · no professor needed</span>
              </div>
            </div>

            <div>
              <ConversationPreview />
            </div>
          </div>

          {/* How it works */}
          <div className="grid sm:grid-cols-3 gap-4 mt-16">
            {[
              { n: "01", title: "Create a group", body: "Name it after your class. You get a link to share." },
              { n: "02", title: "Add your materials", body: "Slides, notes, homework — anyone in the group can upload." },
              { n: "03", title: "Ask, together", body: "Horizon answers from those materials. Your group discusses, follows up, and forks." },
            ].map(step => (
              <div key={step.n} className="rounded-2xl p-5"
                style={{ background: "rgba(14,12,38,0.6)", border: "1px solid rgba(182,177,217,0.09)" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#7c83f5", marginBottom: "0.6rem" }}>{step.n}</p>
                <p className="text-[15px] font-medium mb-1" style={{ color: "#f5f3ff" }}>{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#b6b1d9" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHAT HORIZON DOES ── */}
      <BenefitsSection />

      {/* ── SOLUTION + CTA ── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
        <div className="max-w-xl mx-auto text-center">

          <h2 className="mb-8 leading-snug"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 400, color: "#f5f3ff", lineHeight: 1.15 }}>
            You're going to ask AI anyway.
            <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Ask it with your class, from your class.</span>
          </h2>

          <Link to="/start"
            className="inline-flex items-center gap-3 rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] mb-5"
            style={{
              background: "#ede9fe",
              color: "#211d45",
              padding: "0.9rem 2rem",
              fontSize: "1.05rem",
              boxShadow: "0 8px 32px rgba(124,131,245,0.2)",
            }}>
            Create a study group
            <ArrowRight size={18} />
          </Link>

          <p className="block text-sm mb-2" style={{ color: "rgba(182,177,217,0.4)" }}>
            Teaching a course?{" "}
            <Link to="/signup" className="underline underline-offset-2 transition-colors" style={{ color: "rgba(182,177,217,0.6)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f3ff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(182,177,217,0.6)")}>Set up Horizon for your class</Link>
          </p>
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
