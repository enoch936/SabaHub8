export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="mb-2 text-2xl font-bold">404 — Page not found</h1>
      <p className="text-slate-700">The page you are looking for doesn’t exist or has been moved.</p>
      <a href="/" className="mt-4 inline-block rounded border border-slate-300 px-4 py-2">Go home</a>
    </main>
  );
}
