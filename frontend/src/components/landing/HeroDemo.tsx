// Hero product preview: a GRE Quant Prep discussion thread (design/Main.html
// hero, design/Mobile.html hero card). Static markup only.
import type { ReactNode } from "react";
import HorizonLogo from "../HorizonLogo";
import { Avatar, Eyebrow, GhostPill, MaterialChip, Mockup, PrimaryPill, UpIcon } from "./primitives";

const MATERIALS = [
  { name: "Quant Review — Algebra", pages: "34 pages" },
  { name: "Problem Set 4", pages: "8 pages" },
  { name: "Practice Test 2", pages: "22 pages" },
];

function SidebarNav({ label, count, active = false }: { label: string; count: string; active?: boolean }) {
  return (
    <span
      className={`flex h-8 items-center justify-between rounded-[7px] px-2.5 text-[13px] ${
        active ? "bg-[#EDF1EE] font-medium text-primary" : "text-muted-foreground transition-colors hover:bg-[var(--hover-row)]"
      }`}
    >
      {label}
      <span className={`text-[11.5px] ${active ? "text-[var(--ai-meta)]" : "text-[var(--ink-2)]"}`}>{count}</span>
    </span>
  );
}

function Cite({ n, children }: { n: string; children: ReactNode }) {
  return (
    <span className="inline-flex h-[27px] items-center gap-1.5 rounded-md border border-[#DDE7E1] bg-white px-2.5 text-[11.5px] text-[var(--ai-text)]">
      <span className="font-semibold text-[var(--ai-meta)]">[{n}]</span>
      {children}
    </span>
  );
}

