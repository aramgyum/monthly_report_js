"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Plus, X, Printer, Save, Pencil, Check,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BookOpen, BarChart3, Activity, AlertTriangle, Zap, Folder, Lock,
  Handshake, CalendarCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS, pctChange, newId } from "@/lib/utils";
import {
  PASSWORD,
  IMPACT_CONFIG, DIRECTION_CONFIG, STATUS_CONFIG,
  SEVERITY_CONFIG, PRIORITY_CONFIG,
  MILESTONE_STATUS_CONFIG, PARTNER_ENGAGEMENT_CONFIG,
  makeInsightItem, makeDelivery, makeRisk,
  makeKPI, makeCustomModule, makeModuleItem, makeMonthData,
  makePartnerMilestone, makeComingMonthItem, makePartner,
  monthKey,
} from "@/lib/data";

const LS_KEY = "wetrials-monthly-v4";
function lsLoad()        { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } }
function lsSave(store)   { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {} }

// ─────────────────────────────────────────────────────────────────────────────
// WETRIALS LOGO — PNG with initials fallback
// ─────────────────────────────────────────────────────────────────────────────
function WeLogo({ size = 44 }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="flex-shrink-0 rounded-xl bg-gray-900 flex items-center justify-center"
        style={{ width: size, height: size, minWidth: size }}>
        <span className="text-white font-bold" style={{ fontSize: size * 0.32, letterSpacing: "-0.5px" }}>WT</span>
      </div>
    );
  }
  return (
    <img src="/logo.png" width={size} height={size} alt="WeTrials"
      onError={() => setFailed(true)}
      className="flex-shrink-0 rounded-xl object-contain"
      style={{ minWidth: size, minHeight: size }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PasswordModal({ onAuth, onClose }) {
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState(false);
  const inp = useRef();

  useEffect(() => { setTimeout(() => inp.current?.focus(), 80); }, []);

  function attempt() {
    if (pw === PASSWORD) { sessionStorage.setItem("auth","1"); onAuth(); }
    else { setErr(true); setPw(""); setTimeout(() => setErr(false), 2000); }
  }

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-5">
          <WeLogo size={56} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Access</h2>
        <p className="text-sm text-gray-500 mb-6">Enter the report password to enable editing.</p>

        <input ref={inp} type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Password"
          className={cn(
            "w-full border rounded-xl px-4 py-3 text-base text-gray-800 text-center tracking-widest focus:outline-none focus:ring-2 transition-colors mb-3",
            err ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-brand-500/20 focus:border-brand-500"
          )} />

        {err && <p className="text-sm text-red-500 mb-3">Incorrect password — try again.</p>}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={attempt}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2">
            <Lock size={14} /> Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS + PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function reorder(list, from, to) {
  const r = [...list]; const [m] = r.splice(from,1); r.splice(to,0,m); return r;
}
const cfgOpts = (cfg) => Object.entries(cfg).map(([v,c]) => ({ value:v, label:c.label }));

/* Textarea — editable or read-only; consistent wrapping in both modes */
function TA({ editMode, className, ...p }) {
  return (
    <textarea readOnly={!editMode} className={cn(
      "w-full text-base text-gray-800 placeholder:text-gray-400 focus:outline-none transition-colors leading-relaxed",
      "whitespace-pre-wrap break-words overflow-wrap-anywhere",
      editMode
        ? "border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 resize-y"
        : "border-transparent bg-transparent resize-none overflow-hidden",
      className
    )} {...p} />
  );
}

/* Text input — use textarea for multi-line safe display in both modes */
function TI({ editMode, className, ...p }) {
  if (!editMode) {
    // In read mode use a div so long text wraps naturally
    return (
      <div className={cn(
        "w-full text-base text-gray-800 leading-relaxed whitespace-pre-wrap break-words",
        className
      )}>{p.value || <span className="text-gray-400">{p.placeholder}</span>}</div>
    );
  }
  return (
    <input className={cn(
      "w-full text-base placeholder:text-gray-300 focus:outline-none transition-colors",
      "border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20",
      className
    )} {...p} />
  );
}

/* Styled select — compact badge appearance in both modes */
function SS({ value, onChange, options, cfg, editMode, className }) {
  const sel = cfg?.[value];
  const baseCls = sel?.cls || "bg-gray-100 text-gray-500 border-gray-200";
  if (!editMode) {
    return (
      <span className={cn(
        "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold whitespace-nowrap leading-none",
        baseCls
      )}>
        {sel?.label || value}
      </span>
    );
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={cn(
      "inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold focus:outline-none cursor-pointer",
      "transition-colors appearance-none whitespace-nowrap leading-none",
      baseCls, className
    )}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* Drag handle */
function DragHandle(dragProps) {
  return (
    <span {...dragProps} className="no-print flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors self-start mt-3.5" title="Drag to reorder">
      <GripVertical size={18} />
    </span>
  );
}

/* Direction toggle ↑ → ↓ — same height as SS badges */
function DirToggle({ value, onChange, editMode }) {
  const btns = [
    { v:"positive", icon:"↑", on:"bg-emerald-50 text-emerald-700 border-emerald-200" },
    { v:"neutral",  icon:"→", on:"bg-gray-100   text-gray-600   border-gray-300"     },
    { v:"negative", icon:"↓", on:"bg-red-50     text-red-600    border-red-200"       },
  ];
  return (
    <div className={cn("inline-flex rounded-full overflow-hidden border border-gray-200 flex-shrink-0",
      !editMode && "pointer-events-none")}>
      {btns.map(b => (
        <button key={b.v} onClick={() => editMode && onChange(b.v)}
          className={cn("px-3 py-1.5 text-sm font-bold transition-colors leading-none",
            value === b.v ? b.on : "bg-white text-gray-300 hover:bg-gray-50")}>
          {b.icon}
        </button>
      ))}
    </div>
  );
}

/* Section header */
function SectionWrap({ number, title, icon: Icon, onAdd, addLabel = "Add", children, className }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 tracking-tight">
          {number && (
            <span className="text-base font-bold text-gray-400 tabular-nums w-7 text-right">
              {String(number).padStart(2,"0")}
            </span>
          )}
          <Icon size={20} className="text-gray-500 flex-shrink-0" />
          {title}
        </h2>
        {onAdd && (
          <button onClick={onAdd}
            className="no-print inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors">
            <Plus size={13}/> {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* Card wrapper */
function Card({ className, children }) {
  return <div className={cn("bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm", className)}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT ROW  (Key Business Insights)
// ─────────────────────────────────────────────────────────────────────────────
function FieldLabel({ children, title }) {
  return (
    <span className="text-sm font-bold uppercase tracking-widest text-gray-500 select-none" title={title}>
      {children}
    </span>
  );
}

function InsightRow({ item, editMode, onUpdate, onDelete, provided, snapshot }) {
  return (
    <div ref={provided.innerRef} {...provided.draggableProps}
      className={cn("item-row flex items-start gap-4 px-6 py-6 group hover:bg-gray-50/60 transition-colors",
        snapshot.isDragging && "bg-white shadow-lg rounded-2xl")}>
      <DragHandle {...provided.dragHandleProps} />

      {/* Left: title + summary */}
      <div className="flex-1 min-w-0 space-y-1">
        <FieldLabel title="The headline or finding for this insight">Title</FieldLabel>
        <TA editMode={editMode} value={item.title}
          onChange={e => onUpdate("title", e.target.value)}
          placeholder="Insight title…" rows={1}
          className={cn("text-lg font-semibold text-gray-900",
            !editMode && "px-0 border-transparent bg-transparent resize-none overflow-hidden")} />
        <TA editMode={editMode} value={item.summary}
          onChange={e => onUpdate("summary", e.target.value)}
          placeholder="What happened and why it matters…" rows={2}
          className="text-base text-gray-600" />
      </div>

      {/* Right: Impact + Direction on ONE line */}
      <div className="flex-shrink-0 flex items-center gap-3 flex-wrap justify-end">
        <div className="flex items-center gap-1.5">
          <FieldLabel title="Level of business importance: High / Medium / Low">Impact</FieldLabel>
          <SS value={item.impact} onChange={v => onUpdate("impact",v)}
            options={cfgOpts(IMPACT_CONFIG)} cfg={IMPACT_CONFIG} editMode={editMode} />
        </div>
        <div className="flex items-center gap-1.5">
          <FieldLabel title="Trend direction: Positive (↑) / Neutral (→) / Negative (↓)">Direction</FieldLabel>
          <DirToggle value={item.direction} onChange={v => onUpdate("direction",v)} editMode={editMode} />
        </div>
        {editMode && (
          <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors p-1">
            <X size={14}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* Drag list of insight rows — wrapped in a Card+divider (same as Delivery) */
function InsightList({ id, items, editMode, onUpdate, onDelete, onReorder }) {
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
                <div className="px-5 py-10 text-base text-gray-400 text-center">
                  {editMode ? "No items yet — click Add insight to create one." : "No items."}
                </div>
              )}
              {items.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(prov2, snap2) => (
                    <InsightRow item={item} editMode={editMode}
                      onUpdate={(k,v) => onUpdate(idx,k,v)}
                      onDelete={() => onDelete(idx)}
                      provided={prov2} snapshot={snap2} />
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
// KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────
function KPICard({ k, idx, editMode, onChange, onDelete }) {
  function upd(field, val) { onChange({ ...k, [field]: val }); }
  const delta = pctChange(k.prevValue, k.value);
  const isPos = delta !== null && delta > 0;
  const isNeg = delta !== null && delta < 0;
  const TrendIcon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const deltaCls = isPos ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                 : isNeg ? "bg-red-50 text-red-600 border-red-200"
                 : "bg-gray-100 text-gray-500 border-gray-200";
  const accentCls = isPos ? "bg-emerald-500" : isNeg ? "bg-red-400" : "bg-gray-200";
  const hasPrev = k.prevValue && k.prevValue.trim() !== "";

  /* shared input style */
  const numInput = (extraCls="") => cn(
    "focus:outline-none bg-transparent border-0 p-0 font-extrabold text-gray-900 leading-none w-full",
    extraCls
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
      {/* colored accent bar */}
      <div className={cn("h-0.5 w-full", accentCls)} />

      <div className="px-7 pt-6 pb-6 flex flex-col gap-0">

        {/* ── KPI label + delete ── */}
        <div className="flex items-center justify-between mb-4">
          <input
            readOnly={!editMode}
            value={k.label}
            onChange={e => upd("label", e.target.value)}
            placeholder="KPI name"
            className="flex-1 text-sm font-bold uppercase tracking-widest text-gray-600 bg-transparent border-0 p-0 focus:outline-none min-w-0"
          />
          {editMode && (
            <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 ml-2">
              <X size={13}/>
            </button>
          )}
        </div>

        {/* ── Value area ──────────────────────────────────────────────────────
             Read mode  : prev+arrow as small text, current as a <div> (no clipping)
             Edit mode  : inputs with fixed widths
             3-col flex : [flex-1 left][center][flex-1 right] keeps center DEAD CENTER ── */}
        <div className="flex items-end mb-5" style={{ minHeight: "7rem" }}>

          {/* Left: prev label + value + arrow — right-aligned in its flex-1 column */}
          <div className="flex-1 flex items-end justify-end gap-1 pb-1 pr-1.5">
            {hasPrev && !editMode && (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400 font-medium mb-0.5">{k.prevLabel ?? "Prev"}</span>
                  <span className="text-2xl font-semibold" style={{ color: "#9ca3af" }}>{k.prevValue || "—"}</span>
                </div>
                <span className="text-gray-400 text-lg" style={{ lineHeight: "2rem" }}>→</span>
              </>
            )}
            {hasPrev && editMode && (
              <>
                <div className="flex flex-col items-end">
                  <input value={k.prevLabel ?? "Prev"} onChange={e => upd("prevLabel", e.target.value)}
                    className="text-sm text-gray-500 font-medium bg-transparent border-0 p-0 focus:outline-none text-right mb-0.5"
                    style={{ width: "3rem" }} />
                  <input value={k.prevValue} onChange={e => upd("prevValue", e.target.value)} placeholder="—"
                    style={{ color: "#9ca3af", width: "5rem" }}
                    className="text-2xl font-semibold text-right focus:outline-none border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:border-brand-500" />
                </div>
                <span className="text-gray-400 text-lg" style={{ lineHeight: "2rem" }}>→</span>
              </>
            )}
          </div>

          {/* Center: current value — flex-shrink-0 keeps it from growing/shrinking */}
          <div className="flex-shrink-0 flex flex-col items-center">
            {editMode ? (
              <input value={k.value} onChange={e => upd("value", e.target.value)} placeholder="—"
                className="text-6xl font-extrabold text-gray-900 text-center leading-none focus:outline-none border border-gray-200 rounded-xl px-3 py-2 bg-white focus:border-brand-500"
                style={{ width: "8rem" }} />
            ) : (
              <div className="text-6xl font-extrabold text-gray-900 text-center leading-none">
                {k.value || "—"}
              </div>
            )}
            {!hasPrev && editMode && (
              <input value={k.prevValue} onChange={e => upd("prevValue", e.target.value)}
                placeholder="+ add prev value"
                className="mt-2 text-xs text-center text-gray-300 border border-dashed border-gray-200 rounded-lg px-2 py-1 bg-transparent focus:outline-none focus:border-brand-400 placeholder:text-gray-300"
                style={{ width: "10rem" }} />
            )}
          </div>

          {/* Right: mirror spacer so center stays centred */}
          <div className="flex-1" />
        </div>

        {/* ── Footer: delta badge + subtitle ── */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
          {hasPrev && (
            <span className={cn("inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full border flex-shrink-0", deltaCls)}>
              <TrendIcon size={12}/>{delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "—"}
            </span>
          )}
          <input readOnly={!editMode} value={k.sub}
            onChange={e => upd("sub", e.target.value)}
            placeholder="add context…"
            className="text-base text-gray-500 flex-1 min-w-0 border-0 p-0 bg-transparent focus:outline-none" />
        </div>

      </div>
    </div>
  );
}

function KPISection({ kpis, editMode, onChange }) {
  function update(idx, next) { onChange(kpis.map((k,i) => i===idx ? next : k)); }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {kpis.map((k, idx) => (
        <KPICard key={k.id} k={k} idx={idx} editMode={editMode}
          onChange={next => update(idx, next)}
          onDelete={() => onChange(kpis.filter((_,i)=>i!==idx))} />
      ))}
      {editMode && (
        <button onClick={() => onChange([...kpis, makeKPI()])}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center gap-2 min-h-[200px]">
          <Plus size={20}/> Add KPI
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC DRAG TABLE  (Delivery, Risks)
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
                <div className="px-5 py-10 text-base text-gray-400 text-center">
                  {editMode ? "No items yet — click Add to create one." : "No items."}
                </div>
              )}
              {items.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(prov2, snap2) => (
                    <div ref={prov2.innerRef} {...prov2.draggableProps}
                      className={cn("item-row flex items-start gap-3 px-5 py-3.5 group hover:bg-gray-50 transition-colors",
                        snap2.isDragging && "bg-white shadow-md rounded-2xl")}>
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
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <Folder size={16} className="text-gray-400 flex-shrink-0"/>
        <input readOnly={!editMode} value={mod.title}
          onChange={e => onUpdate("title", e.target.value)}
          className={cn("flex-1 text-base font-semibold border-0 bg-transparent focus:outline-none",
            editMode ? "text-gray-700" : "text-gray-800")} />
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {collapsed ? <ChevronDown size={15}/> : <ChevronUp size={15}/>}
          </button>
          {editMode && <>
            <button onClick={onAddItem}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors">
              <Plus size={12}/> Add
            </button>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <X size={15}/>
            </button>
          </>}
        </div>
      </div>
      {!collapsed && <>
        <div className="px-5 py-2.5 border-b border-gray-50">
          <input readOnly={!editMode} value={mod.description}
            onChange={e => onUpdate("description", e.target.value)}
            placeholder="Module description (optional)"
            className="w-full text-sm text-gray-500 border-0 bg-transparent focus:outline-none italic" />
        </div>
        <DragDropContext onDragEnd={handleDrag}>
          <Droppable droppableId={`mod-${mod.id}`}>
            {(prov, snap) => (
              <div ref={prov.innerRef} {...prov.droppableProps}
                className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                {mod.items.length === 0 && <div className="px-5 py-6 text-sm text-gray-400 text-center">No items yet.</div>}
                {mod.items.map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(prov2, snap2) => (
                      <div ref={prov2.innerRef} {...prov2.draggableProps}
                        className={cn("item-row flex items-start gap-3 px-5 py-3 group hover:bg-gray-50 transition-colors",
                          snap2.isDragging && "bg-white shadow-md rounded-2xl")}>
                        <DragHandle {...prov2.dragHandleProps}/>
                        <TA editMode={editMode} value={item.text}
                          onChange={e => onUpdateItem(idx,"text",e.target.value)}
                          placeholder="Item description…" className="flex-1" rows={1}/>
                        <div className="w-32 flex-shrink-0 pt-0.5">
                          <SS value={item.status} onChange={v => onUpdateItem(idx,"status",v)}
                            options={cfgOpts(STATUS_CONFIG)} cfg={STATUS_CONFIG} editMode={editMode}/>
                        </div>
                        {editMode && (
                          <button onClick={() => onDeleteItem(idx)} className="text-gray-300 hover:text-red-400 transition-colors pt-2.5 flex-shrink-0">
                            <X size={14}/>
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
      </>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [authed, setAuthed]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [month, setMonth]           = useState(new Date().getMonth());
  const [year, setYear]             = useState(new Date().getFullYear());
  const [data, setData]             = useState(null);
  const [store, setStore]           = useState({});
  const [storeReady, setStoreReady] = useState(false);
  const [saveState, setSaveState]   = useState("idle"); // "idle"|"saving"|"saved"|"error"

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem("auth") === "1") setAuthed(true);
  }, []);

  // ── On mount: load all months from GitHub, fall back to localStorage ──────
  useEffect(() => {
    async function bootstrap() {
      let loaded = {};
      try {
        const res  = await fetch("/api/load");
        const json = await res.json();
        if (json.data) {
          loaded = json.data;
        } else {
          // GitHub not configured or file missing — use localStorage
          loaded = lsLoad();
        }
      } catch {
        loaded = lsLoad();
      }

      setStore(loaded);

      // Jump to the most recent month that has data
      const keys = Object.keys(loaded).sort().reverse();
      if (keys.length > 0) {
        const [y, m] = keys[0].split("-");
        setYear(parseInt(y, 10));
        setMonth(parseInt(m, 10) - 1);
      }
      setStoreReady(true);
    }
    bootstrap();
  }, []);

  // ── When month/year changes (after store is ready), load that month ───────
  useEffect(() => {
    if (!storeReady) return;
    const key   = monthKey(month, year);
    const fresh = makeMonthData();
    const saved = store[key] ? structuredClone(store[key]) : null;
    setData(saved ? { ...fresh, ...saved } : fresh);
    setEditMode(false);
  }, [month, year, storeReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((field, val) => setData(d => ({...d,[field]:val})), []);

  function handleEditClick() {
    if (authed) { setEditMode(e => !e); }
    else        { setShowModal(true); }
  }
  function handleAuth() {
    setAuthed(true);
    setShowModal(false);
    setEditMode(true);
  }

  // ── Save: write to GitHub + localStorage backup ───────────────────────────
  async function save() {
    setSaveState("saving");
    const updated = { ...store, [monthKey(month, year)]: data };
    setStore(updated);
    lsSave(updated); // always write localStorage as backup

    try {
      const res = await fetch("/api/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updated),
      });
      // 501 = GitHub env vars not set yet; localStorage backup already written above
      if (!res.ok && res.status !== 501) throw new Error("save failed");
      setSaveState("saved");
      setEditMode(false); // switch to read/preview mode immediately after save
    } catch {
      // Network error — data still in localStorage
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  // ── New Report: navigate to (today − 1 month) ─────────────────────────────
  function handleNewReport() {
    const now = new Date();
    let m = now.getMonth() - 1;
    let y = now.getFullYear();
    if (m < 0) { m = 11; y -= 1; }
    setMonth(m);
    setYear(y);
    setEditMode(false);
  }

  // Section helpers
  function secAdd(f, mk)         { setData(d => ({...d,[f]:[mk(),...d[f]]})); }
  function secDel(f, i)          { setData(d => ({...d,[f]:d[f].filter((_,x)=>x!==i)})); }
  function secReorder(f, next)   { setData(d => ({...d,[f]:next})); }
  function secUpd(f, i, k, v)    { setData(d => ({...d,[f]:d[f].map((it,x)=>x===i?{...it,[k]:v}:it)})); }
  function modDel(i)              { setData(d => ({...d,customModules:d.customModules.filter((_,x)=>x!==i)})); }
  function modUpd(i,k,v)          { setData(d => ({...d,customModules:d.customModules.map((m,x)=>x===i?{...m,[k]:v}:m)})); }
  function modItemAdd(i)          { setData(d => ({...d,customModules:d.customModules.map((m,x)=>x===i?{...m,items:[makeModuleItem(),...m.items]}:m)})); }
  function modItemDel(i,j)        { setData(d => ({...d,customModules:d.customModules.map((m,x)=>x===i?{...m,items:m.items.filter((_,y)=>y!==j)}:m)})); }
  function modItemUpd(i,j,k,v)    { setData(d => ({...d,customModules:d.customModules.map((m,x)=>x===i?{...m,items:m.items.map((it,y)=>y===j?{...it,[k]:v}:it)}:m)})); }
  function modItemReorder(i,next) { setData(d => ({...d,customModules:d.customModules.map((m,x)=>x===i?{...m,items:next}:m)})); }

  if (!data) return <div className="min-h-screen flex items-center justify-center text-base text-gray-400">Loading…</div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", editMode ? "edit-mode" : "read-mode")}>

      {/* Password modal */}
      {showModal && <PasswordModal onAuth={handleAuth} onClose={() => setShowModal(false)}/>}

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 no-print">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-5 flex-wrap">

          {/* Logo + brand */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <WeLogo size={44} />
            <span className="text-xl font-bold text-gray-900 whitespace-nowrap">WeTrials Product Monthly Report</span>
            <span className="text-gray-200 text-xl">|</span>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="text-xl font-bold text-gray-700 border-0 bg-transparent focus:outline-none cursor-pointer">
              {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="text-xl font-bold text-gray-700 border-0 bg-transparent focus:outline-none cursor-pointer w-24">
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 no-print">
            <button onClick={handleNewReport}
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              <Plus size={14}/> New Report
            </button>
            <button onClick={save} disabled={saveState === "saving"}
              className={cn("inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors",
                saveState === "saving" ? "bg-gray-400 text-white cursor-not-allowed"
                : saveState === "saved"   ? "bg-emerald-600 text-white"
                : saveState === "error"   ? "bg-red-500 text-white"
                : "bg-gray-900 hover:bg-gray-800 text-white")}>
              {saveState === "saving" ? "Saving…"
                : saveState === "saved"   ? <><Check size={15}/> Saved</>
                : saveState === "error"   ? "Save failed"
                : <><Save size={15}/> Save</>}
            </button>
            <button onClick={handleEditClick}
              className={cn("inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2.5 border transition-colors",
                editMode ? "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}>
              {editMode ? <><Pencil size={15}/> Editing</> : <><Pencil size={15}/> Edit</>}
            </button>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2.5 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              <Printer size={15}/> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">

        {/* ── 01 EXECUTIVE SUMMARY — free text ──────────────────────────────── */}
        <SectionWrap number={1} title="Executive Summary" icon={BookOpen}>
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            {editMode ? (
              <textarea
                value={data.executiveSummary}
                onChange={e => set("executiveSummary", e.target.value)}
                placeholder={"— Key achievement or milestone this month\n— Strategic update\n— Important observation\n— What changed for the business"}
                rows={8}
                className="w-full text-lg text-gray-700 leading-relaxed placeholder:text-gray-400 focus:outline-none resize-y border-0 bg-transparent"
              />
            ) : (
              <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[3rem]">
                {data.executiveSummary || <span className="text-gray-400">No summary yet — click Edit to add one.</span>}
              </div>
            )}
          </div>
        </SectionWrap>

        {/* ── 02 KPI SNAPSHOT ─────────────────────────────────────────────── */}
        <SectionWrap number={2} title="KPI Snapshot" icon={BarChart3}>
          <KPISection kpis={data.kpis} editMode={editMode} onChange={next => set("kpis",next)} />
        </SectionWrap>

        {/* ── 03 KEY BUSINESS INSIGHTS ────────────────────────────────────── */}
        <SectionWrap number={3} title="Key Business Insights" icon={Activity}
          onAdd={editMode ? () => secAdd("insights", makeInsightItem) : null}
          addLabel="Add insight">
          <InsightList id="insights" items={data.insights} editMode={editMode}
            onUpdate={(i,k,v) => secUpd("insights",i,k,v)}
            onDelete={i => secDel("insights",i)}
            onReorder={n => secReorder("insights",n)} />
        </SectionWrap>

        {/* ── 04 PRODUCT & DELIVERY ── Insights-style layout ─────────────── */}
        <SectionWrap number={4} title="Product & Delivery" icon={Zap}
          onAdd={editMode ? () => secAdd("delivery", makeDelivery) : null}
          addLabel="Add item">
          <Card>
            <DragDropContext onDragEnd={r => { if (r.destination) secReorder("delivery", reorder(data.delivery, r.source.index, r.destination.index)); }}>
              <Droppable droppableId="delivery">
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.droppableProps}
                    className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                    {data.delivery.length === 0 && (
                      <div className="px-5 py-10 text-base text-gray-400 text-center">
                        {editMode ? "No items yet — click Add item to create one." : "No items."}
                      </div>
                    )}
                    {data.delivery.map((item, idx) => (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(prov2, snap2) => (
                          <div ref={prov2.innerRef} {...prov2.draggableProps}
                            className={cn("item-row flex items-start gap-4 px-6 py-5 group hover:bg-gray-50/60 transition-colors",
                              snap2.isDragging && "bg-white shadow-lg rounded-2xl")}>
                            <DragHandle {...prov2.dragHandleProps} />
                            <div className="flex-1 min-w-0">
                              {/* Row 1: label strip */}
                              <div className="flex items-center justify-between mb-1">
                                <FieldLabel title="Name of the initiative or feature being delivered">Initiative / Feature</FieldLabel>
                                <div className="flex items-center gap-4">
                                  <FieldLabel title="Importance level: Highest / High / Medium / Low">Priority</FieldLabel>
                                  <FieldLabel title="Current delivery status">Progress</FieldLabel>
                                </div>
                              </div>
                              {/* Row 2: title + badges on same line */}
                              <div className="flex items-start gap-3">
                                <TA editMode={editMode} value={item.title}
                                  onChange={e => secUpd("delivery",idx,"title",e.target.value)}
                                  placeholder="Initiative or feature name…" rows={1}
                                  className="flex-1 text-lg font-semibold text-gray-900"/>
                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  <SS value={item.priority} onChange={v => secUpd("delivery",idx,"priority",v)}
                                    options={cfgOpts(PRIORITY_CONFIG)} cfg={PRIORITY_CONFIG} editMode={editMode}/>
                                  <SS value={item.status} onChange={v => secUpd("delivery",idx,"status",v)}
                                    options={cfgOpts(STATUS_CONFIG)} cfg={STATUS_CONFIG} editMode={editMode}/>
                                  {editMode && (
                                    <button onClick={() => secDel("delivery",idx)}
                                      className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
                                      <X size={15}/>
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Row 3: notes full width */}
                              <div className="mt-3">
                                <FieldLabel title="What is happening and why it matters">Notes</FieldLabel>
                                <TA editMode={editMode} value={item.notes}
                                  onChange={e => secUpd("delivery",idx,"notes",e.target.value)}
                                  placeholder="What is happening and why it matters…" rows={2}
                                  className="text-base text-gray-600 w-full"/>
                              </div>
                            </div>
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
        </SectionWrap>

        {/* ── 05 PARTNER MILESTONES — same card/list style as Delivery ──────── */}
        <SectionWrap number={5} title="Partner Milestones" icon={Handshake}
          onAdd={editMode ? () => secAdd("partnerMilestones", makePartnerMilestone) : null}
          addLabel="Add milestone">
          <Card>
            <DragDropContext onDragEnd={r => { if (r.destination) secReorder("partnerMilestones", reorder(data.partnerMilestones, r.source.index, r.destination.index)); }}>
              <Droppable droppableId="partner-milestones">
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.droppableProps}
                    className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                    {data.partnerMilestones.length === 0 && (
                      <div className="px-5 py-10 text-base text-gray-400 text-center">
                        {editMode ? "No milestones yet — click Add milestone to create one." : "No milestones."}
                      </div>
                    )}
                    {data.partnerMilestones.map((item, idx) => (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(prov2, snap2) => (
                          <div ref={prov2.innerRef} {...prov2.draggableProps}
                            className={cn("item-row flex items-start gap-4 px-6 py-5 group hover:bg-gray-50/60 transition-colors",
                              snap2.isDragging && "bg-white shadow-md rounded-2xl")}>
                            <DragHandle {...prov2.dragHandleProps}/>
                            <div className="flex-1 min-w-0">
                              {/* Row 1: label strip */}
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                  <FieldLabel title="Name of the partner organisation">Partner</FieldLabel>
                                  <span className="text-gray-300 text-sm">·</span>
                                  <FieldLabel title="What was achieved or delivered">Milestone / Achievement</FieldLabel>
                                </div>
                                <div className="flex items-center gap-4">
                                  <FieldLabel title="Milestone progress status">Progress</FieldLabel>
                                  <FieldLabel title="Importance level">Priority</FieldLabel>
                                </div>
                              </div>
                              {/* Row 2: partner name + milestone text + status + priority badges */}
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0 flex items-start gap-2">
                                  <TA editMode={editMode} value={item.partner}
                                    onChange={e => secUpd("partnerMilestones",idx,"partner",e.target.value)}
                                    placeholder="Partner name…" rows={1}
                                    className="text-lg font-semibold text-gray-900 w-40 flex-shrink-0"/>
                                  {(item.milestone || editMode) && (
                                    <TA editMode={editMode} value={item.milestone}
                                      onChange={e => secUpd("partnerMilestones",idx,"milestone",e.target.value)}
                                      placeholder="Milestone or achievement…" rows={1}
                                      className="flex-1 text-lg text-gray-700"/>
                                  )}
                                </div>
                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  <SS value={item.status} onChange={v => secUpd("partnerMilestones",idx,"status",v)}
                                    options={cfgOpts(MILESTONE_STATUS_CONFIG)} cfg={MILESTONE_STATUS_CONFIG} editMode={editMode}/>
                                  <SS value={item.priority ?? "medium"} onChange={v => secUpd("partnerMilestones",idx,"priority",v)}
                                    options={cfgOpts(PRIORITY_CONFIG)} cfg={PRIORITY_CONFIG} editMode={editMode}/>
                                  {editMode && (
                                    <button onClick={() => secDel("partnerMilestones",idx)}
                                      className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
                                      <X size={15}/>
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Row 3: note full width */}
                              {(item.note || editMode) && (
                                <div className="mt-3">
                                  <FieldLabel title="Additional context or detail">Note</FieldLabel>
                                  <TA editMode={editMode} value={item.note}
                                    onChange={e => secUpd("partnerMilestones",idx,"note",e.target.value)}
                                    placeholder="Additional context or detail…" rows={1}
                                    className="text-base text-gray-600 w-full"/>
                                </div>
                              )}
                            </div>
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
        </SectionWrap>

        {/* ── 06 COMING MONTH MILESTONES ───────────────────────────────────── */}
        <SectionWrap number={6} title="Coming Month Priorities" icon={CalendarCheck}
          onAdd={editMode ? () => secAdd("comingMonthItems", makeComingMonthItem) : null}
          addLabel="Add priority">
          <Card>
            <DragDropContext onDragEnd={r => { if (r.destination) secReorder("comingMonthItems", reorder(data.comingMonthItems, r.source.index, r.destination.index)); }}>
              <Droppable droppableId="coming-month">
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.droppableProps}
                    className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                    {data.comingMonthItems.length === 0 && (
                      <div className="px-5 py-10 text-base text-gray-400 text-center">
                        {editMode ? "No priorities yet — click Add priority to create one." : "No priorities set."}
                      </div>
                    )}
                    {data.comingMonthItems.map((item, idx) => (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(prov2, snap2) => (
                          <div ref={prov2.innerRef} {...prov2.draggableProps}
                            className={cn("item-row flex items-center gap-4 px-6 py-4 group hover:bg-gray-50/60 transition-colors",
                              snap2.isDragging && "bg-white shadow-md rounded-2xl")}>
                            <DragHandle {...prov2.dragHandleProps}/>
                            <span className="text-gray-400 font-bold text-base tabular-nums flex-shrink-0 w-7 text-right">
                              {String(idx + 1).padStart(2,"0")}
                            </span>
                            <TA editMode={editMode} value={item.text}
                              onChange={e => secUpd("comingMonthItems",idx,"text",e.target.value)}
                              placeholder="Key priority or action for next month…" rows={1}
                              className="flex-1 text-lg font-medium text-gray-800"/>
                            {editMode && (
                              <button onClick={() => secDel("comingMonthItems",idx)}
                                className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
                                <X size={15}/>
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
          </Card>
        </SectionWrap>

        {/* ── 07 RISKS & CONSTRAINTS ───────────────────────────────────────── */}
        <SectionWrap number={7} title="Risks & Constraints" icon={AlertTriangle}
          onAdd={editMode ? () => secAdd("risks", makeRisk) : null}
          addLabel="Add risk">
          <Card>
            {data.risks.length > 0 && (
              <div className="flex items-center gap-4 px-6 pt-5 pb-3 border-b border-gray-200">
                <span className="w-4 flex-shrink-0"/>
                <div className="flex-1 grid gap-3" style={{gridTemplateColumns:"1fr 110px 1fr 120px"}}>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Risk / Constraint</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Severity</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Mitigation</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Owner</span>
                </div>
              </div>
            )}
            <DragDropContext onDragEnd={r => { if (r.destination) secReorder("risks", reorder(data.risks, r.source.index, r.destination.index)); }}>
              <Droppable droppableId="risks">
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.droppableProps}
                    className={cn("divide-y divide-gray-50", snap.isDraggingOver && "bg-brand-50/20")}>
                    {data.risks.length === 0 && (
                      <div className="px-5 py-10 text-base text-gray-400 text-center">
                        {editMode ? "No items yet — click Add risk to create one." : "No items."}
                      </div>
                    )}
                    {data.risks.map((item, idx) => (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(prov2, snap2) => (
                          <div ref={prov2.innerRef} {...prov2.draggableProps}
                            className={cn("item-row flex items-start gap-4 px-6 py-4 group hover:bg-gray-50/60 transition-colors",
                              snap2.isDragging && "bg-white shadow-md rounded-2xl")}>
                            <DragHandle {...prov2.dragHandleProps} />
                            <div className="flex-1 min-w-0 grid gap-3 items-start"
                              style={{gridTemplateColumns:"1fr 110px 1fr 120px"}}>
                              <TA editMode={editMode} value={item.text}
                                onChange={e => secUpd("risks",idx,"text",e.target.value)}
                                placeholder="Risk or constraint…" rows={1} className="text-base text-gray-800"/>
                              <SS value={item.severity} onChange={v => secUpd("risks",idx,"severity",v)}
                                options={cfgOpts(SEVERITY_CONFIG)} cfg={SEVERITY_CONFIG} editMode={editMode}/>
                              <TA editMode={editMode} value={item.mitigation}
                                onChange={e => secUpd("risks",idx,"mitigation",e.target.value)}
                                placeholder="Mitigation…" rows={1} className="text-base text-gray-600"/>
                              <div className="flex items-start gap-2">
                                <TA editMode={editMode} value={item.owner}
                                  onChange={e => secUpd("risks",idx,"owner",e.target.value)}
                                  placeholder="Owner…" rows={1} className="flex-1 text-base text-gray-600"/>
                                {editMode && (
                                  <button onClick={() => secDel("risks",idx)}
                                    className="text-gray-400 hover:text-red-400 transition-colors pt-2 flex-shrink-0">
                                    <X size={15}/>
                                  </button>
                                )}
                              </div>
                            </div>
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
        </SectionWrap>

        {/* ── CUSTOM MODULES (dynamic — add/remove in edit mode) ───────────── */}
        {data.customModules?.map((mod, i) => (
          <CustomModBlock key={mod.id} mod={mod} editMode={editMode}
            onUpdate={(k,v) => modUpd(i,k,v)}
            onDelete={() => modDel(i)}
            onAddItem={() => modItemAdd(i)}
            onDeleteItem={j => modItemDel(i,j)}
            onUpdateItem={(j,k,v) => modItemUpd(i,j,k,v)}
            onReorderItems={next => modItemReorder(i,next)} />
        ))}
        {editMode && (
          <button
            onClick={() => setData(d => ({...d, customModules: [...(d.customModules || []), makeCustomModule()]}))}
            className="no-print w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-700 border-2 border-dashed border-gray-200 rounded-2xl px-8 py-5 hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <Plus size={16}/> Add Custom Module
          </button>
        )}

        <p className="text-center text-sm text-gray-300 pb-6 no-print">
          WeTrials · {MONTHS[month]} {year} · {editMode ? "Edit mode — click Save when done" : "Click Edit to make changes"}
        </p>
      </main>
    </div>
  );
}
