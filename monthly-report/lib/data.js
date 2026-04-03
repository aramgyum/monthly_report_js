import { newId } from "./utils";

export const STORAGE_KEY = "wetrials-monthly-v1";

export const OVERALL_CONFIG = {
  "on-track":  { label: "✅ On Track",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "at-risk":   { label: "⚠️ At Risk",   cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  "off-track": { label: "🔴 Off Track", cls: "bg-red-50 text-red-700 border-red-200"             },
};

export const IMPACT_CONFIG = {
  positive: { label: "Positive", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  neutral:  { label: "Neutral",  cls: "bg-gray-50 text-gray-600 border-gray-200"          },
  negative: { label: "Negative", cls: "bg-red-50 text-red-700 border-red-200"             },
  watch:    { label: "Watch",    cls: "bg-amber-50 text-amber-700 border-amber-200"        },
};

export const STATUS_CONFIG = {
  done:          { label: "Done",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "in-progress": { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  pending:       { label: "Pending",     cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  "off-track":   { label: "Off Track",   cls: "bg-red-50 text-red-700 border-red-200"             },
  planned:       { label: "Planned",     cls: "bg-gray-50 text-gray-600 border-gray-200"          },
};

export const SEVERITY_CONFIG = {
  low:      { label: "Low",      cls: "bg-blue-50 text-blue-700 border-blue-200"   },
  medium:   { label: "Medium",   cls: "bg-amber-50 text-amber-700 border-amber-200"},
  high:     { label: "High",     cls: "bg-orange-50 text-orange-700 border-orange-200" },
  critical: { label: "Critical", cls: "bg-red-100 text-red-800 border-red-300"     },
};

export const PRIORITY_CONFIG = {
  highest: { label: "⏫ Highest", cls: "bg-red-50 text-red-700 border-red-200"           },
  high:    { label: "🔼 High",    cls: "bg-orange-50 text-orange-700 border-orange-200"  },
  medium:  { label: "➖ Medium",  cls: "bg-gray-50 text-gray-600 border-gray-200"        },
  low:     { label: "🔽 Low",     cls: "bg-blue-50 text-blue-600 border-blue-200"        },
  lowest:  { label: "⏬ Lowest",  cls: "bg-slate-50 text-slate-500 border-slate-200"     },
};

export const PARTNER_STATUS_CONFIG = {
  active:   { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  engaged:  { label: "Engaged",  cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  stalled:  { label: "Stalled",  cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  new:      { label: "New",      cls: "bg-purple-50 text-purple-700 border-purple-200"    },
  churned:  { label: "Churned",  cls: "bg-red-50 text-red-500 border-red-200"             },
};

export const makeInitialData = () => ({
  company: "WeTrials",
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  overallStatus: "on-track",
  primaryFocus: "",
  primaryRisk: "",
  kpis: [
    { id: newId(), label: "Valid Studies in DB",  value: "", prevValue: "", sub: "Study DB"           },
    { id: newId(), label: "User Requests",         value: "", prevValue: "", sub: "All time"           },
    { id: newId(), label: "Active Partners",       value: "", prevValue: "", sub: "With updates"       },
    { id: newId(), label: "Open Roadmap Items",    value: "", prevValue: "", sub: "In progress / plan" },
  ],
  signals:  [],
  delivery: [],
  risks:    [],
  focus:    [],
  partners: [],
});

export const makeSignal   = () => ({ id: newId(), text: "", impact: "neutral" });
export const makeDelivery = () => ({ id: newId(), title: "", status: "in-progress", priority: "medium", notes: "" });
export const makeRisk     = () => ({ id: newId(), text: "", severity: "medium", mitigation: "", owner: "" });
export const makeFocus    = () => ({ id: newId(), goal: "", timeline: "", owner: "" });
export const makePartner  = () => ({ id: newId(), name: "", status: "active", notes: "" });
