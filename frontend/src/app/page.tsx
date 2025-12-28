import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/30 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 font-bold text-white shadow-lg">
                S
              </div>
              <span className="text-xl font-bold text-slate-900">SabaHub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="rounded-lg px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100">
                Login
              </Link>
              <Link href="/register" className="rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-32">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-sky-200 opacity-30 blur-3xl" />
          <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-blue-300 opacity-20 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              Now Live — Join 10,000+ professionals
            </div>
            
            <h1 className="mb-6 text-5xl font-bold leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
              The Future of <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Freelance Work</span>
            </h1>
            
            <p className="mb-10 text-lg text-slate-600 sm:text-xl">
              Connect with top talent or find your dream projects. Secure payments, real-time collaboration, and trusted escrow—all in one platform.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link 
                href="/register" 
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-8 py-4 font-semibold text-white shadow-xl transition hover:shadow-2xl hover:scale-105"
              >
                Start for Free
                <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/dashboard/jobs" 
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Browse Jobs
              </Link>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure escrow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "$2M+", label: "Paid Out" },
              { value: "5K+", label: "Projects Done" },
              { value: "98%", label: "Success Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900">Everything you need to succeed</h2>
            <p className="text-lg text-slate-600">Professional tools built for the modern freelance economy</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🔒",
                title: "Secure Escrow",
                desc: "Your payments are protected with enterprise-grade escrow until work is complete."
              },
              {
                icon: "💬",
                title: "Real-time Chat",
                desc: "Collaborate seamlessly with built-in messaging and file sharing."
              },
              {
                icon: "📊",
                title: "Smart Analytics",
                desc: "Track your earnings, projects, and performance with detailed insights."
              },
              {
                icon: "⚡",
                title: "Instant Payouts",
                desc: "Get paid fast with multiple payment methods and low fees."
              },
              {
                icon: "🛡️",
                title: "Dispute Resolution",
                desc: "Fair and transparent dispute handling with admin mediation."
              },
              {
                icon: "🌍",
                title: "Global Reach",
                desc: "Connect with clients and freelancers from around the world."
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-12 text-center text-white shadow-2xl">
            {/* Decorative elements */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            </div>
            
            <div className="relative">
              <h2 className="mb-4 text-4xl font-bold">Ready to get started?</h2>
              <p className="mb-8 text-lg text-sky-100">
                Join thousands of professionals already working smarter
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-sky-700 shadow-xl transition hover:bg-slate-50 hover:shadow-2xl"
                >
                  Create Free Account
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
              <p className="text-sm text-slate-600">
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
                      <a href="#" className="text-sm text-slate-600 transition hover:text-slate-900">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            © 2025 SabaHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
