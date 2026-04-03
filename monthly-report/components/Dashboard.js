"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Download, Upload, Printer, Plus, X, GripVertical,
  TrendingUp, TrendingDown, Minus, Database, Users,
  Map, Inbox, BarChart3, Activity, AlertTriangle,
  Target, Handshake, Zap, ChevronDown, Save
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STORAGE_KEY, OVERALL_CONFIG, IMPACT_CONFIG, STATUS_CONFIG,
  SEVERITY_CONFIG, PRIORITY_CONFIG, PARTNER_STATUS_CONFIG,
  makeInitialData, makeSignal, makeDelivery, makeRisk, makeFocus, makePartner,
} from "@/lib/data";
import { MONTHS, pctChange, newId } from "@/lib/utils";

// ── KPI Icon map ─────────────────────────────────────────────────────────────
const KPI_ICONS = { database: Database, users: Users, map: Map, inbox: Inbox, chart: BarChart3, activity: Activity };

// ── Helpers ───────────────────────────────────────────────────────────────────
function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function addToTop(list, item) {
  return [item, ...list];
}

// ── Option arrays ─────────────────────────────────────────────────────────────
const impactOpts    = Object.entries(IMPACT_CONFIG).map(([v,c])   => ({ value:v, label:c.label }));
const statusOpts    = Object.entries(STATUS_CONFIG).map(([v,c])   => ({ value:v, label:c.label }));
const severityOpts  = Object.entries(SEVERITY_CONFIG).map(([v,c]) => ({ value:v, label:c.label }));
const priorityOpts  = Object.entries(PRIORITY_CONFIG).map(([v,c]) => ({ value:v, label:c.label }));
const partnerOpts   = Object.entries(PARTNER_STATUS_CONFIG).map(([v,c]) => ({ value:v, label:c.label }));
const overallOpts   = Object.entries(OVERALL_CONFIG).map(([v,c]) => ({ value:v, label:c.label }));

// ── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle(props) {
  return (
    <span {...props} className="no-print cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors px-1 flex-shrink-0" title="Drag to reorder">
      <GripVertical size={15} />
    </span>
  );
}

