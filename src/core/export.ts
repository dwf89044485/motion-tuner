// ── Vibeset Core — Export ───────────────────────────────────

import type { ChangeSet, ParamChange, TargetChanges } from "./types.js";
import type { TargetRegistry } from "./registry.js";
import type { ConfigStore } from "./store.js";

export interface ExportModule {
  exportChanges(): ChangeSet;
  exportChangesAsText(): string;
}

export function createExportModule(
  registry: TargetRegistry,
  store: ConfigStore,
): ExportModule {
  function exportChanges(): ChangeSet {
    const targets: TargetChanges[] = [];

    for (const [id, entry] of registry.getAll()) {
      const diffs = store.getDiff(id);
      if (diffs.length === 0) continue;

      const changes: ParamChange[] = diffs.map((d) => {
        const paramDef = entry.def.schema.find((p) => p.key === d.key);
        return {
          key: d.key,
          from: d.from,
          to: d.to,
          label: paramDef?.label ?? d.key,
        };
      });

      targets.push({
        targetId: id,
        targetLabel: entry.def.label,
        changes,
      });
    }

    return { targets };
  }

  function exportChangesAsText(): string {
    const cs = exportChanges();
    if (cs.targets.length === 0) return "No changes.";

    const lines: string[] = [];
    for (const t of cs.targets) {
      lines.push(`[${t.targetLabel}]`);
      for (const c of t.changes) {
        lines.push(`  ${c.label}: ${c.from} → ${c.to}`);
      }
    }
    return lines.join("\n");
  }

  return { exportChanges, exportChangesAsText };
}
