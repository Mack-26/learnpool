// "02 / The product" screenshot: the group workspace — my groups, the
// question feed, and the materials panel (design/Main.html + Mobile.html).
import type { ReactNode } from "react";
import HorizonLogo from "../HorizonLogo";
import { Avatar, DocIcon, Eyebrow, GhostPill, Mockup, PrimaryPill } from "./primitives";

const GROUPS = [
  { name: "GRE Quant Prep", meta: "6 members · 24 questions", active: true },
  { name: "Biology 101 — Midterm 2", meta: "42 members · 67 questions" },
  { name: "Python Fundamentals", meta: "18 members · 31 questions" },
  { name: "Calculus I — Problem Sets", meta: "5 members · 12 questions", desktopOnly: true },
  { name: "Spanish B2 — Conversation", meta: "7 members · 19 questions" },
];

const PEOPLE = [
  ["SM", "Sarah M."],
  ["DO", "David O."],
  ["MC", "Mei-Lin C."],
  ["JW", "Jonas W."],
  ["AB", "Amara B."],
  ["TB", "Tyler B."],
];

type Q = {
  title: ReactNode;
  who: [string, string];
  replies: string;
  votes: string;
  forks?: string;
  tag: string;
  fromSpace?: boolean;
  first?: boolean;
  desktopOnly?: boolean;
};

const QUESTIONS: Q[] = [
  {
    title: (
      <>
        If <span className="mono text-[12px] md:text-[13.5px]">x + 1/x = 5</span>, what is{" "}
        <span className="mono text-[12px] md:text-[13.5px]">x² + 1/x²</span>?
      </>
    ),
    who: ["SM", "Sarah M."],
    replies: "3 replies",
    votes: "9 votes",
    forks: "2 forks",
    tag: "Quant Review",
    first: true,
  },
  { title: "When is it faster to test the answer choices than to solve?", who: ["DO", "David O."], replies: "6 replies", votes: "14 votes", tag: "Practice Test 2" },
  { title: "Problem Set 4 Q7 — why isn't the average 50?", who: ["AB", "Amara B."], replies: "4 replies", votes: "7 votes", tag: "Problem Set 4" },
  { title: "Fastest way to spot a multiple of 3 under time pressure", who: ["TB", "Tyler B."], replies: "2 replies", votes: "5 votes", tag: "Quant Review", desktopOnly: true },
  {
    title: (
      <>
        Practice Test 2 Q14 gives <span className="mono text-[12px] md:text-[13.5px]">x − 1/x</span> — what changes?
      </>
    ),
    who: ["MC", "Mei-Lin C."],
    replies: "5 replies",
    votes: "11 votes",
    tag: "Shared from a space",
    fromSpace: true,
  },
  { title: "Does the calculator ever actually save time?", who: ["JW", "Jonas W."], replies: "3 replies", votes: "8 votes", tag: "Practice Test 2", desktopOnly: true },
];

const MATERIALS = [
  { name: "Quant Review — Algebra", pages: "34 pages", cited: "cited in 18 answers", warm: true },
  { name: "Problem Set 4", pages: "8 pages", cited: "cited in 11 answers" },
  { name: "Practice Test 2", pages: "22 pages", cited: "cited in 6 answers" },
];

