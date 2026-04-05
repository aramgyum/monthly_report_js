import { newId } from "./utils";

export const PASSWORD     = "wtproduct2026";
export const STORAGE_KEY  = "wetrials-monthly-v4";

// ── Shared badge palette (single source of truth) ────────────────────────────
const BADGE = {
  high:        "bg-orange-50 text-orange-700 border-orange-200",
  medium:      "bg-amber-50  text-amber-700  border-amber-200",
  low:         "bg-blue-50   text-blue-600   border-blue-200",
  done:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  inProgress:  "bg-blue-50   text-blue-700   border-blue-200",
  pending:     "bg-amber-50  text-amber-700  border-amber-200",
  planned:     "bg-gray-100  text-gray-500   border-gray-200",
  offTrack:    "bg-red-50    text-red-700    border-red-200",
  critical:    "bg-red-100   text-red-800    border-red-300",
  neutral:     "bg-gray-100  text-gray-600   border-gray-200",
  positive:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  negative:    "bg-red-50    text-red-700    border-red-200",
};

// ── Config maps ───────────────────────────────────────────────────────────────
export const IMPACT_CONFIG = {
  high:   { label: "High",   cls: BADGE.high    },
  medium: { label: "Medium", cls: BADGE.medium  },
  low:    { label: "Low",    cls: BADGE.low     },
};

export const DIRECTION_CONFIG = {
  positive: { label: "↑ Positive", cls: BADGE.positive },
  neutral:  { label: "→ Neutral",  cls: BADGE.neutral  },
  negative: { label: "↓ Negative", cls: BADGE.negative },
};

export const STATUS_CONFIG = {
  done:          { label: "Done",        cls: BADGE.done       },
  "in-progress": { label: "In Progress", cls: BADGE.inProgress },
  pending:       { label: "Pending",     cls: BADGE.pending    },
  "off-track":   { label: "Off Track",   cls: BADGE.offTrack   },
  planned:       { label: "Planned",     cls: BADGE.planned    },
};

export const SEVERITY_CONFIG = {
  low:      { label: "Low",      cls: BADGE.low      },
  medium:   { label: "Medium",   cls: BADGE.medium   },
  high:     { label: "High",     cls: BADGE.high     },
  critical: { label: "Critical", cls: BADGE.critical },
};

export const PRIORITY_CONFIG = {
  highest: { label: "Highest", cls: BADGE.critical },
  high:    { label: "High",    cls: BADGE.high     },
  medium:  { label: "Medium",  cls: BADGE.medium   },
  low:     { label: "Low",     cls: BADGE.low      },
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

export const MILESTONE_STATUS_CONFIG = {
  completed:    { label: "Completed",   cls: BADGE.done       },
  "in-progress":{ label: "In Progress", cls: BADGE.inProgress },
  planned:      { label: "Planned",     cls: BADGE.planned    },
};

export const PARTNER_ENGAGEMENT_CONFIG = {
  active:     { label: "Active",     cls: BADGE.done       },
  exploring:  { label: "Exploring",  cls: BADGE.inProgress },
  paused:     { label: "Paused",     cls: BADGE.pending    },
  completed:  { label: "Completed",  cls: BADGE.neutral    },
};

// ── Makers ────────────────────────────────────────────────────────────────────
export const makeExecItem          = () => ({ id: newId(), title: "", summary: "", impact: "medium", direction: "neutral", details: "", detailsOpen: false });
export const makeInsightItem       = () => ({ id: newId(), title: "", summary: "", impact: "medium", direction: "neutral" });
export const makeDelivery          = () => ({ id: newId(), title: "", status: "in-progress", priority: "medium", notes: "" });
export const makeRisk              = () => ({ id: newId(), text: "", severity: "medium", mitigation: "", owner: "" });
export const makeKPI               = () => ({ id: newId(), label: "New KPI", value: "", prevValue: "", prevLabel: "Prev", nowLabel: "Now", sub: "" });
export const makeCustomModule      = () => ({ id: newId(), title: "New Module", description: "", items: [] });
export const makeModuleItem        = () => ({ id: newId(), text: "", status: "in-progress" });
export const makePartnerMilestone  = () => ({ id: newId(), partner: "", milestone: "", status: "in-progress", priority: "medium", note: "" });
export const makeComingMonthItem   = () => ({ id: newId(), text: "" });
export const makePartner           = () => ({ id: newId(), name: "", engagement: "active", description: "" });

export const makeMonthData = () => ({
  executiveSummary:     "",
  kpis: [
    { id: newId(), label: "Total Users",     value: "", prevValue: "", sub: "Registered"   },
    { id: newId(), label: "User Requests",   value: "", prevValue: "", sub: "All time"     },
    { id: newId(), label: "Total Studies",   value: "", prevValue: "", sub: "Study DB"     },
    { id: newId(), label: "Active Partners", value: "", prevValue: "", sub: "With updates" },
  ],
  insights:             [],
  delivery:             [],
  partnerMilestones:    [],
  comingMonthItems:     [],
  risks:                [],
  partners:             [],
  customModules:        [],
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
