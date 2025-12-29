export default function Forbidden() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold mb-2">403 – Forbidden</h1>
        <p className="text-slate-600 mb-6">You do not have permission to access this resource.</p>
        <a href="/dashboard" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-white">Go back</a>
      </div>
    </div>
  );
}
