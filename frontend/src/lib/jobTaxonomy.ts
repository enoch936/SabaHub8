import { JOB_TAXONOMY_SOURCE } from "@/lib/jobTaxonomySource";

export type JobCategoryDepth = 0 | 1 | 2;

export type JobCategoryNode = {
  id: string;
  label: string;
  depth: JobCategoryDepth;
  parentId?: string;
  children: JobCategoryNode[];
};

export type JobTaxonomy = {
  roots: JobCategoryNode[];
  byId: Map<string, JobCategoryNode>;
  all: JobCategoryNode[];
  leaves: JobCategoryNode[];
};

const ROOT_PARENT_KEY = "__root__";

export function slugifyCategorySegment(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " ")
    .replace(/\+/g, " plus ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "unknown";
}

function dedupeSlug(parentKey: string, slugBase: string, counts: Map<string, Map<string, number>>) {
  const bySlug = counts.get(parentKey) ?? new Map<string, number>();
  counts.set(parentKey, bySlug);

  const next = (bySlug.get(slugBase) ?? 0) + 1;
  bySlug.set(slugBase, next);
  return next === 1 ? slugBase : `${slugBase}-${next}`;
}

export function buildJobTaxonomy(source: string = JOB_TAXONOMY_SOURCE): JobTaxonomy {
  const roots: JobCategoryNode[] = [];
  const byId = new Map<string, JobCategoryNode>();
  const all: JobCategoryNode[] = [];
  const leaves: JobCategoryNode[] = [];

  const counts = new Map<string, Map<string, number>>();

  let currentRoot: JobCategoryNode | null = null;
  let currentSub: JobCategoryNode | null = null;

  const lines = source.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim()) continue;

    const connectorMatch = line.match(/[├└]─\s*(.+)$/);
    if (!connectorMatch) {
      const label = line.trim();
      const slugBase = slugifyCategorySegment(label);
      const slug = dedupeSlug(ROOT_PARENT_KEY, slugBase, counts);
      const id = slug;

      const node: JobCategoryNode = { id, label, depth: 0, children: [] };
      roots.push(node);
      all.push(node);
      byId.set(id, node);
      currentRoot = node;
      currentSub = null;
      continue;
    }

    const label = connectorMatch[1].trim();
    const connectorPos = Math.max(line.indexOf("├─"), line.indexOf("└─"));
    const depth: JobCategoryDepth = connectorPos <= 2 ? 1 : 2;

    const parent = depth === 1 ? currentRoot : currentSub;
    if (!parent) {
      // Ignore malformed lines rather than throwing during app boot.
      continue;
    }

    const slugBase = slugifyCategorySegment(label);
    const slug = dedupeSlug(parent.id, slugBase, counts);
    const id = `${parent.id}.${slug}`;
    const node: JobCategoryNode = { id, label, depth, parentId: parent.id, children: [] };

    parent.children.push(node);
    all.push(node);
    byId.set(id, node);

    if (depth === 1) currentSub = node;
    if (depth === 2) leaves.push(node);
  }

  return { roots, byId, all, leaves };
}

export const JOB_TAXONOMY: JobTaxonomy = buildJobTaxonomy();

export function getJobCategoryPathIds(categoryId: string): string[] | null {
  const node = JOB_TAXONOMY.byId.get(categoryId);
  if (!node) return null;
  const ids: string[] = [node.id];
  let parentId = node.parentId;
  while (parentId) {
    ids.push(parentId);
    parentId = JOB_TAXONOMY.byId.get(parentId)?.parentId;
  }
  return ids.reverse();
}

export function getJobCategoryPathLabels(categoryId: string): string[] | null {
  const ids = getJobCategoryPathIds(categoryId);
  if (!ids) return null;
  return ids.map((id) => JOB_TAXONOMY.byId.get(id)?.label ?? id);
}

export function getJobCategoryDisplay(categoryId?: string, options?: { separator?: string; unknownFallback?: string }) {
  if (!categoryId) return options?.unknownFallback ?? "";
  const labels = getJobCategoryPathLabels(categoryId);
  if (!labels) return options?.unknownFallback ?? categoryId;
  return labels.join(options?.separator ?? " \u203A ");
}

function normalizePathLabel(value: string) {
  return value.trim().toLowerCase();
}

export function findJobCategoryIdByDisplay(display?: string) {
  if (!display) return null;
  const labels = display
    .split(">")
    .map((label) => label.trim())
    .filter(Boolean);
  return findJobCategoryIdByLabels(labels);
}

export function findJobCategoryIdByLabels(labels?: string[] | null) {
  if (!labels || labels.length === 0) return null;
  const normalizedLabels = labels.map(normalizePathLabel);

  for (const node of JOB_TAXONOMY.leaves) {
    const pathLabels = getJobCategoryPathLabels(node.id);
    if (!pathLabels || pathLabels.length !== normalizedLabels.length) continue;
    const normalizedPath = pathLabels.map(normalizePathLabel);
    if (normalizedPath.every((label, index) => label === normalizedLabels[index])) {
      return node.id;
    }
  }

  return null;
}

export function jobCategoryMatches(jobCategoryId: string | undefined, filterCategoryId: string) {
  if (!filterCategoryId || filterCategoryId === "all") return true;
  if (!jobCategoryId) return false;
  return jobCategoryId === filterCategoryId || jobCategoryId.startsWith(`${filterCategoryId}.`);
}
