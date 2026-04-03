import { cn } from "@/lib/utils";

export function Select({ className, options = [], value, onChange, ...props }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none pr-5 bg-no-repeat transition-colors",
        className
      )}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: "right 6px center" }}
      {...props}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
