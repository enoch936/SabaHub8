"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, Input, Modal } from "@/components/ui";
import { JOB_TAXONOMY, getJobCategoryDisplay, getJobCategoryPathIds } from "@/lib/jobTaxonomy";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowNonLeaf?: boolean;
  allowAllOption?: boolean;
  allValue?: string;
  allLabel?: string;
  label?: string;
  helperText?: string;
};

function deriveActiveIds(value: string, allValue: string) {
  if (!value || value === allValue) return { mainId: JOB_TAXONOMY.roots[0]?.id ?? "", subId: "" };

  const ids = getJobCategoryPathIds(value);
  if (!ids || ids.length === 0) return { mainId: JOB_TAXONOMY.roots[0]?.id ?? "", subId: "" };
  return {
    mainId: ids[0] ?? "",
    subId: ids.length >= 2 ? ids[1] : "",
  };
}

export default function JobCategoryPicker({
  value,
  onChange,
  placeholder = "Select a category",
  disabled,
  className,
  allowNonLeaf = false,
  allowAllOption = false,
  allValue = "all",
  allLabel = "All categories",
  label,
  helperText,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [{ mainId, subId }, setActive] = useState(() => deriveActiveIds(value, allValue));

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(deriveActiveIds(value, allValue));
  }, [open, value, allValue]);

  const selectedDisplay = useMemo(() => {
    if (allowAllOption && value === allValue) return allLabel;
    if (!value) return "";
    return getJobCategoryDisplay(value, { separator: " \u203A ", unknownFallback: value });
  }, [allowAllOption, allLabel, allValue, value]);

  const mainNodes = JOB_TAXONOMY.roots;
  const activeMain = mainNodes.find((node) => node.id === mainId) ?? mainNodes[0];
  const subNodes = activeMain?.children ?? [];
  const activeSub = subNodes.find((node) => node.id === subId) ?? subNodes[0];
  const leafNodes = activeSub?.children ?? [];

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return JOB_TAXONOMY.leaves
      .map((node) => ({ id: node.id, display: getJobCategoryDisplay(node.id, { unknownFallback: node.label }) }))
      .filter((item) => item.display.toLowerCase().includes(term))
      .slice(0, 80);
  }, [query]);

  const Field = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(true)}
      className={cn(
        "w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-left text-sm transition focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100/70 disabled:bg-slate-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("truncate", selectedDisplay ? "text-slate-900" : "text-slate-400")}>
            {selectedDisplay || placeholder}
          </div>
        </div>
        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </button>
  );

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm font-medium text-slate-700">{label}</label> : null}
      {Field}
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={allowNonLeaf ? "Choose a category" : "Choose a specialization"}
      >
        <div className="space-y-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories..." />

          {allowAllOption && (
            <button
              type="button"
              onClick={() => {
                onChange(allValue);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                value === allValue
                  ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                  : "border-slate-200/70 bg-white/80 text-slate-700 hover:border-slate-300"
              )}
            >
              <span>{allLabel}</span>
              <span className="text-xs font-semibold text-slate-400">Reset</span>
            </button>
          )}

          {query.trim() ? (
            <div className="max-h-[55vh] overflow-auto rounded-2xl border border-slate-200/70 bg-white/70">
              {searchResults.length === 0 ? (
                <div className="p-4 text-sm text-slate-600">No matches.</div>
              ) : (
                <div className="divide-y divide-slate-200/70">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/80",
                        value === item.id ? "bg-emerald-50/60" : ""
                      )}
                    >
                      <span className="min-w-0 truncate font-semibold text-slate-900">{item.display}</span>
                      <span className="text-xs font-semibold text-slate-400">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white/70">
                <div className="border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Main
                </div>
                <div className="max-h-[45vh] overflow-auto p-2">
                  {mainNodes.map((node) => (
                    <div key={node.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActive({ mainId: node.id, subId: node.children[0]?.id ?? "" })}
                        className={cn(
                          "flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                          node.id === mainId ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white/80"
                        )}
                      >
                        {node.label}
                      </button>
                      {allowNonLeaf && (
                        <button
                          type="button"
                          onClick={() => {
                            onChange(node.id);
                            setOpen(false);
                          }}
                          className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                        >
                          Use
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70">
                <div className="border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Subcategory
                </div>
                <div className="max-h-[45vh] overflow-auto p-2">
                  {subNodes.length === 0 ? (
                    <div className="p-4 text-sm text-slate-600">Pick a main category first.</div>
                  ) : (
                    subNodes.map((node) => (
                      <div key={node.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActive({ mainId: mainId, subId: node.id })}
                          className={cn(
                            "flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                            node.id === subId ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white/80"
                          )}
                        >
                          {node.label}
                        </button>
                        {allowNonLeaf && (
                          <button
                            type="button"
                            onClick={() => {
                              onChange(node.id);
                              setOpen(false);
                            }}
                            className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                          >
                            Use
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70">
                <div className="border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Specialization
                </div>
                <div className="max-h-[45vh] overflow-auto p-2">
                  {leafNodes.length === 0 ? (
                    <div className="p-4 text-sm text-slate-600">Pick a subcategory to see specializations.</div>
                  ) : (
                    leafNodes.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          onChange(node.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/80",
                          node.id === value ? "bg-emerald-50/60 text-emerald-800" : "text-slate-700"
                        )}
                      >
                        <span className="min-w-0 truncate">{node.label}</span>
                        <span className="text-xs font-semibold text-slate-400">Select</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              Clear selection
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