export default function HeroDemo() {
  return (
    <Mockup
      label="Horizon study group thread: Sarah Mehta asks a GRE algebra question, Horizon answers from the group's materials with two cited passages, and classmates reply below."
      className="flex w-full max-w-[1248px] flex-col overflow-hidden rounded-[14px] border border-input bg-white shadow-[0_1px_2px_rgba(25,24,22,.05),0_30px_70px_-28px_rgba(25,24,22,.20)] lg:h-[756px]"
    >
      {/* browser chrome */}
      <div className="hidden h-10 shrink-0 items-center border-b border-[#EAE6DD] bg-[#F7F6F2] px-3.5 md:flex">
        <div className="flex w-[200px] gap-1.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[#DCD6C9]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#DCD6C9]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#DCD6C9]" />
        </div>
        <span className="mono grow text-center text-[11.5px] tracking-[-.01em] text-[var(--ink-2)]">
          horizon.study/groups/quant-prep
        </span>
        <span className="w-[200px]" />
      </div>

      <div className="flex min-h-0 grow">
        {/* sidebar */}
        <aside className="hidden w-[236px] shrink-0 flex-col gap-5 border-r border-[#EDE9E0] bg-[#FAF9F5] px-3.5 py-[18px] lg:flex">
          <div className="px-1.5">
            <HorizonLogo variant="dark" size="1.25rem" />
          </div>
          <div className="rounded-[9px] border border-[#EAE6DD] bg-white px-2.5 pb-[11px] pt-2.5">
            <div className="text-[13.5px] font-semibold tracking-[-.012em]">GRE Quant Prep</div>
            <div className="mt-[3px] text-[11.5px] leading-[1.45] text-[var(--ink-2)]">
              6 members · 24 questions
              <br />3 materials
            </div>
          </div>
          <nav className="flex flex-col gap-px">
            <SidebarNav label="Discussion" count="24" active />
            <SidebarNav label="Materials" count="3" />
            <SidebarNav label="My space" count="4" />
            <SidebarNav label="People" count="6" />
          </nav>
          <div className="border-t border-[#EDE9E0] pt-4">
            <Eyebrow className="px-2.5">MATERIALS</Eyebrow>
            <div className="mt-[9px] flex flex-col gap-0.5">
              {MATERIALS.map((m) => (
                <span
                  key={m.name}
                  className="block rounded-[7px] px-2.5 py-[7px] text-[12.5px] leading-[1.35] text-foreground transition-colors hover:bg-[var(--hover-row)]"
                >
                  {m.name}
                  <span className="block text-[11px] text-[var(--ink-2)]">{m.pages}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-[7px] px-1.5">
            <Avatar initials="SM" />
            <Avatar initials="DO" />
            <Avatar initials="MC" />
            <Avatar initials="JW" />
            <span className="text-[11.5px] text-[var(--ink-2)]">+2</span>
          </div>
        </aside>

        {/* main column */}
        <div className="flex min-w-0 grow flex-col">
          {/* compact group header (phone) */}
          <div className="border-b border-[#EDE9E0] bg-[#FAF9F5] px-[15px] py-[13px] md:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-[-.015em]">GRE Quant Prep</span>
              <span className="text-[11px] text-[var(--ink-2)]">6 members</span>
            </div>
            <div className="mt-[3px] text-[11px] text-[var(--ink-2)]">24 questions · 3 materials</div>
            <div className="mt-[9px] flex flex-wrap gap-1.5">
              {MATERIALS.map((m) => (
                <span
                  key={m.name}
                  className="inline-flex h-[23px] items-center rounded-md border border-[#E7DFCD] bg-[var(--chip)] px-2 text-[10.5px] text-[#5E5342]"
                >
                  {m.name.replace(" — Algebra", "")}
                </span>
              ))}
            </div>
          </div>

          {/* thread header (tablet+) */}
          <div className="hidden shrink-0 px-[26px] pt-[18px] md:block">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-semibold tracking-[-.02em]">Squaring a sum to get squares</h2>
                <div className="mt-[5px] text-xs text-[var(--ink-2)]">Sarah Mehta · 2 days ago · 3 replies</div>
              </div>
              <div className="flex items-center gap-2">
                <GhostPill className="h-[30px] px-[11px] text-[12.5px] text-foreground">Fork to my space</GhostPill>
                <GhostPill className="h-[30px] px-[11px] text-[12.5px] text-foreground">Invite</GhostPill>
              </div>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-[7px] border-b border-[#EDE9E0] pb-3.5">
              {MATERIALS.map((m) => (
                <MaterialChip key={m.name}>{m.name}</MaterialChip>
              ))}
            </div>
          </div>

          {/* conversation */}
          <div className="flex min-h-0 grow flex-col gap-[11px] overflow-hidden px-[15px] pt-3.5 md:gap-3.5 md:px-[26px] md:pt-[18px]">
            <article className="rounded-[11px] border border-border bg-white px-[13px] py-3 md:px-[17px] md:py-[15px]">
              <div className="flex items-center gap-2 md:gap-[9px]">
                <Avatar initials="SM" size={25} />
                <span className="text-[13px] font-semibold tracking-[-.01em]">Sarah Mehta</span>
                <span className="text-[11.5px] text-[var(--ink-2)]">2 days ago</span>
              </div>
              <p className="mt-[11px] text-[14px] leading-[1.5] tracking-[-.011em] text-foreground md:text-base">
                If <span className="mono text-[13px] md:text-[15px]">x + 1/x = 5</span>, what is{" "}
                <span className="mono text-[13px] md:text-[15px]">x² + 1/x²</span>? I keep trying to solve for x first.
              </p>
              <div className="mt-3 flex items-center gap-4">
                <GhostPill className="h-[26px] px-[9px] text-[11.5px]">
                  <UpIcon />9
                </GhostPill>
                <span className="text-[11.5px] text-[var(--ink-2)]">3 replies</span>
                <span className="text-[11.5px] text-[var(--ink-2)]">2 forks</span>
              </div>
            </article>

            <article className="rounded-[11px] border border-[var(--ai-border)] bg-accent px-[13px] py-3 md:px-[17px] md:py-[15px]">
              <div className="flex items-center gap-2 md:gap-[9px]">
                <HorizonLogo variant="dark" size="1rem" />
                <span className="text-[11.5px] text-[var(--ai-meta)]">From this group's materials</span>
              </div>
              <p className="mt-[11px] text-[13px] leading-[1.62] text-[var(--ai-text)] md:text-[14.5px]">
                You don't need x. Square what you were given — the cross terms collapse:
                <span className="font-medium text-[var(--ai-meta)]"> [1]</span>
              </p>
              <div className="mono mt-2.5 rounded-[7px] border border-[#E1EAE5] bg-white px-3 py-2.5 text-[11px] leading-[1.7] text-[var(--ai-text)] md:text-[12.5px]">
                (x + 1/x)² = x² + 2 + 1/x² = 25
                <br />
                x² + 1/x² = 23
              </div>
              <p className="mt-[11px] hidden text-[14.5px] leading-[1.62] text-[var(--ai-text)] md:block">
                Your notes call this the sum-and-square pattern: whenever you're handed a sum and asked for squares,
                square the sum first.<span className="font-medium text-[var(--ai-meta)]"> [2]</span>
              </p>
              <div className="mt-[13px] flex flex-wrap items-center gap-2">
                <Cite n="1">
                  Quant Review — Algebra <span className="text-[var(--ink-2)]">· p. 12 · 96% match</span>
                </Cite>
                <Cite n="2">
                  Problem Set 4 <span className="text-[var(--ink-2)]">· p. 2 · 91% match</span>
                </Cite>
              </div>
            </article>

            <article className="ml-[18px] rounded-[11px] border border-border bg-white px-[13px] py-3 md:ml-[34px] md:px-[17px] md:py-3.5">
              <div className="flex items-center gap-2 md:gap-[9px]">
                <Avatar initials="DO" size={23} />
                <span className="text-[12.5px] font-semibold tracking-[-.01em]">David Okonkwo</span>
                <span className="text-[11.5px] text-[var(--ink-2)]">yesterday</span>
              </div>
              <p className="mt-[9px] text-[12.5px] leading-[1.6] text-[#3D3A34] md:text-sm">
                I got 23 by substitution, but it took me four minutes. Squaring the sum is the move on test day — I've
                stopped solving for x entirely.
              </p>
              <div className="mt-[11px] flex items-center gap-3.5">
                <GhostPill className="h-[25px] px-[9px] text-[11.5px]">
                  <UpIcon />7
                </GhostPill>
                <span className="text-[11.5px] text-[var(--ink-2)]">Reply</span>
              </div>
            </article>

            <article className="ml-[34px] hidden rounded-t-[11px] border border-b-0 border-border bg-white px-[17px] pt-3.5 lg:block">
              <div className="flex items-center gap-[9px]">
                <Avatar initials="MC" size={23} />
                <span className="text-[12.5px] font-semibold tracking-[-.01em]">Mei-Lin Chen</span>
                <span className="text-[11.5px] text-[var(--ink-2)]">6 hours ago</span>
              </div>
              <p className="mt-[9px] pb-4 text-sm leading-[1.6] text-[#3D3A34]">
                Practice Test 2 Q14 is the same question with <span className="mono text-[13px]">x − 1/x</span> instead —
                watch the sign.
              </p>
            </article>
          </div>

          {/* composer */}
          <div className="shrink-0 border-t border-[#EDE9E0] bg-white px-[15px] pb-3.5 pt-3 md:border-t-0 md:px-[26px] md:pb-[18px] md:pt-3.5">
            <div className="flex h-[42px] items-center gap-2 rounded-[10px] border border-input bg-white py-0 pl-[13px] pr-2 shadow-[0_1px_2px_rgba(25,24,22,.04)] md:h-[46px] md:gap-2.5 md:rounded-[11px] md:pl-3.5">
              <span className="grow truncate text-[12.5px] text-[var(--ink-2)] md:text-sm">Ask the group…</span>
              <GhostPill className="hidden h-[30px] w-[30px] md:inline-flex">
                <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M7 2.5v9M2.5 7h9" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </GhostPill>
              <PrimaryPill className="h-7 px-[11px] text-[11.5px] md:h-8 md:px-3.5 md:text-[12.5px]">Ask Horizon</PrimaryPill>
            </div>
          </div>
        </div>
      </div>
    </Mockup>
  );
}
