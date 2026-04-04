"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Plus, X, Printer, Save, Pencil, Check,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BookOpen, BarChart3, Activity, AlertTriangle, Zap, Folder, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS, pctChange, newId } from "@/lib/utils";
import {
  PASSWORD, STORAGE_KEY,
  IMPACT_CONFIG, DIRECTION_CONFIG, STATUS_CONFIG,
  SEVERITY_CONFIG, PRIORITY_CONFIG,
  makeInsightItem, makeDelivery, makeRisk,
  makeKPI, makeCustomModule, makeModuleItem, makeMonthData,
  monthKey, loadStore, saveStore,
} from "@/lib/data";

// ─────────────────────────────────────────────────────────────────────────────
// WETRIALS LOGO  (inline SVG – faithful to the actual brand)
// ─────────────────────────────────────────────────────────────────────────────
function WeLogo({ size = 44 }) {
  return (
    <img src="/logo.svg" width={size} height={Math.round(size * 130 / 120)} alt="WeTrials" className="flex-shrink-0" />
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

/* Textarea — editable or read-only */
function TA({ editMode, className, ...p }) {
  return (
    <textarea readOnly={!editMode} className={cn(
      "w-full text-base text-gray-700 placeholder:text-gray-300 focus:outline-none transition-colors leading-relaxed",
      editMode
        ? "border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 resize-y"
        : "border-transparent bg-transparent resize-none",
      className
    )} {...p} />
  );
}

/* Text input — editable or read-only */
function TI({ editMode, className, ...p }) {
  return (
    <input readOnly={!editMode} className={cn(
      "w-full text-base placeholder:text-gray-300 focus:outline-none transition-colors",
      editMode
        ? "border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
        : "border-transparent bg-transparent text-gray-700",
      className
    )} {...p} />
  );
}

/* Styled select — shows as badge in read mode */
function SS({ value, onChange, options, cfg, editMode, className }) {
  const sel = cfg?.[value];
  if (!editMode) {
    return (
      <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap", sel?.cls || "bg-gray-100 text-gray-500 border-gray-200")}>
        {sel?.label || value}
      </span>
    );
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={cn(
      "w-full rounded-xl border px-3 py-2 text-sm font-medium focus:outline-none cursor-pointer transition-colors appearance-none",
      sel?.cls || "bg-gray-100 text-gray-500 border-gray-200",
      className
    )}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* Drag handle */
function DragHandle(dragProps) {
  return (
    <span {...dragProps} className="no-print flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors self-start mt-3" title="Drag to reorder">
      <GripVertical size={16} />
    </span>
  );
}

/* Direction toggle ↑ → ↓ */
function DirToggle({ value, onChange, editMode }) {
  const btns = [
    { v:"positive", icon:"↑", on:"bg-emerald-50 text-emerald-700 border-emerald-200" },
    { v:"neutral",  icon:"→", on:"bg-gray-100 text-gray-600 border-gray-300"         },
    { v:"negative", icon:"↓", on:"bg-red-50 text-red-600 border-red-200"             },
  ];
  return (
    <div className={cn("flex rounded-xl overflow-hidden border border-gray-200 flex-shrink-0", !editMode && "pointer-events-none")}>
      {btns.map(b => (
        <button key={b.v} onClick={() => editMode && onChange(b.v)}
          className={cn("px-3 py-1.5 text-sm font-bold transition-colors",
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
      <div className="flex items-end justify-between pb-3 border-b-2 border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800 tracking-tight">
            {number && <span className="text-gray-300 font-bold">{String(number).padStart(2,"0")}</span>}
            <Icon size={20} className="text-gray-400" />
            {title}
          </h2>
        </div>
        {onAdd && (
          <button onClick={onAdd}
            className="no-print inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <Plus size={13} /> {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* Card wrapper */
function Card({ className, children }) {
  return <div className={cn("bg-white border border-gray-200 rounded-2xl overflow-hidden", className)}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT ROW  (Key Business Insights)
// ─────────────────────────────────────────────────────────────────────────────
function InsightRow({ item, editMode, onUpdate, onDelete, provided, snapshot }) {
  return (
    <div ref={provided.innerRef} {...provided.draggableProps}
      className={cn("item-row bg-white border border-gray-200 rounded-2xl overflow-hidden transition-shadow",
        snapshot.isDragging && "shadow-xl")}>
      <div className="flex items-start gap-3 px-5 py-4">
        <DragHandle {...provided.dragHandleProps} />
        <div className="flex-1 min-w-0 space-y-2.5">
          <TI editMode={editMode} value={item.title}
            onChange={e => onUpdate("title", e.target.value)}
            placeholder="Insight title…"
            className={cn("text-lg font-semibold text-gray-900", !editMode && "px-0")} />
          <TA editMode={editMode} value={item.summary}
            onChange={e => onUpdate("summary", e.target.value)}
            placeholder="What happened and why it matters…"
            rows={2} />
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
          <div className="w-28">
            <SS value={item.impact} onChange={v => onUpdate("impact",v)}
              options={cfgOpts(IMPACT_CONFIG)} cfg={IMPACT_CONFIG} editMode={editMode} />
          </div>
          <DirToggle value={item.direction} onChange={v => onUpdate("direction",v)} editMode={editMode} />
          {editMode && (
            <button onClick={onDelete}
              className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0">
              <X size={15}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Drag list of insight rows */
function InsightList({ id, items, editMode, onUpdate, onDelete, onReorder }) {
  function handleDragEnd(r) {
    if (!r.destination) return;
    onReorder(reorder(items, r.source.index, r.destination.index));
  }
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={id}>
        {(prov, snap) => (
          <div ref={prov.innerRef} {...prov.droppableProps}
            className={cn("space-y-2.5", snap.isDraggingOver && "bg-brand-50/20 rounded-2xl p-1")}>
            {items.length === 0 && (
              <div className="text-center py-12 text-base text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                No items yet — click Add to create one.
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────
function KPISection({ kpis, editMode, onChange }) {
  function update(idx, field, val) {
    onChange(kpis.map((k,i) => i===idx ? {...k,[field]:val} : k));
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {kpis.map((k, idx) => {
        const delta = pctChange(k.prevValue, k.value);
        const isPos = delta !== null && delta > 0;
        const isNeg = delta !== null && delta < 0;
        const TI2 = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
        const pc  = isPos ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isNeg ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-gray-100 text-gray-500 border-gray-200";
        return (
          <div key={k.id} className="bg-white border border-gray-200 rounded-2xl p-5 relative group hover:border-gray-300 transition-colors">
            {editMode && (
              <button onClick={() => onChange(kpis.filter((_,i)=>i!==idx))}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors">
                <X size={13}/>
              </button>
            )}
            <input readOnly={!editMode} value={k.label}
              onChange={e => update(idx,"label",e.target.value)} placeholder="KPI name"
              className="text-sm font-semibold uppercase tracking-wider text-gray-400 w-full border-0 p-0 bg-transparent focus:outline-none mb-4 pr-6" />

            {k.prevValue ? (
              <div className="flex items-end gap-1.5 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">Prev</div>
                  <input readOnly={!editMode} value={k.prevValue}
                    onChange={e => update(idx,"prevValue",e.target.value)} placeholder="—"
                    className={cn("w-full text-lg font-semibold text-gray-400 focus:outline-none",
                      editMode ? "border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:border-brand-500" : "border-transparent bg-transparent")} />
                </div>
                <span className="text-gray-300 mb-2 flex-shrink-0">→</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">Now</div>
                  <input readOnly={!editMode} value={k.value}
                    onChange={e => update(idx,"value",e.target.value)} placeholder="—"
                    className={cn("w-full text-3xl font-bold text-gray-900 focus:outline-none",
                      editMode ? "border border-gray-200 rounded-lg px-2 py-1 focus:border-brand-500" : "border-transparent bg-transparent")} />
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <input readOnly={!editMode} value={k.value}
                  onChange={e => update(idx,"value",e.target.value)} placeholder="—"
                  className={cn("w-full text-3xl font-bold text-gray-900 focus:outline-none",
                    editMode ? "border border-gray-200 rounded-lg px-2 py-1 focus:border-brand-500" : "border-transparent bg-transparent")} />
                {editMode && (
                  <input readOnly={false} value={k.prevValue}
                    onChange={e => update(idx,"prevValue",e.target.value)} placeholder="Add prev value…"
                    className="mt-1 w-full text-xs text-gray-300 border border-dashed border-gray-200 rounded-lg px-2 py-1 bg-transparent focus:outline-none focus:border-brand-400 focus:text-gray-400 placeholder:text-gray-300" />
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border", pc)}>
                <TI2 size={11}/>{delta!==null ? `${delta>0?"+":""}${delta}%` : "—"}
              </span>
              <input readOnly={!editMode} value={k.sub}
                onChange={e => update(idx,"sub",e.target.value)} placeholder="subtitle"
                className="text-sm text-gray-400 flex-1 min-w-0 border-0 p-0 bg-transparent focus:outline-none" />
            </div>
          </div>
        );
      })}
      {editMode && (
        <button onClick={() => onChange([...kpis, makeKPI()])}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center gap-2 min-h-[180px]">
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
  const [saveFlash, setSaveFlash]   = useState(false);

  // Check session auth on load
  useEffect(() => {
    if (sessionStorage.getItem("auth") === "1") setAuthed(true);
  }, []);

  // Load data when month/year changes
  useEffect(() => {
    const store = loadStore();
    const key   = monthKey(month, year);
    setData(store[key] ? structuredClone(store[key]) : makeMonthData());
    setEditMode(false);
  }, [month, year]);

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

  function save() {
    const store = loadStore();
    store[monthKey(month, year)] = data;
    saveStore(store);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
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
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <WeLogo size={48} />
            <div>
              <div className="text-xl font-bold text-gray-900 leading-tight">WeTrials</div>
              <div className="text-sm font-medium text-gray-400 leading-tight">Monthly Report</div>
            </div>
            <span className="text-gray-200 text-xl mx-1">|</span>
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
            <button onClick={save}
              className={cn("inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors",
                saveFlash ? "bg-emerald-600 text-white" : "bg-gray-900 hover:bg-gray-800 text-white")}>
              {saveFlash ? <><Check size={15}/> Saved</> : <><Save size={15}/> Save</>}
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
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <textarea
              readOnly={!editMode}
              value={data.executiveSummary}
              onChange={e => set("executiveSummary", e.target.value)}
              placeholder={"— Key achievement or milestone this month\n— Strategic update\n— Important observation\n— What changed for the business"}
              rows={6}
              className={cn(
                "w-full text-base text-gray-700 leading-relaxed placeholder:text-gray-300 focus:outline-none transition-colors",
                editMode
                  ? "resize-y border-0 bg-transparent"
                  : "border-transparent bg-transparent resize-none"
              )}
            />
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

        {/* ── 04 PRODUCT & DELIVERY ───────────────────────────────────────── */}
        <SectionWrap number={4} title="Product & Delivery" icon={Zap}
          onAdd={editMode ? () => secAdd("delivery", makeDelivery) : null}
          addLabel="Add item">
          <DragTable id="delivery" items={data.delivery} editMode={editMode}
            onReorder={n => secReorder("delivery",n)}
            renderRow={(item, idx) => (
              <div className="flex-1 grid gap-3 items-start" style={{gridTemplateColumns:"1fr 140px 120px 180px"}}>
                <TA editMode={editMode} value={item.title}
                  onChange={e => secUpd("delivery",idx,"title",e.target.value)}
                  placeholder="Initiative or feature name…" rows={1}/>
                <SS value={item.status} onChange={v => secUpd("delivery",idx,"status",v)}
                  options={cfgOpts(STATUS_CONFIG)} cfg={STATUS_CONFIG} editMode={editMode}/>
                <SS value={item.priority} onChange={v => secUpd("delivery",idx,"priority",v)}
                  options={cfgOpts(PRIORITY_CONFIG)} cfg={PRIORITY_CONFIG} editMode={editMode}/>
                <div className="flex items-start gap-2">
                  <TA editMode={editMode} value={item.notes}
                    onChange={e => secUpd("delivery",idx,"notes",e.target.value)}
                    placeholder="Notes…" rows={1} className="flex-1 text-gray-500"/>
                  {editMode && <button onClick={() => secDel("delivery",idx)} className="text-gray-300 hover:text-red-400 transition-colors pt-2.5 flex-shrink-0"><X size={14}/></button>}
                </div>
              </div>
            )} />
        </SectionWrap>

        {/* ── 05 RISKS & CONSTRAINTS ──────────────────────────────────────── */}
        <SectionWrap number={5} title="Risks & Constraints" icon={AlertTriangle}
          onAdd={editMode ? () => secAdd("risks", makeRisk) : null}
          addLabel="Add risk">
          <DragTable id="risks" items={data.risks} editMode={editMode}
            onReorder={n => secReorder("risks",n)}
            renderRow={(item, idx) => (
              <div className="flex-1 grid gap-3 items-start" style={{gridTemplateColumns:"1fr 120px 180px 140px"}}>
                <TA editMode={editMode} value={item.text}
                  onChange={e => secUpd("risks",idx,"text",e.target.value)}
                  placeholder="Risk or constraint…" rows={1}/>
                <SS value={item.severity} onChange={v => secUpd("risks",idx,"severity",v)}
                  options={cfgOpts(SEVERITY_CONFIG)} cfg={SEVERITY_CONFIG} editMode={editMode}/>
                <TA editMode={editMode} value={item.mitigation}
                  onChange={e => secUpd("risks",idx,"mitigation",e.target.value)}
                  placeholder="Mitigation…" rows={1} className="text-gray-500"/>
                <div className="flex items-start gap-2">
                  <TI editMode={editMode} value={item.owner}
                    onChange={e => secUpd("risks",idx,"owner",e.target.value)}
                    placeholder="Owner…" className="flex-1 text-gray-500"/>
                  {editMode && <button onClick={() => secDel("risks",idx)} className="text-gray-300 hover:text-red-400 transition-colors pt-2.5 flex-shrink-0"><X size={14}/></button>}
                </div>
              </div>
            )} />
        </SectionWrap>

        {/* ── CUSTOM MODULES ──────────────────────────────────────────────── */}
        {(data.customModules.length > 0 || editMode) && (
          <SectionWrap title="Additional Modules" icon={Folder}
            onAdd={editMode ? () => setData(d => ({...d,customModules:[...d.customModules, makeCustomModule()]})) : null}
            addLabel="Add module">
            <div className="space-y-4">
              {data.customModules.map((mod,i) => (
                <CustomModBlock key={mod.id} mod={mod} editMode={editMode}
                  onUpdate={(k,v) => modUpd(i,k,v)}
                  onDelete={() => modDel(i)}
                  onAddItem={() => modItemAdd(i)}
                  onDeleteItem={j => modItemDel(i,j)}
                  onUpdateItem={(j,k,v) => modItemUpd(i,j,k,v)}
                  onReorderItems={next => modItemReorder(i,next)} />
              ))}
              {data.customModules.length === 0 && editMode && (
                <div className="text-center py-10 text-base text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                  Click Add module above to add a custom section (SR&amp;ED, grants, research…)
                </div>
              )}
            </div>
          </SectionWrap>
        )}

        <p className="text-center text-sm text-gray-300 pb-6 no-print">
          WeTrials · {MONTHS[month]} {year} · {editMode ? "Edit mode — click Save when done" : "Click Edit to make changes"}
        </p>
      </main>
    </div>
  );
}
