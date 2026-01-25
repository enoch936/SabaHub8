import Link from "next/link";
import Image from "next/image";

const STATS = [
  { value: "Production Launch", label: "Current phase" },
  { value: "Web app", label: "Focus: core workflows" },
  { value: "Escrow + chat", label: "Next milestone" },
  { value: "Roadmap in repo", label: "Progress tracking" },
] as const;

const FEATURES = [
  {
    icon: "/images/icons/badges/secure-gradient.svg",
    title: "Secure Escrow",
    desc: "Secure escrow flow protects all payments and ensures safe transactions.",
  },
  {
    icon: "/images/icons/badges/chat-gradient.svg",
    title: "Real-time Chat",
    desc: "In-progress messaging to keep client and freelancer threads organized.",
  },
  {
    icon: "/images/icons/badges/info-gradient.svg",
    title: "Smart Analytics",
    desc: "Planned dashboards to show earnings, projects, and performance once live data is available.",
  },
  {
    icon: "/images/icons/badges/warning-gradient.svg",
    title: "Payout Options",
    desc: "Payout options under evaluation; we will ship the safest path first.",
  },
  {
    icon: "/images/icons/badges/verified-gradient.svg",
    title: "Dispute Resolution",
    desc: "Admin review tooling is being drafted to handle disputes transparently.",
  },
  {
    icon: "/images/icons/badges/info-gradient.svg",
    title: "Global Reach",
    desc: "International onboarding is expanding to new regions.",
  },
] as const;

const GALLERY_IMAGES = [
  "/images/photos/team-collab.jpg",
  "/images/photos/secure-payments.jpg",
  "/images/photos/dashboard-focus.jpg",
  "/images/photos/workspace-product.jpg",
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 font-bold text-white shadow-md">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">SabaHub</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80">
                Login
              </Link>
              <Link href="/register" className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-sky-500">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-16 sm:py-28">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <img
            src="/images/backgrounds/orbit-lines.svg"
            alt="Abstract orbit lines"
            className="h-full w-full object-cover opacity-50"
            decoding="async"
          />
          <div className="absolute left-20 top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute right-20 bottom-24 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/80 px-4 py-1.5 text-sm font-medium text-sky-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/80"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              Production Ready — Get Started Now
            </div>
            
            <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Build the home for <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">independent work</span>
            </h1>
            
            <p className="mb-10 text-xl leading-relaxed text-slate-700">
              SabaHub is live with secure payments, collaboration tools, and escrow workflows. Join thousands of professionals connecting talent with opportunity.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link 
                href="/register" 
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-[1.02]"
              >
                Request Access
                <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Accessible contrast</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Smooth interactions</span>
              </div>
            </div>
          </div>

          {/* Visual preview */}
          <div className="relative mx-auto mt-14 max-w-5xl rounded-3xl border border-white/30 bg-white/70 p-4 shadow-xl backdrop-blur">
            <div className="absolute -top-6 left-6 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
              <img src="/images/icons/badges/verified-gradient.svg" alt="Verified" className="h-4 w-4" />
              Workspace preview
            </div>
            <Image
              src="/images/banners/sabahub-collab.png"
              alt="SabaHub collaborative workspace preview"
              width={1600}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-200 bg-white px-6 py-16" style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-2xl font-semibold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-700">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Strip Preview */}
      <section className="relative overflow-hidden px-6 py-16" style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora background" className="h-full w-full object-cover opacity-50" loading="lazy" decoding="async" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3 text-slate-800">
            <img src="/images/icons/badges/info-gradient.svg" alt="Info badge" className="h-8 w-8" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Workflow preview</p>
              <p className="text-sm leading-relaxed text-slate-700">Snapshot of the in-progress experience: escrow, chat, analytics, payouts, admin review.</p>
            </div>
          </div>
          <Image
            src="/images/banners/sabahub-feature-strip.png"
            alt="Feature strip preview"
            width={1400}
            height={500}
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="w-full h-auto rounded-2xl border border-white/50 shadow-lg"
            loading="lazy"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20" style={{ contentVisibility: 'auto', containIntrinsicSize: '800px' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900">What we are building</h2>
            <p className="text-lg leading-relaxed text-slate-700">These features are in active development for the initial release.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <img src={feature.icon} alt={feature.title} className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="leading-relaxed text-slate-700">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Gallery */}
      <section className="border-t border-slate-200 bg-white px-6 py-20" style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-slate-700">
              <img src="/images/icons/badges/info-gradient.svg" alt="Preview" className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-wide text-sky-700">In-progress visuals</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {GALLERY_IMAGES.map((src) => (
                <div key={src} className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
                  <img src={src} alt="Platform visual" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-900">Roadmap highlights</h3>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />Wire escrow approvals and payouts</li>
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />Stabilize chat threads and file shares</li>
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />Dashboards for earnings and delivery</li>
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />Admin mediation and audit trails</li>
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />Global onboarding once core is stable</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20" style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}>
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-12 text-center text-white shadow-2xl">
            {/* Decorative elements */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            </div>
            
            <div className="relative">
              <h2 className="mb-4 text-4xl font-bold">Follow the journey</h2>
              <p className="mb-8 text-lg text-sky-100">
                Request access, sign in, and tell us what you need most.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-sky-700 shadow-xl transition hover:bg-slate-50 hover:shadow-2xl"
                >
                  Request Beta Access
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 font-bold text-white text-sm">
                  S
                </div>
                <span className="font-bold text-slate-900">SabaHub</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                The trusted freelance marketplace for the modern workforce.
              </p>
            </div>
            
            {[
              {
                title: "Platform",
                links: ["Browse Jobs", "Find Talent", "How it Works", "Pricing"]
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Blog", "Press"]
              },
              {
                title: "Support",
                links: ["Help Center", "Contact", "Terms", "Privacy"]
              },
            ].map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 font-semibold text-slate-900">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-700 transition hover:text-slate-900">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-700">
            © 2026 SabaHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
