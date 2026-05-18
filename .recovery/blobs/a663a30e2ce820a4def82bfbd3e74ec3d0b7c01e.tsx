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

const DURATION_OPTIONS = ["1 week", "1 month", "3 months", "6+ months", "Ongoing"];

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
		<div className="space-y-6 sticky top-4">
			<div className="flex items-center justify-between px-2">
				<div className="flex items-center gap-2 font-bold text-white uppercase tracking-widest text-xs">
					<SlidersHorizontal className="w-4 h-4 text-blue-400" />
					Refine Search
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
					className="text-[10px] font-bold uppercase text-white/40 hover:text-white transition-colors"
				>
					Reset
				</button>
			</div>

			<div className="space-y-4">
				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Keyword</label>
					<input
						type="text"
						value={filters.search ?? ""}
						onChange={(e) => onChange({ search: e.target.value || undefined })}
						placeholder="Keywords, skills..."
						className="glass-input w-full text-white"
					/>
				</div>

				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Sort By</label>
					<select
						value={filters.sortBy ?? "relevance"}
						onChange={(e) => onChange({ sortBy: e.target.value as JobFilters["sortBy"] })}
						className="glass-input w-full text-white appearance-none cursor-pointer"
					>
						<option value="relevance" className="bg-[#0f172a]">Relevance</option>
						<option value="date" className="bg-[#0f172a]">Newest first</option>
						<option value="budget" className="bg-[#0f172a]">Highest budget</option>
					</select>
				</div>

				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Media Requirements</label>
					<div className="grid grid-cols-2 gap-2">
						{[
							{ value: "ALL", label: "Any", icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
							{ value: "VISUAL", label: "Visual", icon: <ImageIcon className="h-3.5 w-3.5" /> },
							{ value: "VIDEO", label: "Video", icon: <Video className="h-3.5 w-3.5" /> },
							{ value: "DOCUMENT", label: "Files", icon: <FileText className="h-3.5 w-3.5" /> },
						].map((item) => (
							<button
								key={item.value}
								onClick={() => onChange({ mediaFilter: item.value as JobFilters["mediaFilter"] })}
								className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold transition-all border ${
									(filters.mediaFilter ?? "ALL") === item.value
										? "bg-white/10 text-white border-white/20 shadow-neon-blue"
										: "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"
								}`}
							>
								{item.icon}
								{item.label}
							</button>
						))}
					</div>
				</div>

				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Budget (USD)</label>
					<div className="flex gap-2">
						<input
							type="number"
							value={filters.budgetMin ?? ""}
							onChange={(e) =>
								onChange({ budgetMin: e.target.value ? Number(e.target.value) : undefined })
							}
							placeholder="Min"
							className="glass-input w-full text-white"
						/>
						<input
							type="number"
							value={filters.budgetMax ?? ""}
							onChange={(e) =>
								onChange({ budgetMax: e.target.value ? Number(e.target.value) : undefined })
							}
							placeholder="Max"
							className="glass-input w-full text-white"
						/>
					</div>
				</div>

				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Job Type</label>
					<div className="flex gap-2">
						{(["FIXED", "HOURLY"] as const).map((type) => (
							<button
								key={type}
								onClick={() => onChange({ jobType: filters.jobType === type ? undefined : type })}
								className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${
									filters.jobType === type
										? "bg-white/10 text-white border-white/20 shadow-neon-blue"
										: "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
								}`}
							>
								{type}
							</button>
						))}
					</div>
				</div>

				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Experience</label>
					<div className="grid grid-cols-1 gap-2">
						{(["ENTRY", "INTERMEDIATE", "EXPERT"] as const).map((level) => (
							<button
								key={level}
								onClick={() => onChange({ experienceLevel: filters.experienceLevel === level ? undefined : level })}
								className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
									filters.experienceLevel === level
										? "bg-white/10 text-white border-white/20 shadow-neon-blue"
										: "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
								}`}
							>
								{level.charAt(0) + level.slice(1).toLowerCase()}
								{filters.experienceLevel === level && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-neon-blue" />}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-3 pt-2">
					<label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-all">
						<span className="text-[11px] font-bold text-white/60">Remote only</span>
						<input
							type="checkbox"
							checked={filters.isRemote === true}
							onChange={(e) => onChange({ isRemote: e.target.checked ? true : undefined })}
							className="w-4 h-4 rounded-md accent-blue-500"
						/>
					</label>
					
					<label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-all">
						<span className="text-[11px] font-bold text-white/60">Saved only</span>
						<input
							type="checkbox"
							checked={filters.savedOnly === true}
							onChange={(e) => onChange({ savedOnly: e.target.checked ? true : undefined })}
							className="w-4 h-4 rounded-md accent-blue-500"
						/>
					</label>

					<label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-all">
						<div className="flex items-center gap-2">
							<BadgeCheck className="h-4 w-4 text-emerald-400" />
							<span className="text-[11px] font-bold text-white/60">Verified only</span>
						</div>
						<input
							type="checkbox"
							checked={filters.employerVerified === true}
							onChange={(e) => onChange({ employerVerified: e.target.checked ? true : undefined })}
							className="w-4 h-4 rounded-md accent-blue-500"
						/>
					</label>
				</div>

				<div>
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Top Skills</label>
					<div className="flex flex-wrap gap-1.5">
						{SKILL_OPTIONS.map((skill) => (
							<button
								key={skill}
								onClick={() => toggleSkill(skill)}
								className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
									filters.skills?.includes(skill)
										? "bg-blue-500/20 text-blue-400 border-blue-500/30"
										: "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"
								}`}
							>
								{skill}
							</button>
						))}
					</div>
				</div>

				<div className="pt-4 space-y-3">
					<label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 px-2">Filter Presets</label>

					{savedPresets.length > 0 && onLoadPreset && (
						<div className="grid grid-cols-1 gap-1.5">
							{savedPresets.map((preset) => (
								<button
									key={preset.id}
									onClick={() => onLoadPreset(preset)}
									className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-white/60 hover:text-white hover:border-white/20 transition-all"
								>
									<FolderOpen className="w-3.5 h-3.5 text-blue-400" />
									<span className="truncate">{preset.name}</span>
								</button>
							))}
						</div>
					)}

					{onSavePreset &&
						(showPresetInput ? (
							<div className="flex gap-1.5">
								<input
									type="text"
									value={presetName}
									onChange={(e) => setPresetName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
									placeholder="Name..."
									className="glass-input flex-1 !py-2 text-[11px]"
								/>
								<button
									onClick={handleSavePreset}
									className="glass-button px-3 !py-2 text-[11px]"
								>
									Save
								</button>
								<button
									onClick={() => setShowPresetInput(false)}
									className="p-2 rounded-xl bg-white/5 border border-white/5"
								>
									<X className="w-3.5 h-3.5 text-white/40" />
								</button>
							</div>
						) : (
							<button
								onClick={() => setShowPresetInput(true)}
								className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-[11px] font-bold text-white/40 hover:text-white hover:border-white/30 transition-all"
							>
								<Save className="w-3.5 h-3.5" />
								Create Preset
							</button>
						))}
				</div>
			</div>
		</div>
	);
}
