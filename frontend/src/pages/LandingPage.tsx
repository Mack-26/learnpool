// Horizon landing page — implements design/Main.html (1440) and
// design/Mobile.html (390) as one responsive component. See design/README.md
// for tokens, copy rules and motion rules.
import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import HorizonLogo from "../components/HorizonLogo";
import HeroDemo from "../components/landing/HeroDemo";
import GroupDemo from "../components/landing/GroupDemo";
import SpaceDemo from "../components/landing/SpaceDemo";
import { Avatar, GhostPill, Reveal, SectionHead, UpIcon } from "../components/landing/primitives";

const BTN_PRIMARY =
  "inline-flex items-center justify-center font-medium text-primary-foreground bg-primary transition-[background-color,box-shadow] duration-200 hover:bg-[#143A2F] hover:shadow-[0_6px_18px_-8px_rgba(28,74,60,.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-[7px] font-medium text-foreground bg-white border border-input transition-colors duration-200 hover:bg-[#F1EFE8] hover:border-[#CFC9BC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const NAV_LINK =
  "inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground md:text-[14.5px]";

function scrollToId(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

const PROBLEMS = [
  ["Group chats", "Questions disappear into the scroll."],
  ["AI chats", "Answers stay private."],
  ["Course folders", "Materials sit apart from the conversation."],
];

const PROOF = [
  ["Grounded", "Answers come from your group's materials."],
  ["Visible", "Every question is shared with the group."],
  ["Checked", "Classmates reply, correct, and vote."],
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[#EBE7DE] bg-background/90 backdrop-blur">
        <div className="flex h-[60px] items-center justify-between px-5 md:h-[72px] md:px-16">
          <Link to="/" className="inline-flex min-h-11 items-center" aria-label="Horizon home">
            <HorizonLogo variant="dark" size="1.75rem" />
          </Link>
          <nav className="hidden items-center gap-[34px] md:flex" aria-label="Primary">
            <a href="#product" onClick={(e) => scrollToId(e, "product")} className={NAV_LINK}>
              Product
            </a>
          </nav>
          <div className="flex items-center gap-3.5 md:gap-5">
            <Link to="/login" className={NAV_LINK}>
              Sign in
            </Link>
            <Link to="/start" className={`${BTN_PRIMARY} hidden h-[38px] rounded-lg px-[17px] text-sm md:inline-flex`}>
              Create a study group
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-[9px] border border-transparent transition-colors hover:bg-[#F1EFE8] md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 2l12 12M14 2 2 14" stroke="#3D3A34" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
                  <path d="M1 1h16M1 6h16M1 11h16" stroke="#3D3A34" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="flex flex-col gap-1 border-t border-[#EBE7DE] bg-background px-5 pb-4 pt-2 md:hidden"
          >
            <a
              href="#product"
              onClick={(e) => {
                setMenuOpen(false);
                scrollToId(e, "product");
              }}
              className="flex min-h-11 items-center text-[15px] text-foreground"
            >
              Product
            </a>
            <Link to="/start" className={`${BTN_PRIMARY} mt-2 h-12 rounded-[11px] text-[15px]`} onClick={() => setMenuOpen(false)}>
              Create a study group
            </Link>
          </nav>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section id="top" className="flex flex-col px-6 pb-[60px] pt-[52px] md:items-center md:px-16 md:pb-32 md:pt-28">
        <Reveal>
          <h1 className="text-[42px] font-medium leading-[1.08] tracking-[-.033em] md:text-center md:text-[76px] md:leading-[1.05] md:tracking-[-.035em]">
            <span className="block">Study together.</span>
            <span className="block">Ask together.</span>
            <span className="block text-primary">Learn together.</span>
          </h1>
        </Reveal>
        <Reveal delay={60}>
          <p className="mt-[22px] max-w-[660px] text-[17px] leading-[1.5] tracking-[-.008em] text-muted-foreground md:mt-[30px] md:text-center md:text-xl md:tracking-[-.01em]">
            A shared learning space for your people, your materials, and AI.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-7 flex flex-col gap-2.5 md:mt-10 md:flex-row md:items-center md:gap-3">
            <Link to="/start" className={`${BTN_PRIMARY} h-[50px] rounded-[11px] text-[15.5px] md:h-12 md:rounded-[10px] md:px-6`}>
              Create a study group
            </Link>
            <a
              href="#product"
              onClick={(e) => scrollToId(e, "product")}
              className={`${BTN_GHOST} h-[50px] rounded-[11px] text-[15.5px] md:h-12 md:rounded-[10px] md:px-[22px]`}
            >
              See how it works{" "}
              <span aria-hidden="true" className="text-[var(--ink-2)]">
                →
              </span>
            </a>
          </div>
        </Reveal>
        <Reveal delay={240} className="mt-10 flex w-full justify-center md:mt-[88px]">
          <HeroDemo />
        </Reveal>
      </section>

      {/* ── 01 · The problem ────────────────────────────────────────────── */}
      <section className="border-t border-[#EBE7DE] px-6 py-[60px] md:px-16 md:py-[104px]">
        <div className="mx-auto max-w-[1120px]">
          <Reveal>
            <div className="mono text-[10px] tracking-[.1em] text-[var(--ink-2)] md:text-[10.5px]">
              01&nbsp;&nbsp;/&nbsp;&nbsp;THE PROBLEM
            </div>
            <h2 className="mt-[18px] max-w-[900px] text-[36px] font-medium leading-[1.1] tracking-[-.032em] md:mt-[26px] md:text-[58px] md:leading-[1.08] md:tracking-[-.034em]">
              Course materials are shared.
              <br />
              <span className="text-[#8A857C]">Learning usually isn't.</span>
            </h2>
            <p className="mt-5 max-w-[560px] text-[16.5px] leading-[1.55] text-muted-foreground md:mt-[26px] md:text-lg">
              Everyone has the same materials.
              <br />
              Everyone studies somewhere different.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-3 md:mt-14 md:grid-cols-3 md:gap-6">
            {PROBLEMS.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-white px-[18px] py-[17px] md:px-6 md:pb-6 md:pt-[22px]">
                <div className="text-[14.5px] font-semibold tracking-[-.012em] md:text-[15px]">{title}</div>
                <p className="mt-1.5 text-[14.5px] leading-[1.5] text-muted-foreground md:mt-2 md:text-[15px] md:leading-[1.55]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · The product ────────────────────────────────────────────── */}
      <section id="product" className="scroll-mt-[60px] border-t border-[#E7E3D9] bg-secondary px-6 py-[60px] md:scroll-mt-[72px] md:px-16 md:py-[104px]">
        <div className="mx-auto max-w-[1312px]">
          <SectionHead
            index="02"
            label="THE PRODUCT"
            title="One shared space for what you're learning."
            support="Materials, questions, answers, and the people learning with you — in one place."
            wide
          />
          <div className="mt-8 md:mt-14">
            <GroupDemo />
          </div>

          <div className="mt-5 grid items-start gap-6 md:mt-10 md:gap-16 lg:grid-cols-[620px_minmax(0,1fr)]">
            <div className="rounded-[11px] border border-[var(--ai-border)] bg-white px-[15px] py-3.5 md:px-[18px] md:py-4">
              <div className="flex items-center justify-between gap-2 md:gap-4">
                <span className="text-[11px] font-semibold text-accent-foreground md:text-[12.5px]">
                  [1] · Quant Review<span className="hidden md:inline"> — Algebra</span> · Page 12
                </span>
                <span className="shrink-0 text-[11px] text-[var(--ink-2)] md:text-[12.5px]">96% match</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.55] text-[#3D3A34] md:mt-[9px] md:text-[13.5px] md:leading-[1.6]">
                "When a problem gives you a sum and asks for a sum of squares, square the expression you were given.
                <span className="hidden md:inline">
                  {" "}
                  The middle term is always <span className="mono text-[13px]">2</span>, so the squares fall out without ever
                  solving for the variable
                </span>
                …"
              </p>
              <div className="mt-2.5 border-t border-[#EDE9E0] pt-[9px] text-xs text-muted-foreground md:mt-3 md:pt-[11px] md:text-[12.5px]">
                Every answer opens the passage it came from.
              </div>
            </div>
            <dl className="border-b border-[#E3DFD4]">
              {PROOF.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-4 border-t border-[#E3DFD4] py-[13px] md:gap-[18px]">
                  <dt className="w-[82px] shrink-0 text-[14.5px] font-semibold tracking-[-.012em] md:w-[88px]">{k}</dt>
                  <dd className="m-0 text-[14.5px] leading-[1.5] text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── 03 · People ─────────────────────────────────────────────────── */}
      <section id="people" className="border-t border-[#E7E3D9] bg-secondary px-6 py-[60px] md:px-16 md:py-[104px]">
        <div className="mx-auto max-w-[1120px]">
          <SectionHead
            index="03"
            label="PEOPLE"
            title="Your classmates are part of the answer."
            support="The explanation that helped stays with the question."
          />
          <div
            role="img"
            aria-label="A Biology 101 thread: Amara Boateng asks why water moves toward the saltier side in osmosis, Horizon answers from Lecture 9, and Tyler Brooks and Jonas Weber add the explanations that helped."
            className="mt-7 overflow-hidden rounded-[13px] border border-input bg-white shadow-[0_1px_2px_rgba(25,24,22,.04)] md:mt-[52px] md:max-w-[980px] md:rounded-[14px]"
          >
            <div aria-hidden="true">
              <div className="flex items-center justify-between border-b border-[#EDE9E0] bg-[#FCFBF8] px-[15px] py-[13px] md:px-6 md:py-[15px]">
                <span className="text-xs text-muted-foreground md:text-[13px]">Biology 101 — Midterm 2</span>
                <span className="text-[11px] text-[var(--ink-2)] md:text-xs">42 members</span>
              </div>
              <div className="flex flex-col gap-3 px-4 py-[15px] md:gap-3.5 md:px-6 md:pb-6 md:pt-[22px]">
                <div>
                  <div className="flex items-center gap-2 md:gap-2.5">
                    <Avatar initials="AB" size={26} />
                    <span className="text-xs font-semibold tracking-[-.01em] md:text-[13.5px]">Amara Boateng</span>
                    <span className="text-[10.5px] text-[var(--ink-2)] md:text-xs">3 days ago</span>
                  </div>
                  <p className="mt-[9px] text-[15.5px] font-medium leading-[1.42] tracking-[-.014em] md:mt-[11px] md:text-[19px] md:tracking-[-.018em]">
                    Why does water move toward the saltier side in osmosis?
                  </p>
                </div>

                <div className="flex flex-col gap-2 rounded-[10px] border border-[var(--ai-border)] bg-accent px-3 py-[11px] md:flex-row md:items-center md:gap-2.5 md:px-[15px] md:py-3">
                  <div className="flex items-center gap-[7px] md:contents">
                    <HorizonLogo variant="dark" size="0.9rem" />
                    <span className="ml-auto text-[10.5px] text-[var(--ai-meta)] md:hidden">Lecture 9 · p. 6</span>
                  </div>
                  <span className="text-[12.5px] leading-[1.55] text-[var(--ai-text)] md:text-[13.5px] md:leading-[1.5]">
                    Water moves toward the side with less free water — the dissolved salt is what lowers it.
                  </span>
                  <span className="ml-auto hidden shrink-0 rounded-md border border-[#DDE7E1] bg-white px-[9px] py-1 text-[11.5px] text-[var(--ai-meta)] md:inline">
                    Lecture 9 · p. 6
                  </span>
                </div>

                {[
                  ["TB", "Tyler Brooks", "2 days ago", "The way our TA put it: water isn't chasing the salt. It's just spreading out, and there's more room on the salty side.", "12"],
                  ["JW", "Jonas Weber", "yesterday", "One thing to fix before the exam: the answer key says \"higher solute concentration,\" never \"saltier.\" Same idea, but they mark the wording.", "8"],
                ].map(([ini, name, when, body, n]) => (
                  <div key={ini} className="ml-4 rounded-[11px] border border-border bg-white px-3.5 py-[13px] md:ml-[34px] md:px-[18px] md:py-[15px]">
                    <div className="flex items-center gap-2 md:gap-[9px]">
                      <Avatar initials={ini} size={24} />
                      <span className="text-[11.5px] font-semibold tracking-[-.01em] md:text-[13px]">{name}</span>
                      <span className="hidden text-[11.5px] text-[var(--ink-2)] md:inline">{when}</span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-[1.55] text-[#3D3A34] md:mt-[9px] md:text-[14.5px] md:leading-[1.6]">{body}</p>
                    <div className="mt-2 text-[10.5px] text-[var(--ink-2)] md:hidden">{n} found this helpful</div>
                    <div className="mt-[11px] hidden items-center gap-3.5 md:flex">
                      <GhostPill className="h-[27px] px-2.5 text-xs">
                        <UpIcon />
                        {n} helpful
                      </GhostPill>
                      <span className="text-xs text-[var(--ink-2)]">Reply</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 · Your own space ─────────────────────────────────────────── */}
      <section className="border-t border-[#EBE7DE] px-6 py-[60px] md:px-16 md:py-[104px]">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead
            index="04"
            label="YOUR OWN SPACE"
            title="Take the conversation further."
            support="Fork any discussion into your own space. Explore privately, then share what helps the group."
            wide
          />
          <div className="mt-7 md:mt-[52px]">
            <SpaceDemo />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section
        id="create"
        className="flex min-h-[300px] flex-col items-center justify-center bg-[var(--dark)] px-6 py-16 md:min-h-[340px] md:px-16 md:py-[88px]"
      >
        <Reveal className="flex w-full flex-col items-center">
          <h2 className="text-center text-[34px] font-medium leading-[1.14] tracking-[-.03em] text-[#F8F6F1] md:text-[54px] md:leading-[1.1] md:tracking-[-.032em]">
            Start learning together.
          </h2>
          <Link
            to="/start"
            className="mt-[26px] inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#F8F6F1] text-[15.5px] font-medium text-[var(--dark)] transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8F6F1] md:mt-9 md:w-auto md:gap-[9px] md:rounded-[10px] md:px-[26px] md:text-base"
          >
            Create a study group <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-[18px] text-center text-[13.5px] text-[#A9A49A] md:mt-[22px] md:text-[14.5px]">
            Free for students. Bring the materials you already have.
          </p>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="flex flex-col gap-3.5 border-t border-[#2B2B27] bg-[var(--dark)] px-6 pb-7 pt-[22px] md:h-24 md:flex-row md:items-center md:justify-between md:px-16 md:py-0">
        <Link to="/" className="inline-flex min-h-11 items-center md:min-h-0" aria-label="Horizon home">
          <HorizonLogo variant="light" size="1.5rem" />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[13px] text-[#A9A49A] md:gap-7 md:text-[13.5px]">
          <a href="#product" onClick={(e) => scrollToId(e, "product")} className="inline-flex min-h-11 items-center transition-colors hover:text-[#F8F6F1] md:min-h-0">
            Product
          </a>
          <Link to="/start" className="inline-flex min-h-11 items-center transition-colors hover:text-[#F8F6F1] md:min-h-0">
            Create a study group
          </Link>
          <span className="w-full text-[12.5px] text-[#A9A49A] md:w-auto md:text-[13.5px]">© 2026 Horizon</span>
        </nav>
      </footer>
    </div>
  );
}
