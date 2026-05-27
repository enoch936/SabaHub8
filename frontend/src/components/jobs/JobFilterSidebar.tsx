"use client";

import { useState } from "react";
import {
  BadgeCheck,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Save,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react";
import type { FilterPreset, JobFilters } from "@/lib/types";

const SKILL_OPTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Figma",
  "AWS",
  "Docker",
  "PostgreSQL",
  "GraphQL",
  "Vue.js",
];

const DURATION_OPTIONS = [
  "1 week",
  "1 month",
  "3 months",
  "6+ months",
  "Ongoing",
];

interface JobFilterSidebarProps {
  filters: JobFilters;
  onChange: (filters: Partial<JobFilters>) => void;
  onSavePreset?: (name: string) => void;
  savedPresets?: FilterPreset[];
  onLoadPreset?: (preset: FilterPreset) => void;
}

export function JobFilterSidebar({
  filters,
  onChange,
  onSavePreset,
  savedPresets = [],
  onLoadPreset,
}: JobFilterSidebarProps) {
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);

  const toggleSkill = (skill: string) => {
    const current = filters.skills ?? [];
    const next = current.includes(skill)
      ? current.filter((listedSkill) => listedSkill !== skill)
      : [...current, skill];
    onChange({ skills: next });
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim());
      setPresetName("");
      setShowPresetInput(false);
    }
  };

  return (
    <div className="sheet-panel p-5 space-y-5 sticky top-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </div>
        <button
          onClick={() =>
            onChange({
              search: undefined,
              categories: [],
              jobType: undefined,
              experienceLevel: undefined,
              skills: [],
              isRemote: undefined,
              budgetMin: undefined,
              budgetMax: undefined,
              duration: undefined,
              timezone: undefined,
              employerVerified: undefined,
              savedOnly: undefined,
              mediaFilter: "ALL",
              sortBy: undefined,
              page: 1,
            })
          }
          className="text-xs text-muted-foreground"
        >
          Clear all
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Search</label>
        <input
          type="text"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
          placeholder="Keywords, skills..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Sort By</label>
        <select
          value={filters.sortBy ?? "relevance"}
          onChange={(e) =>
            onChange({ sortBy: e.target.value as JobFilters["sortBy"] })
          }
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="relevance">Relevance</option>
          <option value="date">Newest first</option>
          <option value="budget">Highest budget</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Media Requirements
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              value: "ALL",
              label: "Any",
              icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
            },
            {
              value: "VISUAL",
              label: "Visual",
              icon: <ImageIcon className="h-3.5 w-3.5" />,
            },
            {
              value: "VIDEO",
              label: "Video",
              icon: <Video className="h-3.5 w-3.5" />,
            },
            {
              value: "DOCUMENT",
              label: "Files",
              icon: <FileText className="h-3.5 w-3.5" />,
            },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() =>
                onChange({
                  mediaFilter: item.value as JobFilters["mediaFilter"],
                })
              }
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition active:scale-95 ${
                (filters.mediaFilter ?? "ALL") === item.value
                  ? "border-[var(--border)] bg-[var(--accent)] text-foreground"
                  : "border-[var(--border)] text-muted-foreground hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Budget (USD)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.budgetMin ?? ""}
            onChange={(e) =>
              onChange({
                budgetMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Min"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            value={filters.budgetMax ?? ""}
            onChange={(e) =>
              onChange({
                budgetMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Max"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Job Type</label>
        <div className="flex gap-2">
          {(["FIXED", "HOURLY"] as const).map((type) => (
            <button
              key={type}
              onClick={() =>
                onChange({
                  jobType: filters.jobType === type ? undefined : type,
                })
              }
              className={`flex-1 py-1.5 rounded-lg text-sm border transition active:scale-95 ${
                filters.jobType === type
                  ? "bg-[var(--accent)] text-foreground border-[var(--border)]"
                  : "border-[var(--border)] hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Experience Level
        </label>
        <div className="space-y-1.5">
          {(["ENTRY", "INTERMEDIATE", "EXPERT"] as const).map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="experience"
                checked={filters.experienceLevel === level}
                onChange={() =>
                  onChange({
                    experienceLevel:
                      filters.experienceLevel === level ? undefined : level,
                  })
                }
                className="accent-primary"
              />
              <span className="text-sm">
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Duration</label>
        <select
          value={filters.duration ?? ""}
          onChange={(e) => onChange({ duration: e.target.value || undefined })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Any duration</option>
          {DURATION_OPTIONS.map((duration) => (
            <option key={duration} value={duration}>
              {duration}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Timezone</label>
        <input
          type="text"
          value={filters.timezone ?? ""}
          onChange={(e) => onChange({ timezone: e.target.value || undefined })}
          placeholder="e.g. UTC, UTC-5..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isRemote === true}
            onChange={(e) =>
              onChange({ isRemote: e.target.checked ? true : undefined })
            }
            className="accent-primary"
          />
          <span className="text-sm font-medium">Remote only</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.savedOnly === true}
            onChange={(e) =>
              onChange({ savedOnly: e.target.checked ? true : undefined })
            }
            className="accent-primary"
          />
          <span className="text-sm font-medium">Saved items only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.employerVerified === true}
            onChange={(e) =>
              onChange({
                employerVerified: e.target.checked ? true : undefined,
              })
            }
            className="accent-primary"
          />
          <span className="flex items-center gap-2 text-sm font-medium">
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
            Verified employers
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Skills</label>
        <div className="flex flex-wrap gap-1.5">
          {SKILL_OPTIONS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`text-xs px-2 py-1 rounded-md border transition active:scale-95 ${
                filters.skills?.includes(skill)
                  ? "bg-[var(--accent)] text-foreground border-[var(--border)]"
                  : "border-[var(--border)] hover:bg-gray-100"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Filter Presets</label>

        {savedPresets.length > 0 && onLoadPreset && (
          <div className="space-y-1">
            {savedPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onLoadPreset(preset)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-left transition hover:bg-gray-100 active:scale-95"
              >
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{preset.name}</span>
              </button>
            ))}
          </div>
        )}

        {onSavePreset &&
          (showPresetInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                placeholder="Preset name..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSavePreset}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] text-sm"

              >
                Save
              </button>
              <button
                onClick={() => setShowPresetInput(false)}
                className="p-1.5 rounded-lg border border-[var(--border)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPresetInput(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[var(--border)] text-sm text-muted-foreground"
            >
              <Save className="w-3.5 h-3.5" />
              Save as preset
            </button>
          ))}
      </div>
    </div>
  );
}
