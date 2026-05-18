"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, Menu, Play, Quote, Sparkles, Star, TrendingUp } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import LandingMegaMenu, { LandingMegaMenuMobile } from "./LandingMegaMenu";
import { ThemeIconButton } from "@/components/mui/ThemeToggle";
import styles from "./LandingPage.module.css";
import {
  ENTERPRISE_BENEFITS,
  ENTERPRISE_IMAGES,
  FEATURES,
  FOOTER_LINK_GROUPS,
  HERO_AUDIENCES,
  HERO_STATS,
  MARKETPLACE_JOBS,
  MARKETPLACE_TALENT,
  NAV_ITEMS,
  SHOWCASE_STATS,
  SOCIAL_LINKS,
  TALENT_CATEGORIES,
  TESTIMONIALS,
  TRUST_POINTS,
  USER_PATHS,
  VIDEO_STORIES,
} from "./landing-data";

const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const revealLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const revealRight = (delay = 0) => ({
  initial: { opacity: 0, x: 40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const revealScale = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.88 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, delay, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
});

function SectionIntro({
  badge,
  title,
  description,
  badgeClassName,
}: {
  badge: string;
  title: string;
  description: string;
  badgeClassName: string;
}) {
  return (
    <motion.div className="mx-auto mb-16 max-w-3xl text-center" {...revealUp()}>
      <motion.div {...revealScale(0.05)} className={clsx("mb-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold", badgeClassName)}>{badge}</motion.div>
      <h2
        className={clsx(
          styles.displayHeading,
          "text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl",
        )}
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">{description}</p>
    </motion.div>
  );
}

function ActionLink({
  href,
  variant,
  children,
  className,
}: {
  href: string;
  variant: "primary" | "secondary" | "white" | "darkGhost";
  children: React.ReactNode;
  className?: string;
}) {
  const variantClass =
    variant === "primary"
      ? styles.primaryButton
      : variant === "secondary"
        ? styles.secondaryButton
        : variant === "white"
          ? styles.whiteButton
          : styles.darkGhostButton;

  return (
    <Link href={href} className={clsx(styles.actionButton, variantClass, className)}>
      {children}
    </Link>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVideoOpen, setHeroVideoOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [audience, setAudience] = useState<keyof typeof HERO_AUDIENCES>("employer");

  const currentAudience = HERO_AUDIENCES[audience];
  const navigationItems = NAV_ITEMS.filter((item) => item.href !== "#categories");
  const audienceEntries = Object.entries(HERO_AUDIENCES) as Array<
    [keyof typeof HERO_AUDIENCES, (typeof HERO_AUDIENCES)[keyof typeof HERO_AUDIENCES]]
  >;

  return (
    <div className={styles.page}>
      <div className={styles.navShell}>
        <motion.nav
          className={clsx(styles.glassPanel, "px-4 py-4 md:px-6")}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between gap-6">
            <BrandLogo size="sm" />

            <div className="hidden items-center gap-5 md:flex">
              <LandingMegaMenu />
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <ThemeIconButton
                size="small"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  bgcolor: "var(--surface)",
                  color: "var(--foreground)",
                  "&:hover": { bgcolor: "var(--accent)" },
                }}
              />
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-200 dark:hover:text-slate-100"
              >
                Log In
              </Link>
              <ActionLink href="/register" variant="primary" className="px-5 py-3 text-sm">
                Sign Up
              </ActionLink>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeIconButton
                size="small"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  bgcolor: "var(--surface)",
                  color: "var(--foreground)",
                  "&:hover": { bgcolor: "var(--accent)" },
                }}
              />
              <button
                type="button"
                aria-label="Toggle navigation menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen ? (
              <motion.div
                className="mt-4 space-y-3 rounded-[1.4rem] border border-slate-200 bg-white p-4 md:hidden"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <LandingMegaMenuMobile onNavigate={() => setMobileMenuOpen(false)} />

                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}

                <div className="flex flex-col gap-3 pt-2">
                  <ActionLink href="/login" variant="secondary" className="w-full justify-center">
                    Log In
                  </ActionLink>
                  <ActionLink href="/register" variant="primary" className="w-full justify-center">
                    Sign Up
                  </ActionLink>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.nav>
      </div>

      <main>
        <section className="relative overflow-hidden" style={{ height: "min(100vh, 820px)" }}>
          {/* Fullscreen autoplay video */}
          <video
            src="/footage/video/6517587-hd_1920_1080_30fps.mp4"
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />
          </div>
          {/* Text content over video */}
          <div className="relative z-10 flex h-full flex-col justify-center px-8 pb-16 pt-24 sm:px-12 md:px-16 md:pt-28 lg:px-24">
            <motion.div {...revealUp()} className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Built for hiring and freelance work</span>
              </div>
              <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-white/20 bg-white/10 p-1.5 backdrop-blur-md">
                {audienceEntries.map(([key, item]) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAudience(key)}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                        audience === key
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-white/80 hover:bg-white/20 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <h1
                className={clsx(
                  styles.displayHeading,
                  "text-4xl font-bold leading-[0.95] tracking-[-0.06em] text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl",
                )}
              >
                Hiring and work,
                <br />
                <span className="text-white/90">in one platform</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/80 drop-shadow sm:text-xl">{currentAudience.description}</p>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                <ActionLink href={currentAudience.primaryHref} variant="primary">
                  {currentAudience.primaryLabel}
                  <ArrowRight className="h-5 w-5" />
                </ActionLink>
                <ActionLink href={currentAudience.secondaryHref} variant="white">
                  {currentAudience.secondaryLabel}
                </ActionLink>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {currentAudience.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {highlight}
                  </div>
                ))}
              </div>
              <motion.div
                className="mt-7 grid gap-6 sm:grid-cols-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {HERO_STATS.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold tracking-[-0.04em] text-white drop-shadow md:text-4xl">{stat.value}</div>
                    <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="relative px-6 pb-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {TRUST_POINTS.map((point, index) => (
              <motion.article key={point.title} className={clsx(styles.featureCard, "rounded-[1.6rem] p-6")} {...revealScale(index * 0.1)}>
                <motion.div
                  className="mb-4 inline-flex rounded-2xl bg-slate-950 p-3 text-white"
                  whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                >
                  <point.icon className="h-5 w-5" />
                </motion.div>
                <h3 className="text-lg font-semibold text-slate-950">{point.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{point.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="paths" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              badge="Two Paths"
              badgeClassName="bg-slate-100 text-slate-700"
              title="Built for both sides"
              description="Employers can hire fast. Freelancers can find good work."
            />

            <div className="relative overflow-hidden rounded-[2rem]">
              {/* Two images side by side as one seamless background */}
              <div className="absolute inset-0 flex">
                <img src="/foot3/Untitled2.jpeg" alt="" className={clsx("h-full w-1/2 object-cover", styles.kenBurns)} aria-hidden="true" />
                <img src="/foot3/images.jpeg" alt="" className={clsx("h-full w-1/2 object-cover", styles.kenBurnsAlt)} aria-hidden="true" />
              </div>
              {/* Single unified dark overlay */}
              <div className="absolute inset-0 bg-black/55" />
              {/* Cards grid over the unified background */}
              <div className="relative z-10 grid gap-0 lg:grid-cols-2">
              {USER_PATHS.map((path, index) => (
                  <motion.article key={path.audience} className="p-8 md:p-10" {...revealUp(index * 0.08)}>
                      <div className="mb-6 flex items-center gap-3">
                        <div className="inline-flex rounded-2xl bg-white/20 p-3 text-white">
                          <path.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">{path.audience}</div>
                          <h3 className="text-2xl font-semibold text-white">{path.title}</h3>
                        </div>
                      </div>

                      <p className="text-base leading-8 text-white/80">{path.description}</p>

                      <div className="mt-8 space-y-4">
                        {path.steps.map((step) => (
                          <div key={step.title} className="rounded-[1.35rem] bg-white/10 p-5">
                            <div className="flex items-start gap-4">
                              <div className="rounded-xl bg-white/20 p-3 text-white">
                                <step.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-white">{step.title}</h4>
                                <p className="mt-1 text-sm leading-7 text-white/70">{step.detail}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <ActionLink href={path.ctaHref} variant="white" className="mt-8">
                        {path.ctaLabel}
                        <ArrowRight className="h-5 w-5" />
                      </ActionLink>
                  </motion.article>
              ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              badge="Platform"
              badgeClassName="bg-slate-100 text-slate-700"
              title="Core tools, kept simple"
              description="Hiring, messaging, contracts, and payments in one clean workspace."
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <motion.article key={feature.title} className={clsx(styles.featureCard, "group p-8")} {...revealScale(index * 0.07)}>
                  <div
                    className={styles.featureGlow}
                    style={{ background: `linear-gradient(135deg, ${feature.gradientFrom}, ${feature.gradientTo})` }}
                  />
                  <div className="relative">
                    <motion.div
                      className="mb-5 inline-flex rounded-2xl p-3 text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${feature.gradientFrom}, ${feature.gradientTo})` }}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <feature.icon className="h-6 w-6" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-950">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="marketplace" className="relative overflow-hidden py-24">
          {/* Ken Burns background image */}
          <img
            src="/foot3/Untitled.jpeg"
            alt=""
            className={clsx("absolute inset-0 h-full w-full object-cover", styles.kenBurns)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <motion.div className="mx-auto mb-16 max-w-3xl text-center" {...revealUp()}>
              <motion.div {...revealScale(0.05)} className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">Marketplace</motion.div>
              <h2 className={clsx(styles.displayHeading, "text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl md:text-5xl lg:text-6xl")}>
                Real jobs and real talent
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">Preview the marketplace before you sign in.</p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-2">
              <motion.article className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 backdrop-blur-md md:p-10" {...revealLeft()}>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">Jobs</div>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Open roles</h3>
                  </div>
                  <ActionLink href="/jobs" variant="white" className="hidden md:inline-flex">
                    View all jobs
                  </ActionLink>
                </div>

                <div className="space-y-4">
                  {MARKETPLACE_JOBS.map((job) => (
                    <Link
                      key={job.title}
                      href="/jobs"
                      className="block rounded-[1.45rem] border border-white/15 bg-white/10 p-5 transition-all hover:-translate-y-1 hover:bg-white/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                          <p className="mt-1 text-sm text-white/60">{job.company}</p>
                        </div>
                        <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">{job.budget}</div>
                      </div>
                      <p className="mt-3 text-sm text-white/60">Timeline: {job.timeline}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>

                <ActionLink href="/jobs" variant="white" className="mt-6 w-full justify-center md:hidden">
                  View all jobs
                </ActionLink>
              </motion.article>

              <motion.article className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 backdrop-blur-md md:p-10" {...revealRight(0.08)}>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">Featured Talent</div>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Profiles that make hiring feel easier</h3>
                  </div>
                  <ActionLink href="/register" variant="primary" className="hidden md:inline-flex">
                    Join the marketplace
                  </ActionLink>
                </div>

                <div className="space-y-4">
                  {MARKETPLACE_TALENT.map((person) => (
                    <Link
                      key={person.name}
                      href="/register"
                      className="block rounded-[1.45rem] border border-white/15 bg-white/10 p-5 transition-all hover:-translate-y-1 hover:bg-white/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{person.name}</h4>
                          <p className="mt-1 text-sm text-white/60">{person.role}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-white">{person.rate}</div>
                          <div className="mt-1 text-xs font-medium text-emerald-300">{person.success}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {person.skills.map((skill) => (
                          <span key={skill} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>

                <ActionLink href="/register" variant="primary" className="mt-6 w-full justify-center md:hidden">
                  Join the marketplace
                </ActionLink>
              </motion.article>
            </div>
          </div>
        </section>

        <section id="videos" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              badge="Platform"
              badgeClassName="bg-slate-100 text-slate-700"
              title="See the workflow"
              description="Preview how teams and freelancers move through the platform."
            />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {VIDEO_STORIES.map((video, index) => (
                <motion.article
                  key={video.title}
                  className={clsx(styles.softPanel, "group overflow-hidden rounded-[1.75rem]")}
                  {...revealScale(index * 0.1)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    {playingVideo === index ? (
                      <video src={video.videoSrc} className="h-full w-full object-cover" autoPlay controls playsInline />
                    ) : (
                      <>
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <motion.button
                          type="button"
                          onClick={() => setPlayingVideo(index)}
                          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-xl"
                          aria-label={`Play ${video.title} preview`}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        >
                          <Play className="ml-1 h-6 w-6 text-slate-900" fill="currentColor" />
                        </motion.button>
                        <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                          {video.duration}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-950">{video.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{video.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="categories" className="relative px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              badge="Categories"
              badgeClassName="bg-slate-100 text-slate-700"
              title="Find specialists faster"
              description="Browse the main categories before you start hiring."
            />

            <div className="grid gap-8 md:grid-cols-2">
              {TALENT_CATEGORIES.map((category, index) => (
                <motion.article
                  key={category.name}
                  className={clsx(styles.softPanel, "overflow-hidden rounded-[2rem]")}
                  {...(index % 2 === 0 ? revealLeft(index * 0.08) : revealRight(index * 0.08))}
                >
                  <div className="grid md:grid-cols-2">
                    <div className="relative min-h-72 overflow-hidden">
                      <img src={category.image} alt={category.name} className={clsx("h-full w-full object-cover transition-transform duration-700 group-hover:scale-110", styles.kenBurns)} />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 to-transparent" />
                    </div>

                    <div className="flex flex-col justify-center p-8">
                      <h3 className="text-2xl font-semibold text-slate-950">{category.name}</h3>
                      <p className="mt-2 text-base font-semibold text-slate-900">{category.jobs} active jobs</p>
                      <div className="mt-6 space-y-3">
                        {category.skills.map((skill, si) => (
                          <motion.div key={skill} className="flex items-center gap-3 text-slate-600" {...revealLeft(si * 0.06)}>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm">{skill}</span>
                          </motion.div>
                        ))}
                      </div>
                      <ActionLink href="/jobs" variant="secondary" className="mt-8 w-full justify-center">
                        Explore Category
                      </ActionLink>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div className="mt-12 text-center" {...revealUp(0.15)}>
              <ActionLink href="/jobs" variant="primary">
                View All Categories
              </ActionLink>
            </motion.div>
          </div>
        </section>

        <section className="bg-white px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div {...revealLeft()}>
              <div className="mb-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Why SabaHub</div>
              <h2
                className={clsx(
                  styles.displayHeading,
                  "text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl",
                )}
              >
                Work Smarter,
                <br />
                <span className={styles.brandText}>Deliver Faster</span>
              </h2>
              <p className="mt-6 text-xl leading-8 text-slate-600">
                SabaHub keeps hiring, delivery, and payments in one clear flow.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {SHOWCASE_STATS.map((stat, index) => (
                  <motion.div key={stat.label} className={clsx(styles.softPanel, "rounded-[1.5rem] p-5 text-center")} {...revealScale(index * 0.1)}>
                    <div className={`${styles.brandText} text-2xl font-bold md:text-3xl`}>{stat.value}</div>
                    <div className="mt-2 text-xs text-slate-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="relative" {...revealRight(0.12)}>
              <div className={styles.heroMedia}>
                <img
                  src="https://images.unsplash.com/photo-1625461291092-13d0c45608b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBkZXNrJTIwbWluaW1hbHxlbnwxfHx8fDE3NzQ3ODk2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Modern workspace desk"
                  className={clsx("h-[500px] w-full object-cover", styles.kenBurnsAlt)}
                />
                <div className={styles.heroOverlay} />
              </div>

              <motion.div
                className={clsx(styles.floatingCard, styles.floatCard, "p-6")}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div className="text-sm text-slate-500">Active Projects</div>
                </div>
                <div className={`${styles.brandText} mt-1 text-3xl font-bold`}>342,567</div>
                <div className="mt-1 text-sm text-emerald-600">↑ 18% this month</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="enterprise" className={clsx(styles.darkSection, "px-6 py-24")}>
          <div className="relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div {...revealUp()}>
              <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                Enterprise
              </div>

              <h2
                className={clsx(
                  styles.displayHeading,
                  "text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl",
                )}
              >
                Built for
                <br />
                <span className={styles.brandText}>larger teams</span>
              </h2>

              <p className="mt-6 text-xl leading-8 text-slate-600">
                Extra support, stronger controls, and clearer team operations for larger organizations.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {ENTERPRISE_BENEFITS.map((benefit, index) => (
                  <motion.div key={benefit.title} className="flex items-start gap-4" {...revealUp(index * 0.08)}>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <benefit.icon className="h-5 w-5 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{benefit.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <ActionLink href="/register" variant="primary">
                  Contact Sales
                </ActionLink>
                <ActionLink href="/jobs" variant="secondary">
                  Browse Talent
                </ActionLink>
              </div>
            </motion.div>

            <motion.div className="relative" {...revealUp(0.15)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <motion.img src={ENTERPRISE_IMAGES[0]} alt="Startup team brainstorming" className={clsx("h-48 w-full rounded-[1.5rem] object-cover shadow-2xl", styles.kenBurns)} {...revealScale(0)} />
                  <motion.img src={ENTERPRISE_IMAGES[1]} alt="Business partnership handshake" className={clsx("h-64 w-full rounded-[1.5rem] object-cover shadow-2xl", styles.kenBurnsAlt)} {...revealScale(0.1)} />
                </div>
                <div className="space-y-4 pt-10">
                  <motion.img src={ENTERPRISE_IMAGES[2]} alt="Remote team collaboration" className={clsx("h-64 w-full rounded-[1.5rem] object-cover shadow-2xl", styles.kenBurns)} {...revealScale(0.15)} />
                  <motion.img src={ENTERPRISE_IMAGES[3]} alt="Professional video call" className={clsx("h-48 w-full rounded-[1.5rem] object-cover shadow-2xl", styles.kenBurnsAlt)} {...revealScale(0.2)} />
                </div>
              </div>

              <motion.div
                className="absolute -bottom-6 left-1/2 w-[90%] -translate-x-1/2 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl"
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: 0.22 }}
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">850+</div>
                    <div className="text-xs text-slate-500">Enterprises</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">98%</div>
                    <div className="text-xs text-slate-500">Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <div className="text-xs text-slate-500">Support</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="stories" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              badge="Stories"
              badgeClassName="bg-slate-100 text-slate-700"
              title="Teams using SabaHub"
              description="A few examples of how people use the platform."
            />

            <div className="grid gap-8 md:grid-cols-2">
              {TESTIMONIALS.map((testimonial, index) => (
                <motion.article key={testimonial.name} className={clsx(styles.featureCard, "p-8")} {...revealScale(index * 0.1)}>
                  <div className="mb-4 flex gap-1">
                    {[0, 1, 2, 3, 4].map((value) => (
                      <motion.span key={value} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + value * 0.06, type: "spring", stiffness: 400 }}>
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </motion.span>
                    ))}
                  </div>
                  <Quote className="mb-4 h-8 w-8 text-slate-400" />
                  <p className="text-lg leading-8 text-slate-700">&quot;{testimonial.quote}&quot;</p>
                  <div className="mt-6 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {testimonial.metric}
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <motion.img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-14 w-14 rounded-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    />
                    <div>
                      <div className="text-lg font-semibold text-slate-950">{testimonial.name}</div>
                      <div className="text-sm text-slate-500">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <motion.div className={clsx(styles.ctaShell, "px-8 py-14 text-center md:px-14 md:py-16")} {...revealScale()}>
              <div className="relative z-10">
                <motion.h2
                  className={clsx(styles.displayHeading, "text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl lg:text-6xl")}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  Start on SabaHub
                </motion.h2>
                <motion.p
                  className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-slate-600"
                  {...revealUp(0.1)}
                >
                  Start hiring or start working with a simple setup from day one.
                </motion.p>
                <motion.div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" {...revealUp(0.2)}>
                  <ActionLink href="/register" variant="primary">
                    Join as Freelancer
                    <ArrowRight className="h-5 w-5" />
                  </ActionLink>
                  <ActionLink href="/register" variant="secondary">
                    Post a Job
                  </ActionLink>
                </motion.div>
                <motion.p className="mt-8 text-sm text-slate-500" {...revealUp(0.3)}>Free to join • No credit card required • Get started in minutes</motion.p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer id="footer" className={clsx(styles.footerShell, "px-6 py-16")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <BrandLogo variant="gradient" />
              <p className="mt-4 text-sm leading-7 text-slate-600">Hiring, freelance work, contracts, and payments in one place.</p>
              <div className="mt-5 flex gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a key={social.label} href={social.href} className={styles.socialPill} target="_blank" rel="noreferrer" aria-label={social.label}>
                    <span className="text-xs font-semibold">{social.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_LINK_GROUPS.map((group, index) => (
              <motion.div key={group.title} {...revealUp(index * 0.06)}>
                <h3 className="font-semibold text-slate-950">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link}>
                      <Link href="/register" className="text-sm text-slate-600 transition-colors hover:text-slate-950">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex flex-col gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between"
            {...revealUp(0.1)}
          >
            <p>© 2026 SabaHub Inc. All rights reserved.</p>
            <div className="flex flex-wrap gap-6">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map((item) => (
                <Link key={item} href="/register" className="transition-colors hover:text-slate-900">
                  {item}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
