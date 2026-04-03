import { cn } from "@/lib/utils";

const variants = {
  default:     "bg-gray-900 text-white hover:bg-gray-800",
  primary:     "bg-brand-600 text-white hover:bg-brand-700",
  secondary:   "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  ghost:       "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  destructive: "text-red-500 hover:bg-red-50 hover:text-red-600",
  outline:     "border border-brand-200 text-brand-600 bg-brand-50 hover:bg-brand-100",
};

const sizes = {
  sm:   "h-7 px-2.5 text-xs gap-1",
  md:   "h-8 px-3 text-sm gap-1.5",
  icon: "h-7 w-7 p-0",
};

export function Button({ variant = "default", size = "md", className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
