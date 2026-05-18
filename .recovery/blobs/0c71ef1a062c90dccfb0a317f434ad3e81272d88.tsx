"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronRight, Search, Sparkles, X } from "lucide-react";
import { JOB_TAXONOMY } from "@/lib/jobTaxonomy";

type LandingMegaMenuMobileProps = {
  onNavigate?: () => void;
};

type LandingMegaMenuSection = {
  id: string;
  label: string;
  href: string;
  totalLeaves: number;
  subgroups: Array<{
    id: string;
    label: string;
    href: string;
    leaves: Array<{
      id: string;
      label: string;
      href: string;
    }>;
  }>;
};

type SearchResult = {
  id: string;
  label: string;
  href: string;
  breadcrumb: string;
  depth: "root" | "subgroup" | "leaf";
};

function toJobsHref(categoryId?: string) {
  if (!categoryId) return "/jobs";
  return `/jobs?category=${encodeURIComponent(categoryId)}`;
}

function buildSections(): LandingMegaMenuSection[] {
  return JOB_TAXONOMY.roots.map((root) => ({
    id: root.id,
    label: root.label,
    href: toJobsHref(root.id),
    totalLeaves: root.children.reduce((count, subgroup) => count + subgroup.children.length, 0),
    subgroups: root.children.map((subgroup) => ({
      id: subgroup.id,
      label: subgroup.label,
      href: toJobsHref(subgroup.id),
      leaves: subgroup.children.map((leaf) => ({
        id: leaf.id,
        label: leaf.label,
        href: toJobsHref(leaf.id),
      })),
    })),
  }));
}

const MENU_SECTIONS = buildSections();

