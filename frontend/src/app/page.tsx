import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">SabaHub</h1>
        <p className="text-slate-600">Freelance marketplace</p>
      </header>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-slate-900 px-4 py-2 text-white">Login</Link>
        <Link href="/register" className="rounded border border-slate-300 px-4 py-2">Register</Link>
        <Link href="/dashboard" className="rounded border border-slate-300 px-4 py-2">Dashboard</Link>
      </div>
    </main>
  );
}
