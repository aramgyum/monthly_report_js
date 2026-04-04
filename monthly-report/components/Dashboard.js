"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Plus, X, Printer, Save, Pencil, Check,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BookOpen, BarChart3, Activity, AlertTriangle,
  Target, Zap, Folder, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS, pctChange, newId } from "@/lib/utils";
import {
  PASSWORD, STORAGE_KEY,
  IMPACT_CONFIG, DIRECTION_CONFIG, STATUS_CONFIG,
  SEVERITY_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG,
  makeExecItem, makeInsightItem, makeDelivery, makeRisk,
  makeKPI, makeCustomModule, makeModuleItem, makeMonthData,
  monthKey, loadStore, saveStore,
} from "@/lib/data";

// ── Helpers ───────────────────────────────────────────────────────────────────
function reorder(list, from, to) {
  const r = [...list];
  const [m] = r.splice(from, 1);
  r.splice(to, 0, m);
  return r;
}
const opts = (cfg) => Object.entries(cfg).map(([v, c]) => ({ value: v, label: c.label }));

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD GATE
// ─────────────────────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState(false);
  const inp = useRef();

  useEffect(() => { inp.current?.focus(); }, []);

  function attempt() {
    if (pw === PASSWORD) {
      sessionStorage.setItem("auth", "1");
      onAuth();
    } else {
      setErr(true);
      setPw("");
      setTimeout(() => setErr(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 w-full max-w-sm text-center">
        <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Activity size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">WeTrials Reports</h1>
        <p className="text-sm text-gray-500 mb-7">Enter your password to continue</p>

        <input
          ref={inp}
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Password"
          className={cn(
            "w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 text-center tracking-widest focus:outline-none focus:ring-2 transition-colors mb-3",
            err
              ? "border-red-300 focus:ring-red-200 bg-red-50"
              : "border-gray-200 focus:ring-brand-500/20 focus:border-brand-500"
          )}
        />

        {err && <p className="text-xs text-red-500 mb-3">Incorrect password. Try again.</p>}

        <button onClick={attempt}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function TA({ className, editMode, ...p }) {
  return (
    <textarea
      readOnly={!editMode}
      className={cn(
        "w-full text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none transition-colors",
        editMode
          ? "border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 resize-y"
          : "border-transparent bg-transparent resize-none",
        className
      )}
      {...p}
    />
  );
}

function TI({ className, editMode, ...p }) {
  return (
    <input
      readOnly={!editMode}
      className={cn(
        "w-full text-sm placeholder:text-gray-300 focus:outline-none transition-colors",
        editMode
          ? "border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
          : "border-transparent bg-transparent text-gray-700",
        className
      )}
      {...p}
    />
  );
}

function SS({ value, onChange, options, cfg, editMode, className }) {
  const sel = cfg?.[value];
  if (!editMode) {
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", sel?.cls || "bg-gray-100 text-gray-500 border-gray-200")}>
        {sel?.label || value}
      </span>
    );
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500/20 cursor-pointer transition-colors appearance-none",
        sel?.cls || "bg-gray-100 text-gray-500 border-gray-200",
        className
      )}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function DragHandle(dragProps) {
  return (
    <span {...dragProps}
      className="no-print no-edit flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors self-start mt-2.5"
      title="Drag to reorder">
      <GripVertical size={14} />
    </span>
  );
}

function SectionWrap({ number, title, icon: Icon, onAdd, addLabel, children, className }) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {number && <span className="text-sm font-semibold text-gray-300 tabular-nums">{String(number).padStart(2,"0")}</span>}
          <Icon size={16} className="text-gray-400" />
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
        </div>
        {onAdd && (
          <button onClick={onAdd}
            className="no-print no-edit inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors">
            <Plus size={11} /> {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Card({ className, children }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl overflow-hidden", className)}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function DirectionToggle({ value, onChange, editMode }) {
  const opts = [
    { v: "positive", label: "↑", activeClass: "bg-emerald-50 text-emerald-700 border-emerald-300" },
    { v: "neutral",  label: "→", activeClass: "bg-gray-100 text-gray-600 border-gray-300"         },
    { v: "negative", label: "↓", activeClass: "bg-red-50 text-red-600 border-red-200"             },
  ];
  return (
    <div className={cn("flex rounded-lg overflow-hidden border border-gray-200 flex-shrink-0", !editMode && "pointer-events-none")}>
      {opts.map(o => (
        <button key={o.v} onClick={() => editMode && onChange(o.v)}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold transition-colors",
            value === o.v ? o.activeClass : "bg-white text-gray-300 hover:bg-gray-50",
            !editMode && "opacity-80"
          )}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXEC ROW  (used for Executive Summary AND Key Business Insights)
// ─────────────────────────────────────────────────────────────────────────────
function ExecRow({ item, idx, editMode, onUpdate, onDelete, provided, snapshot, showDetails = false }) {
  const [open, setOpen] = useState(item.detailsOpen || false);
  const impactOpts = opts(IMPACT_CONFIG);

  return (
    <div ref={provided.innerRef} {...provided.draggableProps}
      className={cn(
        "item-row bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow",
        snapshot.isDragging && "shadow-lg"
      )}>

      {/* Row header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <DragHandle {...provided.dragHandleProps} />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <TI
            editMode={editMode}
            value={item.title}
            onChange={e => onUpdate("title", e.target.value)}
            placeholder="Title…"
            className={cn("font-semibold text-gray-900", !editMode && "text-gray-900 px-0")}
          />
          {/* Summary */}
          <TA
            editMode={editMode}
            value={item.summary}
            onChange={e => onUpdate("summary", e.target.value)}
            placeholder="Summary — what happened, why it matters…"
            rows={2}
            className={cn(!editMode && "text-gray-600 px-0")}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <div className="w-24">
            <SS value={item.impact} onChange={v => onUpdate("impact", v)}
              options={impactOpts} cfg={IMPACT_CONFIG} editMode={editMode} />
          </div>
          <DirectionToggle value={item.direction} onChange={v => onUpdate("direction", v)} editMode={editMode} />

          {showDetails && editMode && (
            <button onClick={() => setOpen(!open)}
              className="no-edit text-gray-300 hover:text-gray-600 transition-colors p-1"
              title="Toggle details">
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          <button onClick={onDelete}
            className="row-del no-edit text-gray-300 hover:text-red-400 transition-colors p-1">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Details (expandable) */}
      {showDetails && open && (
        <div className="px-4 pb-3 pl-11 border-t border-gray-50 pt-2">
          <TA
            editMode={editMode}
            value={item.details || ""}
            onChange={e => onUpdate("details", e.target.value)}
            placeholder="Additional details, context, or next steps…"
            rows={2}
            className="text-gray-500 text-xs"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXEC LIST  (drag + ExecRow)
// ─────────────────────────────────────────────────────────────────────────────
function ExecList({ id, items, editMode, onUpdate, onDelete, onReorder, showDetails }) {
  function handleDragEnd(r) {
    if (!r.destination) return;
    onReorder(reorder(items, r.source.index, r.destination.index));
  }
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={id}>
        {(prov, snap) => (
          <div ref={prov.innerRef} {...prov.droppableProps}
            className={cn("space-y-2", snap.isDraggingOver && "bg-brand-50/20 rounded-xl p-1")}>
            {items.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                No items yet — click Add to create one.
              </div>
            )}
            {items.map((item, idx) => (
              <Draggable key={item.id} draggableId={item.id} index={idx}>
                {(prov2, snap2) => (
                  <ExecRow
                    item={item} idx={idx} editMode={editMode}
                    onUpdate={(k, v) => onUpdate(idx, k, v)}
                    onDelete={() => onDelete(idx)}
                    provided={prov2} snapshot={snap2}
                    showDetails={showDetails}
                  />
                )}
              </Draggable>
            ))}
            {prov.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────
function KPISection({ kpis, editMode, onChange }) {
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
        const pctCls = isPos
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : isNeg ? "bg-red-50 text-red-600 border-red-200"
          : "bg-gray-100 text-gray-500 border-gray-200";

        return (
          <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-4 relative group hover:border-gray-300 transition-colors">
            {editMode && (
              <button onClick={() => onChange(kpis.filter((_, i) => i !== idx))}
                className="no-edit absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            )}

            <input readOnly={!editMode} value={k.label}
              onChange={e => update(idx, "label", e.target.value)}
              placeholder="KPI name"
              className={cn(
                "text-xs font-semibold uppercase tracking-wider w-full border-0 p-0 bg-transparent focus:outline-none mb-3 pr-5",
                editMode ? "text-gray-500" : "text-gray-400"
              )} />

            {/* Prev → Now */}
            <div className="flex items-end gap-1 mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-1">Prev</div>
                <input readOnly={!editMode} value={k.prevValue}
                  onChange={e => update(idx, "prevValue", e.target.value)} placeholder="—"
                  className={cn(
                    "w-full text-base font-semibold focus:outline-none px-0",
                    editMode
                      ? "border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:border-brand-500"
                      : "border-transparent bg-transparent text-gray-400"
                  )} />
              </div>
              <span className="text-gray-300 mb-2 px-0.5 flex-shrink-0">→</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-1">Now</div>
                <input readOnly={!editMode} value={k.value}
                  onChange={e => update(idx, "value", e.target.value)} placeholder="—"
                  className={cn(
                    "w-full text-2xl font-bold text-gray-900 focus:outline-none px-0",
                    editMode
                      ? "border border-gray-200 rounded-lg px-2 py-1 focus:border-brand-500"
                      : "border-transparent bg-transparent"
                  )} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border", pctCls)}>
                <TrendIcon size={10} />
                {delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "—"}
              </span>
              <input readOnly={!editMode} value={k.sub}
                onChange={e => update(idx, "sub", e.target.value)} placeholder="subtitle"
                className="text-xs text-gray-400 flex-1 border-0 p-0 bg-transparent focus:outline-none" />
            </div>
          </div>
        );
      })}

      {editMode && (
        <button onClick={() => onChange([...kpis, makeKPI()])}
          className="no-edit border-2 border-dashed border-gray-200 rounded-xl p-4 text-xs text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center gap-1 min-h-[160px]">
          <Plus size={16} /> Add KPI
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC DRAG TABLE  (Product & Delivery, Risks)
// ─────────────────────────────────────────────────────────────────────────────
function DragTable({ id, items, editMode, onReorder, renderRow }) {
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
              className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
              {items.length === 0 && (
                <div className="px-4 py-8 text-sm text-gray-400 text-center">
                  No items yet{editMode ? " — click Add to create one." : "."}
                </div>
              )}
              {items.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(prov2, snap2) => (
                    <div ref={prov2.innerRef} {...prov2.draggableProps}
                      className={cn("item-row flex items-start gap-2 px-4 py-3 group hover:bg-gray-50 transition-colors",
                        snap2.isDragging && "bg-white shadow-md rounded-xl")}>
                      <DragHandle {...prov2.dragHandleProps} />
                      {renderRow(item, idx)}
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
// CUSTOM MODULE
// ─────────────────────────────────────────────────────────────────────────────
function CustomModBlock({ mod, editMode, onUpdate, onDelete, onAddItem, onDeleteItem, onUpdateItem, onReorderItems }) {
  const [collapsed, setCollapsed] = useState(false);

  function handleDrag(r) {
    if (!r.destination) return;
    onReorderItems(reorder(mod.items, r.source.index, r.destination.index));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Folder size={14} className="text-gray-400 flex-shrink-0" />
        <input readOnly={!editMode} value={mod.title}
          onChange={e => onUpdate("title", e.target.value)}
          className={cn("flex-1 text-sm font-semibold border-0 bg-transparent focus:outline-none",
            editMode ? "text-gray-700" : "text-gray-800")} />
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          {editMode && <>
            <button onClick={onAddItem}
              className="no-edit inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md px-2 py-0.5 hover:bg-gray-50 transition-colors">
              <Plus size={11} /> Add
            </button>
            <button onClick={onDelete}
              className="no-edit text-gray-300 hover:text-red-400 transition-colors p-1">
              <X size={13} />
            </button>
          </>}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="px-4 py-2 border-b border-gray-50">
            <input readOnly={!editMode} value={mod.description}
              onChange={e => onUpdate("description", e.target.value)}
              placeholder="Module description (optional)"
              className="w-full text-xs text-gray-500 border-0 bg-transparent focus:outline-none italic" />
          </div>

          <DragDropContext onDragEnd={handleDrag}>
            <Droppable droppableId={`mod-${mod.id}`}>
              {(prov, snap) => (
                <div ref={prov.innerRef} {...prov.droppableProps}
                  className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                  {mod.items.length === 0 && (
                    <div className="px-4 py-5 text-xs text-gray-400 text-center">No items yet.</div>
                  )}
                  {mod.items.map((item, idx) => (
                    <Draggable key={item.id} draggableId={item.id} index={idx}>
                      {(prov2, snap2) => (
                        <div ref={prov2.innerRef} {...prov2.draggableProps}
                          className={cn("item-row flex items-start gap-2 px-4 py-2.5 group hover:bg-gray-50 transition-colors",
                            snap2.isDragging && "bg-white shadow-md rounded-xl")}>
                          <DragHandle {...prov2.dragHandleProps} />
                          <TA editMode={editMode} value={item.text}
                            onChange={e => onUpdateItem(idx, "text", e.target.value)}
                            placeholder="Item description…" className="flex-1" rows={1} />
                          <div className="w-28 flex-shrink-0 pt-0.5">
                            <SS value={item.status} onChange={v => onUpdateItem(idx, "status", v)}
                              options={opts(STATUS_CONFIG)} cfg={STATUS_CONFIG} editMode={editMode} />
                          </div>
                          {editMode && (
                            <button onClick={() => onDeleteItem(idx)}
                              className="row-del no-edit text-gray-300 hover:text-red-400 transition-colors pt-1">
                              <X size={13} />
                            </button>
                          )}
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
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [authed, setAuthed]       = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [month, setMonth]         = useState(new Date().getMonth());
  const [year, setYear]           = useState(new Date().getFullYear());
  const [data, setData]           = useState(null);
  const [saveFlash, setSaveFlash] = useState(false);

  // Check session auth
  useEffect(() => {
    if (sessionStorage.getItem("auth") === "1") setAuthed(true);
  }, []);

  // Load data when month/year changes
  useEffect(() => {
    if (!authed) return;
    const store = loadStore();
    const key   = monthKey(month, year);
    setData(store[key] ? structuredClone(store[key]) : makeMonthData());
  }, [authed, month, year]);

  const set = useCallback((field, val) => setData(d => ({ ...d, [field]: val })), []);

  function save() {
    const store = loadStore();
    store[monthKey(month, year)] = data;
    saveStore(store);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  }

  // Section helpers
  function secAdd(f, mk)        { setData(d => ({ ...d, [f]: [mk(), ...d[f]] })); }
  function secDel(f, i)         { setData(d => ({ ...d, [f]: d[f].filter((_,x)=>x!==i) })); }
  function secReorder(f, next)  { setData(d => ({ ...d, [f]: next })); }
  function secUpd(f, i, k, v)   { setData(d => ({ ...d, [f]: d[f].map((it,x)=>x===i?{...it,[k]:v}:it) })); }

  function modDel(i)             { setData(d => ({ ...d, customModules: d.customModules.filter((_,x)=>x!==i) })); }
  function modUpd(i,k,v)         { setData(d => ({ ...d, customModules: d.customModules.map((m,x)=>x===i?{...m,[k]:v}:m) })); }
  function modItemAdd(i)         { setData(d => ({ ...d, customModules: d.customModules.map((m,x)=>x===i?{...m,items:[makeModuleItem(),...m.items]}:m) })); }
  function modItemDel(i,j)       { setData(d => ({ ...d, customModules: d.customModules.map((m,x)=>x===i?{...m,items:m.items.filter((_,y)=>y!==j)}:m) })); }
  function modItemUpd(i,j,k,v)   { setData(d => ({ ...d, customModules: d.customModules.map((m,x)=>x===i?{...m,items:m.items.map((it,y)=>y===j?{...it,[k]:v}:it)}:m) })); }
  function modItemReorder(i,next){ setData(d => ({ ...d, customModules: d.customModules.map((m,x)=>x===i?{...m,items:next}:m) })); }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading…</div>;

  const modeClass = editMode ? "edit-mode" : "read-mode";

  return (
    <div className={cn("min-h-screen bg-slate-50", modeClass)}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 no-print">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">

          {/* Branding + month/year */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">WeTrials</span>
            <span className="text-gray-200 text-lg">|</span>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="text-lg font-semibold text-gray-700 border-0 bg-transparent focus:outline-none cursor-pointer">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="text-lg font-semibold text-gray-700 border-0 bg-transparent focus:outline-none cursor-pointer w-24">
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 no-print">
            {/* Save */}
            <button onClick={save}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-4 py-2 transition-colors",
                saveFlash
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
              )}>
              {saveFlash ? <><Check size={14}/> Saved</> : <><Save size={14}/> Save</>}
            </button>

            {/* Edit toggle */}
            <button onClick={() => setEditMode(e => !e)}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-4 py-2 border transition-colors",
                editMode
                  ? "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}>
              <Pencil size={14}/> {editMode ? "Editing" : "Edit"}
            </button>

            {/* Print */}
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              <Printer size={14}/> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* ── 01 Executive Summary ────────────────────────────────────────── */}
        <SectionWrap number={1} title="Executive Summary" icon={BookOpen}
          onAdd={editMode ? () => secAdd("executiveSummary", makeExecItem) : null}
          addLabel="Add item">
          <ExecList
            id="exec-summary"
            items={data.executiveSummary}
            editMode={editMode}
            onUpdate={(i,k,v) => secUpd("executiveSummary",i,k,v)}
            onDelete={i => secDel("executiveSummary",i)}
            onReorder={n => secReorder("executiveSummary",n)}
            showDetails={true}
          />
        </SectionWrap>

        {/* ── 02 KPI Snapshot ─────────────────────────────────────────────── */}
        <SectionWrap number={2} title="KPI Snapshot" icon={BarChart3}>
          <KPISection kpis={data.kpis} editMode={editMode} onChange={next => set("kpis",next)} />
        </SectionWrap>

        {/* ── 03 Key Business Insights ────────────────────────────────────── */}
        <SectionWrap number={3} title="Key Business Insights" icon={Activity}
          onAdd={editMode ? () => secAdd("insights", makeInsightItem) : null}
          addLabel="Add insight">
          <ExecList
            id="insights"
            items={data.insights}
            editMode={editMode}
            onUpdate={(i,k,v) => secUpd("insights",i,k,v)}
            onDelete={i => secDel("insights",i)}
            onReorder={n => secReorder("insights",n)}
            showDetails={false}
          />
        </SectionWrap>

        {/* ── 04 Product & Delivery ───────────────────────────────────────── */}
        <SectionWrap number={4} title="Product & Delivery" icon={Zap}
          onAdd={editMode ? () => secAdd("delivery", makeDelivery) : null}
          addLabel="Add item">
          <DragTable id="delivery" items={data.delivery} editMode={editMode}
            onReorder={n => secReorder("delivery",n)}
            renderRow={(item, idx) => (
              <div className="flex-1 grid gap-2" style={{gridTemplateColumns:"1fr 130px 110px 160px"}}>
                <TA editMode={editMode} value={item.title}
                  onChange={e => secUpd("delivery",idx,"title",e.target.value)}
                  placeholder="Initiative or feature name…" rows={1} />
                <SS value={item.status} onChange={v => secUpd("delivery",idx,"status",v)}
                  options={opts(STATUS_CONFIG)} cfg={STATUS_CONFIG} editMode={editMode} />
                <SS value={item.priority} onChange={v => secUpd("delivery",idx,"priority",v)}
                  options={opts(PRIORITY_CONFIG)} cfg={PRIORITY_CONFIG} editMode={editMode} />
                <div className="flex items-start gap-2">
                  <TA editMode={editMode} value={item.notes}
                    onChange={e => secUpd("delivery",idx,"notes",e.target.value)}
                    placeholder="Notes…" rows={1} className="flex-1 text-gray-500 text-xs" />
                  {editMode && (
                    <button onClick={() => secDel("delivery",idx)}
                      className="row-del no-edit text-gray-300 hover:text-red-400 transition-colors pt-2 flex-shrink-0">
                      <X size={13}/>
                    </button>
                  )}
                </div>
              </div>
            )}
          />
        </SectionWrap>

        {/* ── 05 Risks & Constraints ──────────────────────────────────────── */}
        <SectionWrap number={5} title="Risks & Constraints" icon={AlertTriangle}
          onAdd={editMode ? () => secAdd("risks", makeRisk) : null}
          addLabel="Add risk">
          <DragTable id="risks" items={data.risks} editMode={editMode}
            onReorder={n => secReorder("risks",n)}
            renderRow={(item, idx) => (
              <div className="flex-1 grid gap-2" style={{gridTemplateColumns:"1fr 110px 160px 130px"}}>
                <TA editMode={editMode} value={item.text}
                  onChange={e => secUpd("risks",idx,"text",e.target.value)}
                  placeholder="Describe the risk or constraint…" rows={1} />
                <SS value={item.severity} onChange={v => secUpd("risks",idx,"severity",v)}
                  options={opts(SEVERITY_CONFIG)} cfg={SEVERITY_CONFIG} editMode={editMode} />
                <TA editMode={editMode} value={item.mitigation}
                  onChange={e => secUpd("risks",idx,"mitigation",e.target.value)}
                  placeholder="Mitigation…" rows={1} className="text-gray-500 text-xs" />
                <div className="flex items-start gap-2">
                  <TI editMode={editMode} value={item.owner}
                    onChange={e => secUpd("risks",idx,"owner",e.target.value)}
                    placeholder="Owner…" className="flex-1 text-gray-500 text-xs" />
                  {editMode && (
                    <button onClick={() => secDel("risks",idx)}
                      className="row-del no-edit text-gray-300 hover:text-red-400 transition-colors pt-2 flex-shrink-0">
                      <X size={13}/>
                    </button>
                  )}
                </div>
              </div>
            )}
          />
        </SectionWrap>

        {/* ── Custom Modules ───────────────────────────────────────────────── */}
        {(data.customModules.length > 0 || editMode) && (
          <SectionWrap title="Additional Modules" icon={Folder}
            onAdd={editMode ? () => setData(d => ({...d, customModules:[...d.customModules, makeCustomModule()]})) : null}
            addLabel="Add module">
            <div className="space-y-3">
              {data.customModules.map((mod, i) => (
                <CustomModBlock key={mod.id} mod={mod} editMode={editMode}
                  onUpdate={(k,v)  => modUpd(i,k,v)}
                  onDelete={()     => modDel(i)}
                  onAddItem={()    => modItemAdd(i)}
                  onDeleteItem={j  => modItemDel(i,j)}
                  onUpdateItem={(j,k,v) => modItemUpd(i,j,k,v)}
                  onReorderItems={next => modItemReorder(i,next)}
                />
              ))}
              {data.customModules.length === 0 && editMode && (
                <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  No modules yet — click Add module above.
                </div>
              )}
            </div>
          </SectionWrap>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-300 pb-4 no-print">
          WeTrials · {MONTHS[month]} {year} · {editMode ? "Editing — click Save to persist" : "Read mode — click Edit to make changes"}
        </p>

      </main>
    </div>
  );
}
