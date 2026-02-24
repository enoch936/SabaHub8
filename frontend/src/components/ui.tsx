"use client";

import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { useSession } from "@/lib/session";

// Utility
export function cn(...args: any[]) {
  return clsx(args);
}

// Card Component
export function Card({ 
  children, 
  className, 
  variant = "default",
  hover = false,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "bordered" | "elevated";
  hover?: boolean;
}) {
  const variants = {
    default: "bg-white/90 backdrop-blur border border-slate-200/80 shadow-[var(--shadow-soft)]",
    bordered: "bg-white/90 backdrop-blur border-2 border-slate-200/80",
    elevated: "bg-white/95 backdrop-blur shadow-[var(--shadow-soft-lg)] border border-slate-100",
  };
  
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        variants[variant],
        hover && "hover:shadow-2xl hover:-translate-y-1 hover:border-slate-300/80 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Badge Component
export function Badge({ 
  children, 
  variant = "default",
  size = "md",
  className,
  ...props 
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    default: "bg-slate-100/80 text-slate-700 border border-slate-200/70",
    outline: "bg-transparent text-slate-700 border border-slate-200/80",
    success: "bg-emerald-50/80 text-emerald-700 border border-emerald-200/70",
    warning: "bg-amber-50/80 text-amber-700 border border-amber-200/70",
    danger: "bg-rose-50/80 text-rose-700 border border-rose-200/70",
    info: "bg-sky-50/80 text-sky-700 border border-sky-200/70",
    purple: "bg-purple-50/80 text-purple-700 border border-purple-200/70",
  };
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium backdrop-blur",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Avatar Component
export function Avatar({ 
  src, 
  alt = "User",
  size = "md",
  fallback,
  className,
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
}) {
  const [error, setError] = useState(false);
  
  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };
  
  if (!src || error) {
    const fallbackText = fallback?.trim();
    const display =
      fallbackText && fallbackText.length > 0
        ? fallbackText.split(" ")[0]
        : alt.charAt(0).toUpperCase();
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 font-semibold text-white",
          sizes[size],
          className
        )}
      >
        {display}
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn(
        "rounded-full object-cover",
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

// Skeleton Loader
export function Skeleton({ 
  className,
  variant = "rectangular",
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "rectangular" | "circular" | "text";
}) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded",
        variant === "text" && "rounded h-4",
        className
      )}
      {...props}
    />
  );
}

// Progress Bar
export function Progress({ 
  value = 0, 
  max = 100,
  variant = "default",
  size = "md",
  label,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variants = {
    default: "bg-sky-600",
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-rose-600",
  };
  
  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };
  
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="text-slate-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-slate-200", sizes[size])}>
        <div
          className={cn("h-full transition-all duration-500 ease-out", variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Dropdown Menu
export function Dropdown({ 
  trigger, 
  items,
  align = "left",
}: {
  trigger: ReactNode;
  items: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean }[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur py-1 shadow-2xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-slate-50/80",
                item.danger ? "text-rose-600" : "text-slate-700"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Button
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
    isLoading,
    leftIcon,
    rightIcon,
  ...props
}: Omit<HTMLMotionProps<"button">, "ref"> & {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) {
  const variants: Record<string, string> = {
    primary: "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:from-sky-500 hover:to-blue-600",
    secondary: "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.3)] hover:bg-slate-950",
    outline: "border-2 border-slate-300/80 bg-white/80 backdrop-blur hover:bg-slate-50/80 hover:border-slate-400/80",
    danger: "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:from-rose-500 hover:to-pink-600",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm font-medium",
    lg: "px-6 py-3 text-base font-medium",
  };

  const { disabled, ...rest } = props;
  return (
    <motion.button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={isLoading || disabled ? undefined : { y: -1 }}
      whileTap={isLoading || disabled ? undefined : { scale: 0.98 }}
      {...rest}
      disabled={isLoading || disabled}
    >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                {leftIcon}
                {children}
                {rightIcon}
              </>
            )}
    </motion.button>
  );
}

// Input
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm transition placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100/70 disabled:bg-slate-50 disabled:cursor-not-allowed",
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
        "w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm transition placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100/70 disabled:bg-slate-50 disabled:cursor-not-allowed",
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
        "rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm transition focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100/70 disabled:bg-slate-50 disabled:cursor-not-allowed",
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
  const isBrowser = typeof document !== "undefined";

  useEffect(() => {
    if (!isBrowser) return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, isBrowser]);

  if (!isBrowser) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur"
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.995 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 transition hover:bg-slate-100"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="text-slate-700">{children}</div>
            {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
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
