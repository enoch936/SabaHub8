"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronRight, Sparkles, Search, X } from "lucide-react";
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

function toJobsHref(categoryId?: string) {
  if (!categoryId) {
    return "/jobs";
  }
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

export default function LandingMegaMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeRootId, setActiveRootId] = useState(MENU_SECTIONS[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");

  const activeSection = useMemo(
    () => MENU_SECTIONS.find((section) => section.id === activeRootId) ?? MENU_SECTIONS[0],
    [activeRootId],
  );

  // Filter logic for search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return MENU_SECTIONS;
    
    const query = searchQuery.toLowerCase();
    return MENU_SECTIONS.map((section) => ({
      ...section,
      subgroups: section.subgroups
        .map((subgroup) => ({
          ...subgroup,
          leaves: subgroup.leaves.filter((leaf) =>
            leaf.label.toLowerCase().includes(query)
          ),
        }))
        .filter(
          (subgroup) =>
            subgroup.label.toLowerCase().includes(query) ||
            subgroup.leaves.length > 0
        ),
    })).filter(
      (section) =>
        section.label.toLowerCase().includes(query) ||
        section.subgroups.length > 0
    );
  }, [searchQuery]);

  const displayedSections = searchQuery.trim() ? filteredSections : MENU_SECTIONS;
  const displayedActiveSection = searchQuery.trim()
    ? displayedSections[0]
    : activeSection;

  if (!displayedActiveSection && !searchQuery.trim()) {
    return null;
  }

  const isTouchDevice = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  };

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div
      className="-my-3 py-3 md:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-100"
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
      >
        Browse Categories
        <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed left-1/2 top-20 z-[70] max-h-[calc(100vh-7rem)] w-[min(1120px,calc(100vw-2rem))] -translate-x-1/2 pt-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_40px_80px_rgba(15,23,42,0.18)]">
              {/* Search Bar */}
              <div className="mb-4 flex items-center gap-2 rounded-[1.2rem] border border-slate-200 bg-gray-50 px-4 py-3">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search categories, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-500 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 transition"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-4 text-slate-900 overflow-y-auto max-h-[calc(100vh-16rem)]">
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <Sparkles className="h-4 w-4" />
                    Categories
                  </div>
                  <div className="space-y-2">
                    {displayedSections.map((section) => {
                      const active = section.id === displayedActiveSection.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          className={clsx(
                            "flex w-full items-center justify-between rounded-[1.15rem] px-4 py-3 text-left transition-all active:scale-95 cursor-pointer",
                            active ? "bg-white text-slate-950 shadow-md" : "text-slate-700 hover:bg-gray-100",
                          )}
                          onMouseEnter={() => setActiveRootId(section.id)}
                          onFocus={() => setActiveRootId(section.id)}
                          onTouchStart={() => setActiveRootId(section.id)}
                          onClick={() => setActiveRootId(section.id)}
                        >
                          <div>
                            <div className="text-sm font-semibold">{section.label}</div>
                            <div className={clsx("mt-1 text-xs", active ? "text-slate-500" : "text-slate-500")}>
                              {searchQuery.trim() ? section.subgroups.reduce((count, sg) => count + sg.leaves.length, 0) : section.totalLeaves} specialties
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_32px_64px_rgba(15,23,42,0.12)] overflow-y-auto max-h-[calc(100vh-16rem)]">
                  {displayedActiveSection && (
                    <>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                            Explore {displayedActiveSection.label}
                          </div>
                          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                            {searchQuery.trim() ? "Search results" : "Browse categories fast"}
                          </h3>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                            {searchQuery.trim() 
                              ? `Found ${displayedActiveSection.subgroups.reduce((count, sg) => count + sg.leaves.length, 0)} matching results`
                              : "Open a domain, jump into a subcategory, or go straight to a specialization."}
                          </p>
                        </div>

                        <Link
                          href={displayedActiveSection.href}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          onClick={(event) => {
                            if (isTouchDevice()) {
                              event.preventDefault();
                              navigateTo(displayedActiveSection.href);
                            }
                          }}
                        >
                          Browse {displayedActiveSection.label}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {displayedActiveSection.subgroups.slice(0, 6).map((subgroup) => (
                          <div
                            key={subgroup.id}
                            className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 hover:bg-gray-100 transition cursor-pointer"
                            onClick={() => navigateTo(subgroup.href)}
                          >
                            <Link
                              href={subgroup.href}
                              className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 text-sm font-semibold text-slate-950 transition hover:bg-gray-100"
                              onClick={(event) => {
                                if (isTouchDevice()) {
                                  event.preventDefault();
                                  navigateTo(subgroup.href);
                                }
                              }}
                            >
                              {subgroup.label}
                              <ChevronRight className="h-4 w-4" />
                            </Link>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {subgroup.leaves.slice(0, 5).map((leaf) => (
                                <Link
                                  key={leaf.id}
                                  href={leaf.href}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-gray-100 hover:border-slate-300 active:scale-95"
                                  onClick={(e) => {
                                    if (isTouchDevice()) {
                                      e.preventDefault();
                                      navigateTo(leaf.href);
                                    }
                                  }}
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
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-100 hover:border-slate-300"
                          onClick={(event) => {
                            if (isTouchDevice()) {
                              event.preventDefault();
                              navigateTo("/jobs");
                            }
                          }}
                        >
                          Browse all jobs
                        </Link>
                        <a
                          href="#categories"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-100 hover:border-slate-300"
                          onClick={(event) => {
                            if (isTouchDevice()) {
                              event.preventDefault();
                              navigateTo("#categories");
                            }
                          }}
                        >
                          See landing categories
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LandingMegaMenuMobile({ onNavigate }: LandingMegaMenuMobileProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedRootId, setExpandedRootId] = useState<string | null>(MENU_SECTIONS[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic for search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return MENU_SECTIONS;
    
    const query = searchQuery.toLowerCase();
    return MENU_SECTIONS.map((section) => ({
      ...section,
      subgroups: section.subgroups
        .map((subgroup) => ({
          ...subgroup,
          leaves: subgroup.leaves.filter((leaf) =>
            leaf.label.toLowerCase().includes(query)
          ),
        }))
        .filter(
          (subgroup) =>
            subgroup.label.toLowerCase().includes(query) ||
            subgroup.leaves.length > 0
        ),
    })).filter(
      (section) =>
        section.label.toLowerCase().includes(query) ||
        section.subgroups.length > 0
    );
  }, [searchQuery]);

  const displayedSections = searchQuery.trim() ? filteredSections : MENU_SECTIONS;

  const isTouchDevice = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  };

  const navigateTo = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-[1rem] px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-gray-100 transition"
        onClick={() => setOpen((current) => !current)}
        onTouchStart={() => setOpen((current) => !current)}
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
            <div className="mt-3 space-y-2">
              {/* Search Bar */}
              <div className="flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-gray-50 px-3 py-2 mb-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-500 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 transition"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>

              {displayedSections.map((section) => {
                const expanded = expandedRootId === section.id;
                return (
                  <div key={section.id} className="rounded-[1rem] border border-slate-200 bg-slate-50 p-2.5 hover:bg-gray-100 transition">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-[0.85rem] px-2 py-2 text-left hover:bg-gray-100 transition active:scale-95"
                      onClick={() => setExpandedRootId((current) => (current === section.id ? null : section.id))}
                      onTouchStart={() => setExpandedRootId((current) => (current === section.id ? null : section.id))}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-950">{section.label}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {searchQuery.trim() ? section.subgroups.reduce((count, sg) => count + sg.leaves.length, 0) : section.totalLeaves} specialties
                        </div>
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
                                className="flex items-center justify-between rounded-[0.9rem] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-gray-100 active:scale-95"
                                onClick={(e) => {
                                  if (isTouchDevice()) {
                                    e.preventDefault();
                                    navigateTo(subgroup.href);
                                  } else {
                                    onNavigate?.();
                                  }
                                }}
                              >
                                <span>{subgroup.label}</span>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            ))}
                            <Link
                              href={section.href}
                              className="inline-flex items-center gap-2 px-1 pt-1 text-sm font-semibold text-slate-900 hover:bg-gray-100 rounded-md px-2 py-1 transition active:scale-95"
                              onClick={(e) => {
                                if (isTouchDevice()) {
                                  e.preventDefault();
                                  navigateTo(section.href);
                                } else {
                                  onNavigate?.();
                                }
                              }}
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
