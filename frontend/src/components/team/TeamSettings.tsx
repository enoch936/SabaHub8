"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTeamStore } from "@/lib/teamStore";

export function TeamSettings() {
  const { team } = useTeamStore();
  const [name, setName] = useState(team?.name ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  if (!team) {
    return null;
  }

  const handleSaveName = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    toast.success("Team name updated");
  };

  const handleDelete = () => {
    if (deleteInput !== team.name) {
      return;
    }

    toast.error("Team deletion is not available in demo mode");
    setShowDeleteConfirm(false);
    setDeleteInput("");
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Team Settings</h2>
      </div>

      <div className="sheet-panel space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Team ID</p>
          <p className="font-mono text-sm text-muted-foreground">{team.id}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Created</p>
          <p className="text-sm">{new Date(team.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Members</p>
          <p className="text-sm">{team.members.length}</p>
        </div>
      </div>

      <div className="sheet-panel p-5">
        <h3 className="mb-3 text-sm font-medium">Team Name</h3>
        <form onSubmit={handleSaveName} className="flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm"
          >
            Save
          </button>
        </form>
      </div>

      <div className="sheet-panel space-y-3 border border-red-200 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
        </div>
        <p className="text-xs text-muted-foreground">Deleting the team is permanent and cannot be undone.</p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete Team
        </button>
      </div>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="sheet-panel w-full max-w-sm space-y-4 p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Delete Team</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{team.name}</span> to confirm deletion.
            </p>
            <input
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder={team.name}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput("");
                }}
                className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteInput !== team.name}
                className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-sm text-red-700 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
