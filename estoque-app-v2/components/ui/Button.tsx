"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90",
  secondary: "bg-white text-ink border border-line hover:bg-paper",
  ghost: "text-ink/70 hover:bg-paper",
  danger: "bg-white text-danger border border-danger/30 hover:bg-danger/5",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export default Button;