export default function GroupDemo() {
  return (
    <Mockup
      label="Horizon group workspace: a list of study groups on the left, the GRE Quant Prep discussion feed with six recent questions in the middle, and the group's three materials with weekly activity on the right."
      className="flex w-full max-w-[1248px] flex-col overflow-hidden rounded-[14px] border border-[#DED9CE] bg-white shadow-[0_1px_2px_rgba(25,24,22,.05),0_30px_70px_-28px_rgba(25,24,22,.20)] lg:h-[700px] lg:flex-row"
    >
      {/* sidebar / my groups */}
      <aside className="flex shrink-0 flex-col gap-[18px] border-b border-[#EDE9E0] bg-[#FAF9F5] px-3.5 py-[18px] lg:w-[224px] lg:border-b-0 lg:border-r">
        <div className="hidden px-1.5 lg:block">
          <HorizonLogo variant="dark" size="1.25rem" />
        </div>
        <Eyebrow className="px-2.5">MY GROUPS</Eyebrow>
        <nav className="-mt-2 flex flex-col gap-[3px]">
          {GROUPS.map((g) => (
            <span
              key={g.name}
              className={`block rounded-[7px] px-2.5 py-2 text-[12.5px] leading-[1.3] ${
                g.active
                  ? "bg-[#EDF1EE] font-medium text-primary"
                  : "text-[#3D3A34] transition-colors hover:bg-[var(--hover-row)]"
              } ${g.desktopOnly ? "hidden lg:block" : ""}`}
            >
              {g.name}
              <span className={`block text-[11px] font-normal ${g.active ? "text-[var(--ai-meta)]" : "text-[var(--ink-2)]"}`}>
                {g.meta}
              </span>
            </span>
          ))}
        </nav>
        <div className="hidden border-t border-[#EDE9E0] pt-4 lg:block">
          <Eyebrow className="px-2.5">PEOPLE</Eyebrow>
          <div className="mt-2.5 flex flex-col gap-[9px] px-2.5">
            {PEOPLE.map(([i, n]) => (
              <span key={i} className="flex items-center gap-2 text-xs text-[#3D3A34]">
                <Avatar initials={i} size={21} />
                {n}
              </span>
            ))}
          </div>
        </div>
        <GhostPill className="mt-auto hidden h-8 text-[12.5px] text-foreground lg:inline-flex">New study group</GhostPill>
      </aside>

      <div className="flex min-w-0 grow flex-col">
        {/* group header + tabs (tablet+) */}
        <div className="hidden shrink-0 px-7 pt-5 md:block">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[22px] font-semibold tracking-[-.022em]">GRE Quant Prep</h3>
              <div className="mt-[5px] text-xs text-[var(--ink-2)]">6 members · 24 questions · 3 materials</div>
            </div>
            <PrimaryPill className="h-8 px-[13px] text-[12.5px]">Ask the group</PrimaryPill>
          </div>
          <div className="mt-4 flex gap-[22px] border-b border-[#EDE9E0] text-[13px]">
            <span className="border-b-2 border-primary pb-2.5 font-medium text-foreground">Discussion</span>
            <span className="pb-2.5 text-[var(--ink-2)]">Materials</span>
            <span className="pb-2.5 text-[var(--ink-2)]">My space</span>
            <span className="pb-2.5 text-[var(--ink-2)]">People</span>
          </div>
        </div>

        <div className="flex min-h-0 grow flex-col lg:flex-row">
          {/* question feed */}
          <div className="flex min-w-0 grow flex-col gap-0.5 px-2 pb-3 pt-2 md:px-5 md:pb-5 md:pl-7 md:pt-3.5">
            <div className="hidden items-center justify-between px-1.5 pb-2 md:flex">
              <Eyebrow>24 QUESTIONS · THIS WEEK</Eyebrow>
              <span className="text-[11.5px] text-[var(--ink-2)]">Most recent</span>
            </div>
            {QUESTIONS.map((q, idx) => (
              <span
                key={idx}
                className={`block rounded-[9px] px-[11px] py-3 text-foreground transition-colors hover:bg-[var(--hover-row)] md:px-3.5 md:py-[13px] ${
                  q.first ? "border border-border bg-white" : ""
                } ${q.desktopOnly ? "hidden lg:block" : ""}`}
              >
                <div className="text-[13px] font-medium leading-[1.4] tracking-[-.012em] md:text-[14.5px]">{q.title}</div>
                <div className="mt-[7px] flex items-center gap-2.5 text-[10.5px] text-[var(--ink-2)] md:gap-[13px] md:text-[11.5px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="hidden md:inline-flex">
                      <Avatar initials={q.who[0]} size={18} />
                    </span>
                    {q.who[1]}
                  </span>
                  <span>{q.replies}</span>
                  <span>{q.votes}</span>
                  {q.forks && <span className="hidden md:inline">{q.forks}</span>}
                  <span
                    className={`ml-auto hidden rounded-[5px] px-[7px] py-0.5 md:inline ${
                      q.fromSpace ? "bg-[#EDF1EE] text-[var(--ai-meta)]" : "bg-[var(--chip)] text-[#5E5342]"
                    }`}
                  >
                    {q.tag}
                  </span>
                </div>
              </span>
            ))}
          </div>

          {/* materials panel */}
          <div className="shrink-0 border-t border-[#EDE9E0] bg-[#FCFBF8] px-[15px] py-3.5 lg:w-[306px] lg:border-l lg:border-t-0 lg:px-[22px] lg:pb-5 lg:pt-[22px]">
            <Eyebrow>GROUP MATERIALS</Eyebrow>
            <div className="mt-2.5 flex flex-col gap-2 lg:mt-3.5 lg:gap-2.5">
              {MATERIALS.map((m) => (
                <div
                  key={m.name}
                  className={`flex items-start gap-[9px] lg:rounded-[9px] lg:border lg:bg-white lg:px-3.5 lg:py-[13px] ${
                    m.warm ? "lg:border-[#E7DFCD]" : "lg:border-[#EAE6DD]"
                  }`}
                >
                  <DocIcon />
                  <div className="min-w-0 text-xs lg:text-[12.5px]">
                    <span className="font-normal leading-[1.35] lg:block lg:font-medium">{m.name}</span>
                    <span className="text-[var(--ink-2)] lg:mt-1 lg:block lg:text-[11px]">
                      <span className="lg:hidden"> · {m.pages}</span>
                      <span className="hidden lg:inline">
                        {m.pages} · {m.cited}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <GhostPill className="mt-3 hidden h-[34px] w-full rounded-lg border-dashed border-[#DCD6C9] text-[12.5px] lg:inline-flex">
              Add material
            </GhostPill>
            <div className="mt-6 hidden border-t border-[#EDE9E0] pt-[18px] lg:block">
              <Eyebrow>THIS WEEK</Eyebrow>
              <div className="mt-3 flex flex-col gap-[9px] text-[12.5px] text-[#3D3A34]">
                {[
                  ["Questions asked", "24"],
                  ["Answered from materials", "21"],
                  ["Replies from the group", "38"],
                  ["Shared back from spaces", "6"],
                ].map(([k, v]) => (
                  <span key={k} className="flex justify-between">
                    {k} <span className="text-[var(--ink-2)]">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Mockup>
  );
}
