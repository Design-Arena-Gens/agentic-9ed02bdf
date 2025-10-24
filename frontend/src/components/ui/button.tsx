"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
};

export const Button = ({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  asChild = false,
  size = "md",
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";

  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  const variants: Record<string, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline-brand-600 disabled:opacity-70 disabled:cursor-not-allowed",
    secondary:
      "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed",
    danger:
      "bg-red-500 text-white hover:bg-red-400 focus-visible:outline-red-500 disabled:opacity-70 disabled:cursor-not-allowed",
  };

  const isDisabled = disabled || loading;

  const sharedProps = asChild
    ? { "aria-disabled": isDisabled, ...props }
    : { disabled: isDisabled, ...props };

  return (
    <Comp
      className={cn(base, sizes[size], variants[variant], isDisabled && "pointer-events-none opacity-70", className)}
      {...(sharedProps as Record<string, unknown>)}
    >
      {loading ? "Loading..." : children}
    </Comp>
  );
};