// Flat list of all searchable items built once
const ALL_SEARCH_ITEMS: SearchResult[] = MENU_SECTIONS.flatMap((root) => [
  { id: root.id, label: root.label, href: root.href, breadcrumb: root.label, depth: "root" as const },
  ...root.subgroups.flatMap((sub) => [
    { id: sub.id, label: sub.label, href: sub.href, breadcrumb: `${root.label} › ${sub.label}`, depth: "subgroup" as const },
    ...sub.leaves.map((leaf) => ({
      id: leaf.id,
      label: leaf.label,
      href: leaf.href,
      breadcrumb: `${root.label} › ${sub.label} › ${leaf.label}`,
      depth: "leaf" as const,
    })),
  ]),
]);

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-slate-950 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function LandingMegaMenu({ align = "left" }: { align?: "left" | "right" | "center" }) {
  const [open, setOpen] = useState(false);
  const [activeRootId, setActiveRootId] = useState(MENU_SECTIONS[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const activeSection = useMemo(
    () => MENU_SECTIONS.find((s) => s.id === activeRootId) ?? MENU_SECTIONS[0],
    [activeRootId],
  );

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_SEARCH_ITEMS.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 24);
  }, [query]);

  const isSearching = query.trim().length > 0;

  function handleClose() {
    setOpen(false);
    setQuery("");
  }

  if (!activeSection) return null;

  return (
    <div
      className="relative hidden md:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setQuery(""); }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:text-slate-950"
        onClick={() => { setOpen((c) => !c); setTimeout(() => searchRef.current?.focus(), 80); }}
        onFocus={() => setOpen(true)}
      >
        Browse Categories
        <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={clsx(
              "top-[calc(100%+1rem)] z-[70] w-[min(1120px,calc(100vw-2rem))]",
              align === "right" ? "absolute right-0" : "",
              align === "center" ? "absolute left-1/2 -translate-x-1/2" : "",
              align === "left" ? "absolute left-0" : "",
            )}
            style={
              align === "right"
                ? {
                    position: "fixed",
                    top: "calc(4rem + 1rem)",
                    right: "1rem",
                    width: "min(1120px, calc(100vw - 2rem))",
                  }
                : undefined
            }
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_44px_rgba(15,23,42,0.08)]">

              {/* Search bar */}
              <div className="mb-4 flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories, specialties…"
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  aria-label="Search categories"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-full p-0.5 text-slate-400 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Search results */}
              {isSearching ? (
                <div className="rounded-[1.7rem] border border-slate-200 bg-white px-4 py-4">
                  {searchResults.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
                  ) : (
                    <>
                      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                      </p>
                      <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                        {searchResults.map((result) => (
                          <Link
                            key={result.id}
                            href={result.href}
                            onClick={handleClose}
                            className="flex flex-col rounded-[1rem] px-4 py-3 transition hover:bg-slate-50"
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {highlight(result.label, query)}
                            </span>
                            <span className="mt-0.5 text-xs text-slate-400 truncate">{result.breadcrumb}</span>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <Link
                          href={`/jobs?search=${encodeURIComponent(query)}`}
                          onClick={handleClose}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Search className="h-4 w-4" />
                          Search jobs for &ldquo;{query}&rdquo;
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Normal two-panel layout */
                <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-4 text-slate-900 flex flex-col">
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <Sparkles className="h-4 w-4" />
                      Categories
                    </div>
                    <div className="overflow-y-auto max-h-[min(520px,60vh)] space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {MENU_SECTIONS.map((section) => {
                        const active = section.id === activeSection.id;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            className={clsx(
                              "flex w-full items-center justify-between rounded-[1.15rem] px-4 py-2.5 text-left transition-all",
                              active ? "bg-white text-slate-950 shadow-sm" : "text-slate-700 hover:bg-white",
                            )}
                            onMouseEnter={() => setActiveRootId(section.id)}
                            onFocus={() => setActiveRootId(section.id)}
                            onClick={() => setActiveRootId(section.id)}
                          >
                            <div>
                              <div className="text-sm font-semibold">{section.label}</div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {section.totalLeaves} specialties
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-slate-200 bg-white px-8 py-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)] overflow-y-auto max-h-[min(560px,65vh)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                          Explore {activeSection.label}
                        </div>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                          Browse categories fast
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                          Open a domain, jump into a subcategory, or go straight to a specialization.
                        </p>
                      </div>
                      <Link
                        href={activeSection.href}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Browse {activeSection.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {activeSection.subgroups.slice(0, 6).map((subgroup) => (
                        <div key={subgroup.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4">
                          <Link
                            href={subgroup.href}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:underline hover:underline-offset-4"
                          >
                            {subgroup.label}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {subgroup.leaves.slice(0, 5).map((leaf) => (
                              <Link
                                key={leaf.id}
                                href={leaf.href}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                              >
                                {leaf.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                      <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        Browse all jobs
                      </Link>
                      <a
                        href="#categories"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        See landing categories
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LandingMegaMenuMobile({ onNavigate }: LandingMegaMenuMobileProps) {
  const [open, setOpen] = useState(false);
  const [expandedRootId, setExpandedRootId] = useState<string | null>(MENU_SECTIONS[0]?.id ?? null);
  const [query, setQuery] = useState("");

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_SEARCH_ITEMS.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 16);
  }, [query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-[1rem] px-3 py-2 text-left text-sm font-semibold text-slate-900"
        onClick={() => setOpen((current) => !current)}
      >
        <span>Browse Categories</span>
        <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile search */}
            <div className="mt-3 flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories…"
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isSearching ? (
              <div className="mt-2 space-y-1">
                {searchResults.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
                ) : (
                  <>
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => { setQuery(""); onNavigate?.(); }}
                        className="flex flex-col rounded-[0.9rem] px-3 py-2.5 transition hover:bg-slate-50"
                      >
                        <span className="text-sm font-semibold text-slate-900">{highlight(result.label, query)}</span>
                        <span className="text-xs text-slate-400 truncate">{result.breadcrumb}</span>
                      </Link>
                    ))}
                    <Link
                      href={`/jobs?search=${encodeURIComponent(query)}`}
                      onClick={() => { setQuery(""); onNavigate?.(); }}
                      className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search jobs for &ldquo;{query}&rdquo;
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {MENU_SECTIONS.map((section) => {
                  const expanded = expandedRootId === section.id;
                  return (
                    <div key={section.id} className="rounded-[1rem] border border-slate-200 bg-slate-50 p-2.5">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-[0.85rem] px-2 py-2 text-left"
                        onClick={() => setExpandedRootId((current) => (current === section.id ? null : section.id))}
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-950">{section.label}</div>
                          <div className="mt-1 text-xs text-slate-500">{section.totalLeaves} specialties</div>
                        </div>
                        <ChevronRight className={clsx("h-4 w-4 text-slate-500 transition-transform", expanded && "rotate-90")} />
                      </button>

                      <AnimatePresence initial={false}>
                        {expanded ? (
                          <motion.div
                            className="overflow-hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <div className="mt-2 space-y-2 px-2 pb-1">
                              {section.subgroups.slice(0, 5).map((subgroup) => (
                                <Link
                                  key={subgroup.id}
                                  href={subgroup.href}
                                  className="flex items-center justify-between rounded-[0.9rem] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:text-slate-950"
                                  onClick={onNavigate}
                                >
                                  <span>{subgroup.label}</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              ))}
                              <Link
                                href={section.href}
                                className="inline-flex items-center gap-2 px-1 pt-1 text-sm font-semibold text-slate-900"
                                onClick={onNavigate}
                              >
                                View all {section.label}
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