// ── KPI Section ───────────────────────────────────────────────────────────────
function KPISection({ kpis, onChange }) {
  function update(idx, field, val) {
    const next = kpis.map((k,i) => i===idx ? {...k,[field]:val} : k);
    onChange(next);
  }
  function addKPI() {
    onChange([...kpis, { id:newId(), label:"New KPI", value:"", prevValue:"", sub:"" }]);
  }
  function delKPI(idx) {
    onChange(kpis.filter((_,i) => i!==idx));
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 size={14} /> KPI Cards
        </h2>
        <Button variant="outline" size="sm" onClick={addKPI} className="no-print">
          <Plus size={13} /> Add KPI
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => {
          const delta = pctChange(k.prevValue, k.value);
          const trend = delta === null ? "neutral" : delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
          const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
          const KpiIcon = KPI_ICONS[k.iconKey] || BarChart3;
          return (
            <div key={k.id} className={cn("kpi-wrap", trend === "positive" ? "positive" : trend === "negative" ? "negative" : "")}>
              <div className="kpi-inner bg-white rounded-[12px] p-4 relative group h-full">
                <button onClick={() => delKPI(idx)}
                  className="no-print absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                  <X size={13} />
                </button>
                {/* Label */}
                <input
                  value={k.label}
                  onChange={e => update(idx,"label",e.target.value)}
                  placeholder="KPI name"
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-full border-0 p-0 bg-transparent focus:outline-none mb-3"
                />
                {/* Prev → Curr */}
                <div className="flex items-end gap-1.5 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-0.5">Prev</div>
                    <input value={k.prevValue} onChange={e => update(idx,"prevValue",e.target.value)} placeholder="—"
                      className="w-full text-base font-bold text-gray-400 border border-gray-100 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"/>
                  </div>
                  <span className="text-gray-300 mb-1.5 text-sm">→</span>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-0.5">Now</div>
                    <input value={k.value} onChange={e => update(idx,"value",e.target.value)} placeholder="—"
                      className="w-full text-xl font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"/>
                  </div>
                </div>
                {/* Delta badge + sub */}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                    trend === "positive" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    trend === "negative" ? "bg-red-50 text-red-600 border-red-200" :
                    "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                    <TrendIcon size={11} />
                    {delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "—"}
                  </span>
                  <input value={k.sub} onChange={e => update(idx,"sub",e.target.value)} placeholder="subtitle"
                    className="text-xs text-gray-400 flex-1 border-0 p-0 bg-transparent focus:outline-none"/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Generic draggable table section ──────────────────────────────────────────
function TableSection({ id, title, icon: Icon, items, onAdd, onDelete, onReorder, onUpdate, columns, renderRow }) {
  function handleDragEnd(result) {
    if (!result.destination) return;
    onReorder(reorder(items, result.source.index, result.destination.index));
  }
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Icon size={14} /> {title}
        </h2>
        <Button variant="outline" size="sm" onClick={onAdd} className="no-print">
          <Plus size={13} /> Add
        </Button>
      </div>
      <Card>
        {/* Column headers */}
        <div className="grid gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 rounded-t-xl" style={{ gridTemplateColumns: columns.map(c=>c.width).join(" ") }}>
          <div className="no-print w-6" />
          {columns.map(c => (
            <div key={c.key} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</div>
          ))}
          <div className="no-print w-7" />
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={id}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className={cn("divide-y divide-gray-50 rounded-b-xl", snapshot.isDraggingOver && "bg-blue-50/30")}>
                {items.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    No items yet — click Add to create one.
                  </div>
                )}
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "item-row grid gap-2 px-4 py-2.5 items-center group hover:bg-gray-50 transition-colors",
                          snapshot.isDragging && "bg-white shadow-lg rounded-xl"
                        )}
                        style={{ gridTemplateColumns: ["1.5rem", ...columns.map(c=>c.width), "1.75rem"].join(" "), ...provided.draggableProps.style }}
                      >
                        <DragHandle {...provided.dragHandleProps} />
                        {renderRow(item, index, (field, val) => onUpdate(index, field, val))}
                        <button onClick={() => onDelete(index)}
                          className="row-actions no-print text-gray-300 hover:text-red-400 transition-colors justify-self-end">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>
    </section>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]   = useState(null);
  const [saved, setSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setData(raw ? JSON.parse(raw) : makeInitialData());
    } catch {
      setData(makeInitialData());
    }
  }, []);

  // Auto-save to localStorage on change
  useEffect(() => {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const set = useCallback((field, val) => setData(d => ({ ...d, [field]: val })), []);

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading…</div>
    </div>
  );

  // ── Section update helpers ────────────────────────────────────────────────
  function sectionAdd(field, makeFn) {
    setData(d => ({ ...d, [field]: addToTop(d[field], makeFn()) }));
  }
  function sectionDelete(field, idx) {
    setData(d => ({ ...d, [field]: d[field].filter((_,i) => i!==idx) }));
  }
  function sectionReorder(field, next) {
    setData(d => ({ ...d, [field]: next }));
  }
  function sectionUpdate(field, idx, key, val) {
    setData(d => ({
      ...d,
      [field]: d[field].map((item,i) => i===idx ? {...item,[key]:val} : item)
    }));
  }

  // ── Export / Import ───────────────────────────────────────────────────────
  function exportJSON() {
    const blob = new Blob([JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${data.company.replace(/\s+/g,"-").toLowerCase()}-report-${MONTHS[data.month]}-${data.year}.json`;
    a.click();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try { setData(JSON.parse(ev.target.result)); } catch { alert("Invalid JSON file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Overall status ────────────────────────────────────────────────────────
  const overall = OVERALL_CONFIG[data.overallStatus] || OVERALL_CONFIG["on-track"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 no-print">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          {/* Logo + name */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity size={15} className="text-white" />
            </div>
            <input value={data.company} onChange={e => set("company",e.target.value)}
              className="text-sm font-semibold text-gray-900 border-0 bg-transparent focus:outline-none focus:ring-0 w-36 truncate"/>
            <span className="text-gray-200">|</span>
            <select value={data.month} onChange={e => set("month",parseInt(e.target.value))}
              className="text-sm text-gray-600 border-0 bg-transparent focus:outline-none font-medium">
              {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={data.year} onChange={e => set("year",parseInt(e.target.value))}
              className="text-sm text-gray-600 border-0 bg-transparent focus:outline-none font-medium w-20">
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <Button variant="secondary" size="sm" onClick={()=>{}} asChild>
                <span><Upload size={13} /> Load JSON</span>
              </Button>
              <input type="file" accept=".json" className="hidden" onChange={importJSON}/>
            </label>
            <Button variant="primary" size="sm" onClick={exportJSON}>
              {saved ? <><Save size={13}/> Saved!</> : <><Download size={13}/> Export JSON</>}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={13}/> Print
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ── Status Banner ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
            <select value={data.overallStatus} onChange={e => set("overallStatus",e.target.value)}
              className={cn("text-xs font-semibold border rounded-full px-3 py-1 focus:outline-none cursor-pointer", overall.cls)}>
              {overallOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Zap size={13} className="text-gray-400 flex-shrink-0" />
            <input value={data.primaryFocus} onChange={e => set("primaryFocus",e.target.value)}
              placeholder="Primary focus this month — one clear sentence"
              className="flex-1 text-sm text-gray-700 border-0 bg-transparent focus:outline-none min-w-0"/>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
            <input value={data.primaryRisk} onChange={e => set("primaryRisk",e.target.value)}
              placeholder="Primary risk — what could block us?"
              className="flex-1 text-sm text-gray-600 border-0 bg-transparent focus:outline-none min-w-0"/>
          </div>
        </div>

        {/* ── ① KPI Cards ── */}
        <KPISection kpis={data.kpis} onChange={next => set("kpis",next)} />

        {/* ── ② Key Business Signals ── */}
        <TableSection
          id="signals"
          title="Key Business Signals"
          icon={Activity}
          items={data.signals}
          onAdd={()    => sectionAdd("signals", makeSignal)}
          onDelete={i  => sectionDelete("signals", i)}
          onReorder={n => sectionReorder("signals", n)}
          onUpdate={(i,k,v) => sectionUpdate("signals",i,k,v)}
          columns={[
            { key:"text",   label:"Signal / Observation",       width:"1fr"    },
            { key:"impact", label:"Impact",                     width:"130px"  },
          ]}
          renderRow={(item, idx, update) => <>
            <Textarea value={item.text} onChange={e => update("text",e.target.value)}
              placeholder="Describe the business signal or observation…" />
            <Select
              value={item.impact}
              onChange={v => update("impact",v)}
              options={impactOpts}
              className={cn(IMPACT_CONFIG[item.impact]?.cls || "", "w-full")}
            />
          </>}
        />

        {/* ── ③ Product & Delivery ── */}
        <TableSection
          id="delivery"
          title="Product & Delivery"
          icon={Zap}
          items={data.delivery}
          onAdd={()    => sectionAdd("delivery", makeDelivery)}
          onDelete={i  => sectionDelete("delivery", i)}
          onReorder={n => sectionReorder("delivery", n)}
          onUpdate={(i,k,v) => sectionUpdate("delivery",i,k,v)}
          columns={[
            { key:"title",    label:"Feature / Initiative",    width:"1fr"   },
            { key:"status",   label:"Status",                  width:"130px" },
            { key:"priority", label:"Priority",                width:"120px" },
            { key:"notes",    label:"Notes",                   width:"200px" },
          ]}
          renderRow={(item, idx, update) => <>
            <Input value={item.title} onChange={e => update("title",e.target.value)}
              placeholder="Feature, module, or initiative…" />
            <Select value={item.status} onChange={v => update("status",v)} options={statusOpts}
              className={cn(STATUS_CONFIG[item.status]?.cls || "", "w-full")} />
            <Select value={item.priority} onChange={v => update("priority",v)} options={priorityOpts}
              className={cn(PRIORITY_CONFIG[item.priority]?.cls || "", "w-full")} />
            <Input value={item.notes} onChange={e => update("notes",e.target.value)}
              placeholder="Notes…" className="text-gray-500"/>
          </>}
        />

        {/* ── ④ Risks & Constraints ── */}
        <TableSection
          id="risks"
          title="Risks & Constraints"
          icon={AlertTriangle}
          items={data.risks}
          onAdd={()    => sectionAdd("risks", makeRisk)}
          onDelete={i  => sectionDelete("risks", i)}
          onReorder={n => sectionReorder("risks", n)}
          onUpdate={(i,k,v) => sectionUpdate("risks",i,k,v)}
          columns={[
            { key:"text",       label:"Risk / Constraint",   width:"1fr"   },
            { key:"severity",   label:"Severity",            width:"120px" },
            { key:"mitigation", label:"Mitigation",          width:"200px" },
            { key:"owner",      label:"Owner",               width:"130px" },
          ]}
          renderRow={(item, idx, update) => <>
            <Textarea value={item.text} onChange={e => update("text",e.target.value)}
              placeholder="Describe the risk or constraint…" />
            <Select value={item.severity} onChange={v => update("severity",v)} options={severityOpts}
              className={cn(SEVERITY_CONFIG[item.severity]?.cls || "", "w-full")} />
            <Input value={item.mitigation} onChange={e => update("mitigation",e.target.value)}
              placeholder="Mitigation plan…" className="text-gray-500"/>
            <Input value={item.owner} onChange={e => update("owner",e.target.value)}
              placeholder="Owner…" className="text-gray-500"/>
          </>}
        />

        {/* ── ⑤ Strategic Focus ── */}
        <TableSection
          id="focus"
          title="Strategic Focus — Next 4 Weeks"
          icon={Target}
          items={data.focus}
          onAdd={()    => sectionAdd("focus", makeFocus)}
          onDelete={i  => sectionDelete("focus", i)}
          onReorder={n => sectionReorder("focus", n)}
          onUpdate={(i,k,v) => sectionUpdate("focus",i,k,v)}
          columns={[
            { key:"goal",     label:"Initiative / Goal",   width:"1fr"   },
            { key:"timeline", label:"Timeline",            width:"140px" },
            { key:"owner",    label:"Owner",               width:"160px" },
          ]}
          renderRow={(item, idx, update) => <>
            <Input value={item.goal} onChange={e => update("goal",e.target.value)}
              placeholder="Strategic initiative or goal…" />
            <Input value={item.timeline} onChange={e => update("timeline",e.target.value)}
              placeholder="e.g. Q2 2026" className="text-gray-500"/>
            <Input value={item.owner} onChange={e => update("owner",e.target.value)}
              placeholder="Owner / team…" className="text-gray-500"/>
          </>}
        />

        {/* ── ⑥ Partners ── */}
        <TableSection
          id="partners"
          title="Partners"
          icon={Handshake}
          items={data.partners}
          onAdd={()    => sectionAdd("partners", makePartner)}
          onDelete={i  => sectionDelete("partners", i)}
          onReorder={n => sectionReorder("partners", n)}
          onUpdate={(i,k,v) => sectionUpdate("partners",i,k,v)}
          columns={[
            { key:"name",   label:"Partner",        width:"180px" },
            { key:"status", label:"Status",         width:"120px" },
            { key:"notes",  label:"Update / Notes", width:"1fr"   },
          ]}
          renderRow={(item, idx, update) => <>
            <Input value={item.name} onChange={e => update("name",e.target.value)}
              placeholder="Partner name…" className="font-medium"/>
            <Select value={item.status} onChange={v => update("status",v)} options={partnerOpts}
              className={cn(PARTNER_STATUS_CONFIG[item.status]?.cls || "", "w-full")} />
            <Textarea value={item.notes} onChange={e => update("notes",e.target.value)}
              placeholder="Update, next steps, notes…" className="text-gray-500"/>
          </>}
        />

        {/* ── Footer ── */}
        <div className="text-center text-xs text-gray-300 py-4 no-print">
          {data.company} · Monthly Report · {MONTHS[data.month]} {data.year} · Auto-saved
        </div>
      </main>
    </div>
  );
}
