export default function AdminHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-slate-400 text-sm">Users</div>
          <div className="text-3xl font-bold">--</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-slate-400 text-sm">Jobs</div>
          <div className="text-3xl font-bold">--</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-slate-400 text-sm">Revenue</div>
          <div className="text-3xl font-bold">--</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-slate-400 text-sm">Active Disputes</div>
          <div className="text-3xl font-bold">--</div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold mb-2">Announcements</h2>
        <p className="text-slate-400 text-sm">Post broadcasts to all users via Admin Chat.</p>
      </div>
    </div>
  );
}
