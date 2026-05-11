/**
 * Returns Tailwind CSS grid-cols classes for responsive column layouts.
 *
 * Breakpoint mapping:
 *   sm  → default (mobile-first, no prefix)
 *   md  → md: prefix  (≥768px)
 *   lg  → lg: prefix  (≥1024px)
 *
 * Example:
 *   responsiveGrid({ sm: 1, md: 2, lg: 3 })
 *   // → "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
 */
export function responsiveGrid(cols: {
  sm?: number;
  md?: number;
  lg?: number;
}): string {
  const classes: string[] = ["grid"];

  if (cols.sm !== undefined) classes.push(`grid-cols-${cols.sm}`);
  if (cols.md !== undefined) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg !== undefined) classes.push(`lg:grid-cols-${cols.lg}`);

  return classes.join(" ");
}

/**
 * Preset: 3-column → 2-column → 1-column (desktop → tablet → mobile)
 */
export const GRID_3_2_1 = responsiveGrid({ sm: 1, md: 2, lg: 3 });

/**
 * Preset: 2-column → 1-column (tablet → mobile)
 */
export const GRID_2_1 = responsiveGrid({ sm: 1, md: 2 });
