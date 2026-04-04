import { newId } from "./utils";

export const PASSWORD     = "wtproduct2026";
export const STORAGE_KEY  = "wetrials-monthly-v4";

// ── Config maps ───────────────────────────────────────────────────────────────
export const IMPACT_CONFIG = {
  high:   { label: "High",   cls: "bg-red-50 text-red-700 border-red-200"        },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200"  },
  low:    { label: "Low",    cls: "bg-gray-100 text-gray-500 border-gray-200"    },
};

export const DIRECTION_CONFIG = {
  positive: { label: "↑ Positive", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  neutral:  { label: "→ Neutral",  cls: "bg-gray-100 text-gray-600 border-gray-200"          },
  negative: { label: "↓ Negative", cls: "bg-red-50 text-red-700 border-red-200"              },
};

export const STATUS_CONFIG = {
  done:          { label: "Done",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "in-progress": { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  pending:       { label: "Pending",     cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  "off-track":   { label: "Off Track",   cls: "bg-red-50 text-red-700 border-red-200"             },
  planned:       { label: "Planned",     cls: "bg-gray-100 text-gray-500 border-gray-200"         },
};

export const SEVERITY_CONFIG = {
  low:      { label: "Low",      cls: "bg-blue-50 text-blue-600 border-blue-200"       },
  medium:   { label: "Medium",   cls: "bg-amber-50 text-amber-700 border-amber-200"    },
  high:     { label: "High",     cls: "bg-orange-50 text-orange-700 border-orange-200" },
  critical: { label: "Critical", cls: "bg-red-100 text-red-800 border-red-300"         },
};

export const PRIORITY_CONFIG = {
  highest: { label: "Highest", cls: "bg-red-50 text-red-700 border-red-200"          },
  high:    { label: "High",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
  medium:  { label: "Medium",  cls: "bg-gray-100 text-gray-600 border-gray-200"      },
  low:     { label: "Low",     cls: "bg-blue-50 text-blue-600 border-blue-200"       },
};

export const CATEGORY_CONFIG = {
  "ai-platform":    { label: "AI Platform"    },
  "growth":         { label: "Growth"         },
  "partner":        { label: "Partner"        },
  "infrastructure": { label: "Infrastructure" },
  "analytics":      { label: "Analytics"      },
  "research":       { label: "Research"       },
  "compliance":     { label: "Compliance"     },
  "other":          { label: "Other"          },
};

// ── Makers ────────────────────────────────────────────────────────────────────
export const makeExecItem     = () => ({ id: newId(), title: "", summary: "", impact: "medium", direction: "neutral", details: "", detailsOpen: false });
export const makeInsightItem  = () => ({ id: newId(), title: "", summary: "", impact: "medium", direction: "neutral" });
export const makeDelivery     = () => ({ id: newId(), title: "", status: "in-progress", priority: "medium", category: "other", notes: "" });
export const makeRisk         = () => ({ id: newId(), text: "", severity: "medium", mitigation: "", owner: "" });
export const makeKPI          = () => ({ id: newId(), label: "New KPI", value: "", prevValue: "", sub: "" });
export const makeCustomModule = () => ({ id: newId(), title: "New Module", description: "", items: [] });
export const makeModuleItem   = () => ({ id: newId(), text: "", status: "in-progress" });

export const makeMonthData = () => ({
  executiveSummary: "",
  kpis: [
    { id: newId(), label: "Total Users",     value: "", prevValue: "", sub: "Registered"   },
    { id: newId(), label: "User Requests",   value: "", prevValue: "", sub: "All time"     },
    { id: newId(), label: "Total Studies",   value: "", prevValue: "", sub: "Study DB"     },
    { id: newId(), label: "Active Partners", value: "", prevValue: "", sub: "With updates" },
  ],
  insights:          [],
  delivery:          [],
  risks:             [],
  nextMonthPriorities: [],
  customModules:     [],
});

// ── Storage helpers ───────────────────────────────────────────────────────────
export const monthKey = (month, year) => `${year}-${String(month + 1).padStart(2, "0")}`;

export function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
