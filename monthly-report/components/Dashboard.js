"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Plus, X, Download, Upload, Printer,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Activity, BarChart3, Zap, AlertTriangle, Target, Handshake,
  Folder, Star, FlaskConical, Globe, Shield, BookOpen,
  Award, Building2, Radio, Lightbulb, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS, pctChange, newId } from "@/lib/utils";
import {
  STORAGE_KEY, OVERALL_CONFIG,
  DIRECTION_CONFIG, IMPACT_CONFIG, STATUS_CONFIG,
  SEVERITY_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG,
  PARTNER_STATUS_CONFIG, CUSTOM_MODULE_ICONS,
  makeInitialData, makeBullet, makeInsight, makeDelivery,
  makeRisk, makePartner, makeCustomModule, makeModuleItem,
} from "@/lib/data";

// ── Icon registry for custom modules ─────────────────────────────────────────
const MOD_ICONS = {
  folder: Folder, star: Star, zap: Zap, flask: FlaskConical,
  handshake: Handshake, building: Building2, award: Award,
  book: BookOpen, globe: Globe, shield: Shield, target: Target,
  trending: TrendingUp,
};

// ── Option arrays ─────────────────────────────────────────────────────────────
const opts = (cfg) => Object.entries(cfg).map(([v, c]) => ({ value: v, label: c.label }));
const directionOpts  = opts(DIRECTION_CONFIG);
const impactOpts     = opts(IMPACT_CONFIG);
const statusOpts     = opts(STATUS_CONFIG);
const severityOpts   = opts(SEVERITY_CONFIG);
const priorityOpts   = opts(PRIORITY_CONFIG);
const categoryOpts   = opts(CATEGORY_CONFIG);
const partnerOpts    = opts(PARTNER_STATUS_CONFIG);
const overallOpts    = Object.entries(OVERALL_CONFIG).map(([v,c]) => ({ value: v, label: `${c.emoji} ${c.label}` }));

// ── Reorder helper ────────────────────────────────────────────────────────────
function reorder(list, from, to) {
  const r = [...list];
  const [m] = r.splice(from, 1);
  r.splice(to, 0, m);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function Input({ className, ...p }) {
  return (
    <input className={cn(
      "w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800",
      "placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-colors",
      className
    )} {...p} />
  );
}

function Textarea({ className, ...p }) {
  return (
    <textarea rows={1} className={cn(
      "w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 resize-none",
      "placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-colors",
      className
    )} {...p} />
  );
}

function Pill({ className, children }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

function StyledSelect({ value, onChange, options, cfg, className }) {
  const selected = cfg?.[value];
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full rounded-md border px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500/30 cursor-pointer appearance-none transition-colors",
        selected?.cls || "bg-gray-50 text-gray-600 border-gray-200",
        className
      )}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function DragHandle(dragProps) {
  return (
    <span {...dragProps}
      className="no-print flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors self-center"
      title="Drag to reorder">
      <GripVertical size={14} />
    </span>
  );
}

function SectionHeader({ number, title, icon: Icon, onAdd, addLabel = "Add", children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {number && <span className="text-xs font-semibold text-gray-300">0{number}</span>}
        <Icon size={13} className="text-gray-400" />
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onAdd && (
          <button onClick={onAdd}
            className="no-print inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-md px-2.5 py-1 transition-colors">
            <Plus size={12} /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ className, children }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl overflow-hidden", className)}>
      {children}
    </div>
  );
}

function ColHeader({ cols }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
      <div className="no-print w-4 flex-shrink-0" />
      {cols.map((c, i) => (
        <div key={i} className={cn("text-xs font-semibold text-gray-400 uppercase tracking-wider", c.cls)}>
          {c.label}
        </div>
      ))}
      <div className="no-print w-5 flex-shrink-0" />
    </div>
  );
}

