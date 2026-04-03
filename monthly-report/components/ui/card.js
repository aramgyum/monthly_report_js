import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("flex items-center justify-between px-5 py-4 border-b border-gray-100", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <h2 className={cn("text-sm font-semibold text-gray-500 uppercase tracking-wider", className)}>
      {children}
    </h2>
  );
}

export function CardContent({ className, children }) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
