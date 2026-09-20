// "04 / Your own space": a shared Python Fundamentals thread, its private
// fork, and the note David shares back (design/Main.html + Mobile.html).
import HorizonLogo from "../HorizonLogo";
import { Avatar, ForkIcon, GhostPill, LockIcon, Mockup, PrimaryPill, UpIcon } from "./primitives";

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-[7px] py-3.5 md:hidden" aria-hidden="true">
      <span className="mono text-[9px] tracking-[.08em] text-[var(--ink-2)]">{label}</span>
      <svg width="10" height="34" viewBox="0 0 10 34">
        <path d="M5 0v26" stroke="#CFC9BC" strokeWidth="1.3" strokeDasharray="4 4" />
        <path d="M1.5 26 5 32l3.5-6z" fill="#CFC9BC" />
      </svg>
    </div>
  );
}

export default function SpaceDemo() {
  return (
    <Mockup label="Forking a discussion: David's shared question about Python's range() is forked into a private space, explored with follow-ups, then shared back to the group as a note.">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* shared thread */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-input bg-white md:grow md:basis-0">
          <div className="flex items-center justify-between border-b border-[#EDE9E0] bg-[#FCFBF8] px-3.5 py-[11px] md:px-4 md:py-3">
            <span className="text-[11.5px] font-medium text-[#3D3A34] md:text-xs">Python Fundamentals</span>
            <span className="mono text-[9px] tracking-[.08em] text-[var(--ink-2)] md:text-[9.5px]">SHARED</span>
          </div>
          <div className="flex flex-col gap-2.5 p-3.5 md:gap-[11px] md:p-4">
            <div className="hidden items-center gap-2 md:flex">
              <Avatar initials="DO" />
              <span className="text-[12.5px] font-semibold">David Okonkwo</span>
            </div>
            <p className="text-[13.5px] leading-[1.45] tracking-[-.01em] md:text-[14.5px] md:leading-[1.5]">
              Why does <span className="mono text-[12.5px] md:text-[13.5px]">range(1, 5)</span> stop at 4?
            </p>
            <div className="hidden rounded-[9px] border border-[var(--ai-border)] bg-accent px-3.5 py-3 md:block">
              <div className="flex items-center gap-[7px]">
                <HorizonLogo variant="dark" size="0.9rem" />
                <span className="text-[11px] text-[var(--ai-meta)]">Loops &amp; Ranges · p. 3</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.55] text-[var(--ai-text)]">
                The stop value is where the range ends, not a number it includes — so you get 1, 2, 3, 4…
              </p>
            </div>
            <div className="flex flex-col gap-2.5 md:mt-0.5 md:flex-row md:items-center md:gap-[9px]">
              <span className="text-[11px] text-[var(--ink-2)] md:text-[11.5px]">
                4 replies <span className="md:hidden">· </span>
                <span className="hidden md:inline-block md:w-2" />
                12 votes
              </span>
              <PrimaryPill className="h-10 rounded-[9px] text-[12.5px] md:ml-auto md:h-[30px] md:rounded-[7px] md:px-3 md:text-xs">
                <ForkIcon />
                Fork to my space
              </PrimaryPill>
            </div>
          </div>
        </div>

        <ArrowDown label="FORK" />
        <div className="hidden w-24 shrink-0 flex-col items-center justify-center gap-2.5 md:flex" aria-hidden="true">
          <span className="mono text-[9px] tracking-[.08em] text-[var(--ink-2)]">FORK</span>
          <svg width="76" height="10" viewBox="0 0 76 10">
            <path d="M0 5h68" stroke="#CFC9BC" strokeWidth="1.3" strokeDasharray="4 4" />
            <path d="M68 1.5 74 5l-6 3.5z" fill="#CFC9BC" />
          </svg>
        </div>

        {/* private space */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#D6D0C2] bg-white shadow-[0_1px_2px_rgba(25,24,22,.04),0_18px_40px_-24px_rgba(25,24,22,.20)] md:grow md:basis-0">
          <div className="flex items-center justify-between border-b border-[#EDE9E0] bg-[#FAF9F5] px-3.5 py-[11px] md:px-4 md:py-3">
            <span className="inline-flex items-center gap-[7px] text-[11.5px] font-medium text-[#3D3A34] md:text-xs">
              <LockIcon />
              My space
            </span>
            <span className="mono text-[9px] tracking-[.08em] text-[var(--ink-2)] md:text-[9.5px]">PRIVATE</span>
          </div>
          <div className="flex flex-col gap-2.5 p-3.5 md:gap-[11px] md:p-4">
            <div className="hidden text-[11.5px] text-[var(--ink-2)] md:block">
              Forked from <span className="text-[#3D3A34]">Why range(1, 5) stops at 4</span>
            </div>
            <p className="text-[13.5px] leading-[1.45] tracking-[-.01em] md:text-sm md:leading-[1.5]">
              So how do I get 1 through 5 when the end comes from a variable?
            </p>
            <div className="rounded-[9px] border border-border bg-[#FCFBF8] px-3 py-[11px] md:px-3.5 md:py-3">
              <p className="text-[12.5px] leading-[1.55] text-[#3D3A34]">
                Add one to the stop value: <span className="mono text-xs">range(1, n + 1)</span>. The same rule is why{" "}
                <span className="mono text-xs">len(list)</span> works as a stop
                <span className="hidden md:inline"> without going out of bounds</span>.
              </p>
              <div className="mt-[7px] text-[10.5px] text-[var(--ink-2)] md:mt-2 md:text-[11px]">
                Loops &amp; Ranges · p. 3<span className="hidden md:inline">&nbsp;&nbsp;·&nbsp;&nbsp;Exercises 2 · p. 1</span>
              </div>
            </div>
            <div className="hidden text-xs text-[var(--ink-2)] md:block">+ 2 more follow-ups in this space</div>
            <div className="flex flex-col gap-2.5 md:mt-0.5 md:flex-row md:items-center md:gap-[9px]">
              <span className="inline-flex items-center gap-2 text-[11.5px] text-[#3D3A34]">
                <span className="inline-flex h-[13px] w-[13px] items-center justify-center rounded-[3px] bg-primary">
                  <svg width="9" height="7" viewBox="0 0 9 7">
                    <path d="M1 3.5 3.4 6 8 1" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                Include my questions
              </span>
              <GhostPill className="h-10 rounded-[9px] border-[#C8C1B1] text-[12.5px] font-medium text-foreground md:ml-auto md:h-[30px] md:rounded-[7px] md:px-3 md:text-xs">
                Share with the group
              </GhostPill>
            </div>
          </div>
        </div>
      </div>

      <ArrowDown label="SHARED BACK" />
      <div className="mt-9 hidden justify-end md:flex" aria-hidden="true">
        <svg width="34" height="44" viewBox="0 0 34 44" className="mr-[22%]">
          <path d="M33 0v26a8 8 0 0 1-8 8H8" stroke="#CFC9BC" strokeWidth="1.3" fill="none" strokeDasharray="4 4" />
          <path d="M8 30.5 1.5 34 8 37.5z" fill="#CFC9BC" />
        </svg>
      </div>

      {/* shared-back note */}
      <div className="rounded-xl border border-[var(--ai-border)] bg-white px-4 py-[15px] md:-mt-2 md:max-w-[700px] md:px-5 md:py-[18px]">
        <div className="flex items-center gap-2 md:gap-2.5">
          <Avatar initials="DO" size={25} />
          <span className="text-[12.5px] font-semibold md:text-[13px]">
            David shared a note<span className="hidden md:inline"> from his space</span>
          </span>
          <span className="ml-auto rounded-[5px] bg-[#EDF1EE] px-2 py-[3px] text-[10.5px] text-[var(--ai-meta)] md:ml-0 md:text-[11px]">
            From a <span className="hidden md:inline">private </span>space
          </span>
          <span className="ml-auto hidden text-[11.5px] text-[var(--ink-2)] md:inline">3 exchanges</span>
        </div>
        <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[#3D3A34] md:mt-[11px] md:text-[14.5px] md:leading-[1.6]">
          <span className="font-medium">Off-by-one, once and for all.</span> Why the stop value is excluded, and the two
          places in Exercises 2 where it bites.
        </p>
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--ink-2)] md:mt-3 md:gap-3.5 md:text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 md:text-[#3D3A34]">
            <span className="hidden md:inline-flex">
              <UpIcon />
            </span>
            14 votes
          </span>
          <span>6 replies</span>
          <span className="md:hidden">3 exchanges</span>
        </div>
      </div>
    </Mockup>
  );
}
