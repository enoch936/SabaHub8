"use client";

import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { useSession } from "@/lib/session";

// Utility
export function cn(...args: any[]) {
  return clsx(args);
}

// Button
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary: "bg-sky-600 text-white hover:bg-sky-700",
    secondary: "bg-slate-900 text-white hover:bg-black",
    outline: "border border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5",
  };
  return (
    <button
      className={cn(
        "rounded transition focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Input
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded border border-slate-300 bg-white p-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200",
        props.className
      )}
    />
  );
}

// Textarea
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded border border-slate-300 bg-white p-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200",
        props.className
      )}
    />
  );
}

// Select
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200",
        props.className
      )}
    />
  );
}

// Modal
export function Modal({ open, onClose, title, children, actions }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 grid place-items-center transition",
        open ? "visible" : "invisible"
      )}
    >
      <div className={cn("absolute inset-0 bg-black/30", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div className={cn(
        "relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-lg transition",
        open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}>
        {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
        <div>{children}</div>
        {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>,
    document.body
  );
}

// Tabs
export function Tabs({ tabs, value, onChange }: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="border-b">
      <div className="-mb-px flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={cn(
              "border-b-2 px-3 py-2 text-sm",
              value === t.key ? "border-sky-600 text-sky-700" : "border-transparent text-slate-600 hover:text-slate-900"
            )}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Table (simple)
export function Table({ columns, rows }: {
  columns: { key: string; header: string; render?: (row: any) => ReactNode }[];
  rows: any[];
}) {
  return (
    <div className="overflow-auto rounded border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-medium">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn(i % 2 ? "bg-white" : "bg-slate-50/50")}>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 align-top">{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-slate-500" colSpan={columns.length}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Empty / Loading / Error states
export function EmptyState({ title = "Nothing here", hint }: { title?: string; hint?: string }) {
  return (
    <div className="rounded-xl border p-6 text-center text-slate-600">
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-xl border p-6 text-center text-slate-600">
      <p className="animate-pulse">{label}…</p>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong" }: { message?: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
      <p className="font-medium">{message}</p>
    </div>
  );
}

// Role-based gate
export function RoleGate({ allow, children }: { allow: ("ADMIN" | "EMPLOYER" | "FREELANCER")[]; children: ReactNode }) {
  const role = useSession((s) => s.role);
  if (!role || !allow.includes(role)) return null;
  return <Fragment>{children}</Fragment>;
}
