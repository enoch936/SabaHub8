"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, UserPlus, Shield, UserMinus } from 'lucide-react';
import { useTeamStore } from '@/lib/teamStore';

interface ActivityItem {
  id: string;
  action: 'joined' | 'role_changed' | 'removed';
  memberName: string;
  detail?: string;
  timestamp: string;
}

const ACTION_CONFIG = {
  joined: {
    label: 'joined the team',
    icon: <UserPlus className="w-3.5 h-3.5 text-green-500" />,
  },
  role_changed: {
    label: 'role changed',
    icon: <Shield className="w-3.5 h-3.5 text-blue-500" />,
  },
  removed: {
    label: 'was removed',
    icon: <UserMinus className="w-3.5 h-3.5 text-red-500" />,
  },
};

function timeAgo(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  const diff = Date.now() - parsed.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return parsed.toLocaleDateString();
}

export function TeamActivityLog() {
  const [open, setOpen] = useState(false);
  const activities = useTeamStore((state) => state.activities) as ActivityItem[];

  return (
    <div className="sheet-panel">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recent Activity</span>
          <span className="text-xs text-muted-foreground bg-[var(--accent)] px-2 py-0.5 rounded-full">{activities.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {activities.length === 0 ? <div className="px-4 py-4 text-xs text-muted-foreground">No team activity yet.</div> : null}
          {activities.map((item) => {
            const cfg = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.joined;
            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 flex-shrink-0">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.memberName}</span>{' '}
                    <span className="text-muted-foreground">{cfg.label}</span>
                    {item.detail ? <span className="text-xs text-muted-foreground ml-1">({item.detail})</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
