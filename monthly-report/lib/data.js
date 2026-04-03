import { newId } from "./utils";

export const STORAGE_KEY = "wetrials-monthly-v2";

export const OVERALL_CONFIG = {
  "on-track":  { label: "On Track",  emoji: "✅", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "at-risk":   { label: "At Risk",   emoji: "⚠️", cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  "off-track": { label: "Off Track", emoji: "🔴", cls: "bg-red-50 text-red-700 border-red-200"             },
};

export const DIRECTION_CONFIG = {
  positive: { label: "Positive", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  neutral:  { label: "Neutral",  cls: "bg-gray-50 text-gray-600 border-gray-200"          },
  negative: { label: "Negative", cls: "bg-red-50 text-red-700 border-red-200"             },
};

export const IMPACT_CONFIG = {
  high:   { label: "High",   cls: "bg-red-50 text-red-600 border-red-200"           },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200"     },
  low:    { label: "Low",    cls: "bg-gray-50 text-gray-500 border-gray-200"        },
};

export const STATUS_CONFIG = {
  done:          { label: "Done",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "in-progress": { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  pending:       { label: "Pending",     cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  "off-track":   { label: "Off Track",   cls: "bg-red-50 text-red-700 border-red-200"             },
  planned:       { label: "Planned",     cls: "bg-gray-50 text-gray-500 border-gray-200"          },
};

export const SEVERITY_CONFIG = {
  low:      { label: "Low",      cls: "bg-blue-50 text-blue-600 border-blue-200"        },
  medium:   { label: "Medium",   cls: "bg-amber-50 text-amber-700 border-amber-200"     },
  high:     { label: "High",     cls: "bg-orange-50 text-orange-700 border-orange-200"  },
  critical: { label: "Critical", cls: "bg-red-100 text-red-800 border-red-300"          },
};

export const PRIORITY_CONFIG = {
  highest: { label: "Highest", cls: "bg-red-50 text-red-700 border-red-200"           },
  high:    { label: "High",    cls: "bg-orange-50 text-orange-700 border-orange-200"  },
  medium:  { label: "Medium",  cls: "bg-gray-50 text-gray-600 border-gray-200"        },
  low:     { label: "Low",     cls: "bg-blue-50 text-blue-600 border-blue-200"        },
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

export const PARTNER_STATUS_CONFIG = {
  active:   { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  engaged:  { label: "Engaged",  cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  stalled:  { label: "Stalled",  cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  new:      { label: "New",      cls: "bg-purple-50 text-purple-700 border-purple-200"    },
  churned:  { label: "Churned",  cls: "bg-red-50 text-red-500 border-red-200"             },
};

export const CUSTOM_MODULE_ICONS = [
  "folder", "star", "zap", "flask", "handshake", "building",
  "award", "book", "globe", "shield", "target", "trending",
];

export const makeInitialData = () => ({
  company: "WeTrials",
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  overallStatus: "on-track",
  primaryFocus: "",
  primaryRisk: "",
  executiveSummary: [],
  kpis: [
    { id: newId(), label: "Total Users",     value: "", prevValue: "", sub: "Registered",    insight: "" },
    { id: newId(), label: "User Requests",   value: "", prevValue: "", sub: "All time",      insight: "" },
    { id: newId(), label: "Total Studies",   value: "", prevValue: "", sub: "Study DB",      insight: "" },
    { id: newId(), label: "Active Partners", value: "", prevValue: "", sub: "With updates",  insight: "" },
  ],
  insights: [],
  delivery: [],
  risks: [],
  nextMonthPriorities: [],
  customModules: [],
  partners: [],
});

export const makeBullet        = (text = "") => ({ id: newId(), text });
export const makeInsight       = () => ({ id: newId(), text: "", direction: "neutral", impact: "medium", implication: "" });
export const makeDelivery      = () => ({ id: newId(), title: "", status: "in-progress", priority: "medium", category: "other", notes: "" });
export const makeRisk          = () => ({ id: newId(), text: "", severity: "medium", businessImpact: "", mitigation: "", owner: "" });
export const makePartner       = () => ({ id: newId(), name: "", status: "active", notes: "" });
export const makeCustomModule  = () => ({ id: newId(), title: "New Module", icon: "folder", description: "", items: [], visible: true });
export const makeModuleItem    = () => ({ id: newId(), text: "", status: "in-progress" });