function EmptyRow({ label = "No items yet — click Add to create one." }) {
  return (
    <div className="px-4 py-8 text-xs text-gray-400 text-center">{label}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bullet list (Executive Summary / Next Month Priorities)
// ─────────────────────────────────────────────────────────────────────────────
function BulletSection({ id, items, onAdd, onDelete, onReorder, onUpdate, placeholder }) {
  function handleDragEnd(r) {
    if (!r.destination) return;
    onReorder(reorder(items, r.source.index, r.destination.index));
  }
  return (
    <Card>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={id}>
          {(prov, snap) => (
            <div ref={prov.innerRef} {...prov.droppableProps}
              className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/30")}>
              {items.length === 0 && <EmptyRow label="No bullets yet — click Add to create one." />}
              {items.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(prov2, snap2) => (
                    <div ref={prov2.innerRef} {...prov2.draggableProps}
                      className={cn("item-row flex items-center gap-2 px-4 py-2.5 group hover:bg-gray-50 transition-colors",
                        snap2.isDragging && "bg-white shadow-md rounded-lg")}>
                      <DragHandle {...prov2.dragHandleProps} />
                      <span className="text-gray-300 text-sm flex-shrink-0">—</span>
                      <Textarea value={item.text} onChange={e => onUpdate(idx, e.target.value)}
                        placeholder={placeholder} className="flex-1 border-0 bg-transparent p-0 focus:ring-0 resize-none text-sm text-gray-700" />
                      <button onClick={() => onDelete(idx)}
                        className="row-del no-print text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Cards
// ─────────────────────────────────────────────────────────────────────────────
function KPISection({ kpis, onChange }) {
  function update(idx, field, val) {
    onChange(kpis.map((k, i) => i === idx ? { ...k, [field]: val } : k));
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, idx) => {
        const delta = pctChange(k.prevValue, k.value);
        const isPos = delta !== null && delta > 0;
        const isNeg = delta !== null && delta < 0;
        const TrendIcon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
        const pctCls = isPos ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isNeg ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-gray-50 text-gray-500 border-gray-200";
        return (
          <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-4 relative group hover:border-gray-300 transition-colors">
            <button onClick={() => onChange(kpis.filter((_, i) => i !== idx))}
              className="row-del no-print absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors">
              <X size={12} />
            </button>

            {/* Title */}
            <input value={k.label} onChange={e => update(idx, "label", e.target.value)}
              placeholder="KPI name"
              className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-full border-0 p-0 bg-transparent focus:outline-none mb-3 pr-5" />

            {/* Prev → Now */}
            <div className="flex items-end gap-1 mb-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">Prev</div>
                <input value={k.prevValue} onChange={e => update(idx, "prevValue", e.target.value)} placeholder="—"
                  className="w-full text-base font-semibold text-gray-400 border border-gray-100 rounded-md px-2 py-1 bg-gray-50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20" />
              </div>
              <span className="text-gray-300 mb-1.5 px-0.5">→</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">Now</div>
                <input value={k.value} onChange={e => update(idx, "value", e.target.value)} placeholder="—"
                  className="w-full text-xl font-bold text-gray-900 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20" />
              </div>
            </div>

            {/* Delta + subtitle */}
            <div className="flex items-center gap-2 mb-2">
              <Pill className={pctCls}>
                <TrendIcon size={10} className="mr-0.5" />
                {delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "—"}
              </Pill>
              <input value={k.sub} onChange={e => update(idx, "sub", e.target.value)} placeholder="subtitle"
                className="text-xs text-gray-400 flex-1 min-w-0 border-0 p-0 bg-transparent focus:outline-none" />
            </div>

            {/* Optional insight */}
            <input value={k.insight || ""} onChange={e => update(idx, "insight", e.target.value)}
              placeholder="+ insight (optional)"
              className="w-full text-xs text-gray-500 italic border-0 p-0 bg-transparent focus:outline-none" />
          </div>
        );
      })}

      {/* Add KPI card */}
      <button onClick={() => onChange([...kpis, { id: newId(), label: "New KPI", value: "", prevValue: "", sub: "", insight: "" }])}
        className="no-print border-2 border-dashed border-gray-200 rounded-xl p-4 text-xs text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center gap-1 min-h-[160px]">
        <Plus size={18} />
        Add KPI
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic drag table section
// ─────────────────────────────────────────────────────────────────────────────
function DragTable({ id, items, onAdd, onDelete, onReorder, colHeaders, renderCols, addLabel = "Add" }) {
  function handleDragEnd(r) {
    if (!r.destination) return;
    onReorder(reorder(items, r.source.index, r.destination.index));
  }
  return (
    <Card>
      {colHeaders && <ColHeader cols={colHeaders} />}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={id}>
          {(prov, snap) => (
            <div ref={prov.innerRef} {...prov.droppableProps}
              className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
              {items.length === 0 && <EmptyRow />}
              {items.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(prov2, snap2) => (
                    <div ref={prov2.innerRef} {...prov2.draggableProps}
                      className={cn("item-row flex items-center gap-2 px-4 py-2.5 group hover:bg-gray-50 transition-colors",
                        snap2.isDragging && "bg-white shadow-md rounded-lg")}>
                      <DragHandle {...prov2.dragHandleProps} />
                      {renderCols(item, idx)}
                      <button onClick={() => onDelete(idx)}
                        className="row-del no-print text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 ml-auto">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Module block
// ─────────────────────────────────────────────────────────────────────────────
function CustomModuleBlock({ mod, onUpdate, onDelete, onAddItem, onDeleteItem, onUpdateItem, onReorderItems }) {
  const Icon = MOD_ICONS[mod.icon] || Folder;
  const [collapsed, setCollapsed] = useState(false);

  function handleItemDragEnd(r) {
    if (!r.destination) return;
    onReorderItems(reorder(mod.items, r.source.index, r.destination.index));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <Icon size={14} className="text-gray-400 flex-shrink-0" />
        <input value={mod.title} onChange={e => onUpdate("title", e.target.value)}
          className="flex-1 text-sm font-semibold text-gray-700 border-0 bg-transparent focus:outline-none min-w-0" />
        <div className="flex items-center gap-1 no-print ml-auto">
          <button onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button onClick={onAddItem}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-md px-2 py-0.5 transition-colors">
            <Plus size={11} /> Add
          </button>
          <button onClick={onDelete}
            className="text-gray-300 hover:text-red-400 transition-colors p-1">
            <X size={13} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Optional description */}
          <div className="px-4 py-2 border-b border-gray-50">
            <input value={mod.description} onChange={e => onUpdate("description", e.target.value)}
              placeholder="Module description or notes (optional)"
              className="w-full text-xs text-gray-500 border-0 bg-transparent focus:outline-none italic placeholder:not-italic placeholder:text-gray-300" />
          </div>

          {/* Items */}
          <DragDropContext onDragEnd={handleItemDragEnd}>
            <Droppable droppableId={`mod-${mod.id}`}>
              {(prov, snap) => (
                <div ref={prov.innerRef} {...prov.droppableProps}
                  className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                  {mod.items.length === 0 && <EmptyRow label="No items yet." />}
                  {mod.items.map((item, idx) => (
                    <Draggable key={item.id} draggableId={item.id} index={idx}>
                      {(prov2, snap2) => (
                        <div ref={prov2.innerRef} {...prov2.draggableProps}
                          className={cn("item-row flex items-center gap-2 px-4 py-2.5 group hover:bg-gray-50 transition-colors",
                            snap2.isDragging && "bg-white shadow-md rounded-lg")}>
                          <DragHandle {...prov2.dragHandleProps} />
                          <Textarea value={item.text} onChange={e => onUpdateItem(idx, "text", e.target.value)}
                            placeholder="Item description…"
                            className="flex-1 border-0 bg-transparent p-0 focus:ring-0 text-sm text-gray-700" />
                          <div className="w-28 flex-shrink-0">
                            <StyledSelect value={item.status} onChange={v => onUpdateItem(idx, "status", v)}
                              options={statusOpts} cfg={STATUS_CONFIG} />
                          </div>
                          <button onClick={() => onDeleteItem(idx)}
                            className="row-del no-print text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {prov.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [saved, setSaved]   = useState(false);
  const [addMod, setAddMod] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setData(raw ? JSON.parse(raw) : makeInitialData());
    } catch { setData(makeInitialData()); }
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const set = useCallback((field, val) => setData(d => ({ ...d, [field]: val })), []);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading…</div>
  );

  // Section helpers
  function secAdd(f, mk)       { setData(d => ({ ...d, [f]: [mk(), ...d[f]] })); }
  function secDel(f, i)        { setData(d => ({ ...d, [f]: d[f].filter((_,x) => x!==i) })); }
  function secReorder(f, next) { setData(d => ({ ...d, [f]: next })); }
  function secUpd(f, i, k, v)  { setData(d => ({ ...d, [f]: d[f].map((it,x) => x===i ? {...it,[k]:v} : it) })); }

  // Bullet helpers (text-only update)
  function bulletUpd(f, i, v) { setData(d => ({ ...d, [f]: d[f].map((it,x) => x===i ? {...it,text:v} : it) })); }

  // Custom module helpers
  function modAdd()      { setData(d => ({ ...d, customModules: [...d.customModules, makeCustomModule()] })); }
  function modDel(i)     { setData(d => ({ ...d, customModules: d.customModules.filter((_,x) => x!==i) })); }
  function modUpd(i,k,v) { setData(d => ({ ...d, customModules: d.customModules.map((m,x) => x===i ? {...m,[k]:v} : m) })); }
  function modItemAdd(i)       { setData(d => ({ ...d, customModules: d.customModules.map((m,x) => x===i ? {...m, items:[makeModuleItem(),...m.items]} : m) })); }
  function modItemDel(i,j)     { setData(d => ({ ...d, customModules: d.customModules.map((m,x) => x===i ? {...m, items:m.items.filter((_,y)=>y!==j)} : m) })); }
  function modItemUpd(i,j,k,v) { setData(d => ({ ...d, customModules: d.customModules.map((m,x) => x===i ? {...m, items:m.items.map((it,y)=>y===j?{...it,[k]:v}:it)} : m) })); }
  function modItemReorder(i,next){ setData(d => ({ ...d, customModules: d.customModules.map((m,x) => x===i ? {...m,items:next} : m) })); }

  // Export / Import
  function exportJSON() {
    const blob = new Blob([JSON.stringify({...data, savedAt: new Date().toISOString()}, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${data.company.replace(/\s+/g,"-").toLowerCase()}-${MONTHS[data.month]}-${data.year}.json`;
    a.click();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }
  function importJSON(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { try { setData(JSON.parse(ev.target.result)); } catch { alert("Invalid JSON."); } };
    r.readAsText(f); e.target.value = "";
  }

  const overall = OVERALL_CONFIG[data.overallStatus] || OVERALL_CONFIG["on-track"];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 no-print">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity size={14} className="text-white" />
            </div>
            <input value={data.company} onChange={e => set("company", e.target.value)}
              className="text-sm font-semibold text-gray-900 border-0 bg-transparent focus:outline-none w-32" />
            <span className="text-gray-200 text-sm">|</span>
            <select value={data.month} onChange={e => set("month", +e.target.value)}
              className="text-sm text-gray-600 border-0 bg-transparent focus:outline-none font-medium">
              {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={data.year} onChange={e => set("year", +e.target.value)}
              className="text-sm text-gray-600 border-0 bg-transparent focus:outline-none font-medium w-20">
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 no-print">
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <Upload size={12} /> Load JSON
              <input type="file" accept=".json" className="hidden" onChange={importJSON} />
            </label>
            <button onClick={exportJSON}
              className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-white rounded-lg px-3 py-1.5 transition-colors",
                saved ? "bg-emerald-600" : "bg-brand-600 hover:bg-brand-700")}>
              <Download size={12} /> {saved ? "Saved!" : "Export JSON"}
            </button>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <Printer size={12} /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-8">

        {/* ── Status Banner ────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</span>
              <select value={data.overallStatus} onChange={e => set("overallStatus", e.target.value)}
                className={cn("text-xs font-semibold border rounded-full px-3 py-1 focus:outline-none cursor-pointer", overall.cls)}>
                {overallOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="h-3.5 w-px bg-gray-200" />
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Zap size={12} className="text-gray-400 flex-shrink-0" />
              <input value={data.primaryFocus} onChange={e => set("primaryFocus", e.target.value)}
                placeholder="Primary focus this month"
                className="flex-1 text-sm text-gray-700 border-0 bg-transparent focus:outline-none" />
            </div>
            <div className="h-3.5 w-px bg-gray-200" />
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
              <input value={data.primaryRisk} onChange={e => set("primaryRisk", e.target.value)}
                placeholder="Primary risk"
                className="flex-1 text-sm text-gray-600 border-0 bg-transparent focus:outline-none" />
            </div>
          </div>
        </div>

        {/* ── 01 Executive Summary ─────────────────────────────────────────── */}
        <section>
          <SectionHeader number={1} title="Executive Summary" icon={BookOpen}
            onAdd={() => secAdd("executiveSummary", () => makeBullet())} addLabel="Add bullet" />
          <BulletSection id="exec-summary"
            items={data.executiveSummary}
            onAdd={() => secAdd("executiveSummary", () => makeBullet())}
            onDelete={i => secDel("executiveSummary", i)}
            onReorder={n => secReorder("executiveSummary", n)}
            onUpdate={(i,v) => bulletUpd("executiveSummary", i, v)}
            placeholder="Key strategic observation for this month…" />
        </section>

        {/* ── 02 KPI Snapshot ──────────────────────────────────────────────── */}
        <section>
          <SectionHeader number={2} title="KPI Snapshot" icon={BarChart3} />
          <KPISection kpis={data.kpis} onChange={next => set("kpis", next)} />
        </section>

        {/* ── 03 Key Business Insights ─────────────────────────────────────── */}
        <section>
          <SectionHeader number={3} title="Key Business Insights" icon={Activity}
            onAdd={() => secAdd("insights", makeInsight)} addLabel="Add insight" />
          <DragTable
            id="insights"
            items={data.insights}
            onAdd={() => secAdd("insights", makeInsight)}
            onDelete={i => secDel("insights", i)}
            onReorder={n => secReorder("insights", n)}
            colHeaders={[
              { label: "Observation / Signal", cls: "flex-1" },
              { label: "Direction",             cls: "w-28"   },
              { label: "Impact",                cls: "w-24"   },
              { label: "Implication",           cls: "w-48"   },
            ]}
            renderCols={(item, idx) => <>
              <Textarea value={item.text} onChange={e => secUpd("insights",idx,"text",e.target.value)}
                placeholder="What happened or was observed…"
                className="flex-1 border-0 bg-transparent p-0 focus:ring-0 text-sm text-gray-700" />
              <div className="w-28 flex-shrink-0">
                <StyledSelect value={item.direction} onChange={v => secUpd("insights",idx,"direction",v)}
                  options={directionOpts} cfg={DIRECTION_CONFIG} />
              </div>
              <div className="w-24 flex-shrink-0">
                <StyledSelect value={item.impact} onChange={v => secUpd("insights",idx,"impact",v)}
                  options={impactOpts} cfg={IMPACT_CONFIG} />
              </div>
              <Input value={item.implication} onChange={e => secUpd("insights",idx,"implication",e.target.value)}
                placeholder="So what…" className="w-48 flex-shrink-0" />
            </>}
          />
        </section>

        {/* ── 04 Product & Delivery ────────────────────────────────────────── */}
        <section>
          <SectionHeader number={4} title="Product & Delivery" icon={Zap}
            onAdd={() => secAdd("delivery", makeDelivery)} addLabel="Add item" />
          <DragTable
            id="delivery"
            items={data.delivery}
            onAdd={() => secAdd("delivery", makeDelivery)}
            onDelete={i => secDel("delivery", i)}
            onReorder={n => secReorder("delivery", n)}
            colHeaders={[
              { label: "Feature / Initiative", cls: "flex-1" },
              { label: "Status",               cls: "w-28"   },
              { label: "Priority",             cls: "w-24"   },
              { label: "Category",             cls: "w-32"   },
              { label: "Notes",                cls: "w-40"   },
            ]}
            renderCols={(item, idx) => <>
              <Input value={item.title} onChange={e => secUpd("delivery",idx,"title",e.target.value)}
                placeholder="Feature or initiative name…" className="flex-1" />
              <div className="w-28 flex-shrink-0">
                <StyledSelect value={item.status} onChange={v => secUpd("delivery",idx,"status",v)}
                  options={statusOpts} cfg={STATUS_CONFIG} />
              </div>
              <div className="w-24 flex-shrink-0">
                <StyledSelect value={item.priority} onChange={v => secUpd("delivery",idx,"priority",v)}
                  options={priorityOpts} cfg={PRIORITY_CONFIG} />
              </div>
              <div className="w-32 flex-shrink-0">
                <select value={item.category} onChange={e => secUpd("delivery",idx,"category",e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-brand-500 appearance-none">
                  {categoryOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <Input value={item.notes} onChange={e => secUpd("delivery",idx,"notes",e.target.value)}
                placeholder="Notes…" className="w-40 flex-shrink-0 text-gray-500" />
            </>}
          />
        </section>

        {/* ── Custom Modules ───────────────────────────────────────────────── */}
        {data.customModules.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="Custom Modules" icon={Folder}
              onAdd={modAdd} addLabel="Add module" />
            {data.customModules.map((mod, i) => (
              <CustomModuleBlock key={mod.id}
                mod={mod}
                onUpdate={(k,v) => modUpd(i,k,v)}
                onDelete={() => modDel(i)}
                onAddItem={() => modItemAdd(i)}
                onDeleteItem={j => modItemDel(i,j)}
                onUpdateItem={(j,k,v) => modItemUpd(i,j,k,v)}
                onReorderItems={next => modItemReorder(i,next)}
              />
            ))}
          </section>
        )}

        {/* ── 05 Risks & Constraints ───────────────────────────────────────── */}
        <section>
          <SectionHeader number={5} title="Risks & Constraints" icon={AlertTriangle}
            onAdd={() => secAdd("risks", makeRisk)} addLabel="Add risk" />
          <DragTable
            id="risks"
            items={data.risks}
            onAdd={() => secAdd("risks", makeRisk)}
            onDelete={i => secDel("risks", i)}
            onReorder={n => secReorder("risks", n)}
            colHeaders={[
              { label: "Risk / Constraint",  cls: "flex-1" },
              { label: "Severity",           cls: "w-24"   },
              { label: "Business Impact",    cls: "w-44"   },
              { label: "Mitigation",         cls: "w-44"   },
              { label: "Owner",              cls: "w-28"   },
            ]}
            renderCols={(item, idx) => <>
              <Textarea value={item.text} onChange={e => secUpd("risks",idx,"text",e.target.value)}
                placeholder="Describe the risk or constraint…"
                className="flex-1 border-0 bg-transparent p-0 focus:ring-0 text-sm text-gray-700" />
              <div className="w-24 flex-shrink-0">
                <StyledSelect value={item.severity} onChange={v => secUpd("risks",idx,"severity",v)}
                  options={severityOpts} cfg={SEVERITY_CONFIG} />
              </div>
              <Input value={item.businessImpact} onChange={e => secUpd("risks",idx,"businessImpact",e.target.value)}
                placeholder="Business consequence…" className="w-44 flex-shrink-0 text-gray-500" />
              <Input value={item.mitigation} onChange={e => secUpd("risks",idx,"mitigation",e.target.value)}
                placeholder="Mitigation plan…" className="w-44 flex-shrink-0 text-gray-500" />
              <Input value={item.owner} onChange={e => secUpd("risks",idx,"owner",e.target.value)}
                placeholder="Owner…" className="w-28 flex-shrink-0 text-gray-500" />
            </>}
          />
        </section>

        {/* ── Partners ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Partners" icon={Handshake}
            onAdd={() => secAdd("partners", makePartner)} addLabel="Add partner" />
          <DragTable
            id="partners"
            items={data.partners}
            onAdd={() => secAdd("partners", makePartner)}
            onDelete={i => secDel("partners", i)}
            onReorder={n => secReorder("partners", n)}
            colHeaders={[
              { label: "Partner",        cls: "w-44"   },
              { label: "Status",         cls: "w-28"   },
              { label: "Update / Notes", cls: "flex-1" },
            ]}
            renderCols={(item, idx) => <>
              <Input value={item.name} onChange={e => secUpd("partners",idx,"name",e.target.value)}
                placeholder="Partner name…" className="w-44 flex-shrink-0 font-medium" />
              <div className="w-28 flex-shrink-0">
                <StyledSelect value={item.status} onChange={v => secUpd("partners",idx,"status",v)}
                  options={partnerOpts} cfg={PARTNER_STATUS_CONFIG} />
              </div>
              <Textarea value={item.notes} onChange={e => secUpd("partners",idx,"notes",e.target.value)}
                placeholder="Update, next steps, notes…"
                className="flex-1 border-0 bg-transparent p-0 focus:ring-0 text-sm text-gray-500" />
            </>}
          />
        </section>

        {/* ── 06 Next Month Priorities ─────────────────────────────────────── */}
        <section>
          <SectionHeader number={6} title="Next Month Priorities" icon={Target}
            onAdd={() => secAdd("nextMonthPriorities", () => makeBullet())} addLabel="Add priority" />
          <BulletSection id="next-priorities"
            items={data.nextMonthPriorities}
            onAdd={() => secAdd("nextMonthPriorities", () => makeBullet())}
            onDelete={i => secDel("nextMonthPriorities", i)}
            onReorder={n => secReorder("nextMonthPriorities", n)}
            onUpdate={(i,v) => bulletUpd("nextMonthPriorities", i, v)}
            placeholder="Leadership-level priority for next month…" />
        </section>

        {/* ── Add Custom Module CTA ─────────────────────────────────────────── */}
        <div className="no-print flex justify-center pb-4">
          <button onClick={modAdd}
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-brand-600 border border-dashed border-gray-300 hover:border-brand-300 rounded-xl px-6 py-3 hover:bg-brand-50 transition-colors">
            <Plus size={13} /> Add custom module (grant, SR&amp;ED, research, partnership…)
          </button>
        </div>

        <div className="text-center text-xs text-gray-300 py-2 no-print">
          {data.company} · {MONTHS[data.month]} {data.year} · Auto-saved to browser
        </div>
      </main>
    </div>
  );
}
