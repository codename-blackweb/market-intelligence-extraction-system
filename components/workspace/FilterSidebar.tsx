"use client";

import { ListFilter, Radar, Search, ShieldCheck } from "lucide-react";
import type { WorkspaceFilters } from "@/lib/types";
import styles from "./workspace-ui.module.css";

type FilterOptions = {
  depths: string[];
  modes: string[];
  intentStages: string[];
};

export default function FilterSidebar({
  filters,
  options,
  resultCount,
  onSearchChange,
  onToggle,
  onClear
}: {
  filters: WorkspaceFilters;
  options: FilterOptions;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onToggle: (
    field: keyof Pick<WorkspaceFilters, "depths" | "modes" | "visibility" | "intentStages">,
    value: string
  ) => void;
  onClear: () => void;
}) {
  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <div>
          <h2 className={styles.filterTitle}>Filters</h2>
          <p className={styles.filterCount}>{resultCount} analyses visible</p>
        </div>
        <span className={styles.planBadge}>
          <ListFilter size={14} />
          Desktop
        </span>
      </div>

      <input
        className={styles.filterSearch}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search query, market, or tag"
        value={filters.search}
      />

      <div className={styles.filterGroup}>
        <div className={styles.filterGroupLabel}>
          <Search size={14} />
          Visibility
        </div>
        {(["public", "private"] as const).map((value) => (
          <label className={styles.filterOption} key={value}>
            <span className={styles.filterControl}>
              <input
                checked={filters.visibility.includes(value)}
                className={styles.filterCheckbox}
                onChange={() => onToggle("visibility", value)}
                type="checkbox"
              />
              {value === "public" ? "Shared / Public" : "Private"}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.filterGroupLabel}>
          <Radar size={14} />
          Mode
        </div>
        {options.modes.map((value) => (
          <label className={styles.filterOption} key={value}>
            <span className={styles.filterControl}>
              <input
                checked={filters.modes.includes(value)}
                className={styles.filterCheckbox}
                onChange={() => onToggle("modes", value)}
                type="checkbox"
              />
              {value}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.filterGroupLabel}>
          <ShieldCheck size={14} />
          Depth
        </div>
        {options.depths.map((value) => (
          <label className={styles.filterOption} key={value}>
            <span className={styles.filterControl}>
              <input
                checked={filters.depths.includes(value)}
                className={styles.filterCheckbox}
                onChange={() => onToggle("depths", value)}
                type="checkbox"
              />
              {value}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.filterGroupLabel}>
          <ListFilter size={14} />
          Intent stage
        </div>
        {options.intentStages.map((value) => (
          <label className={styles.filterOption} key={value}>
            <span className={styles.filterControl}>
              <input
                checked={filters.intentStages.includes(value)}
                className={styles.filterCheckbox}
                onChange={() => onToggle("intentStages", value)}
                type="checkbox"
              />
              {value}
            </span>
          </label>
        ))}
      </div>

      <button className={styles.secondaryAction + " " + styles.clearFilters} onClick={onClear} type="button">
        Clear filters
      </button>
    </div>
  );
}
