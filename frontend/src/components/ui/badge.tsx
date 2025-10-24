import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
};

const variants: Record<Required<BadgeProps>["variant"], string> = {
  default:
    "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
};

export const Badge = ({ children, variant = "default", className }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex min-w-[80px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
