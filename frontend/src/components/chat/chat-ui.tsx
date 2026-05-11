"use client";

import type { ReactNode } from "react";

type ClassValue = string | false | null | undefined;

function cx(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

export const chatUi = {
  sectionCard: "rounded-2xl border border-slate-200 bg-white shadow-sm",
  sectionCardSoft: "rounded-2xl border border-slate-200 bg-slate-50 shadow-sm",
  cardPadding: "px-4 py-4",
  inputWrap:
    "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm",
  input:
    "w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400",
  iconButton:
    "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700",
  primaryButton:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
  secondaryButton:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
  subtlePill:
    "rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700",
};

export function ChatSectionCard({
  soft = false,
  className,
  children,
}: {
  soft?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx(soft ? chatUi.sectionCardSoft : chatUi.sectionCard, chatUi.cardPadding, className)}>
      {children}
    </div>
  );
}

export function ChatSearchInput({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx(chatUi.inputWrap, className)}>{children}</div>;
}

export function ChatPrimaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cx(chatUi.primaryButton, className)} {...props}>
      {children}
    </button>
  );
}

export function ChatSecondaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cx(chatUi.secondaryButton, className)} {...props}>
      {children}
    </button>
  );
}
