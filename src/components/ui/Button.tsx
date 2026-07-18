import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm hover:shadow focus-visible:ring-primary",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary",
      outline: "border border-border bg-transparent text-foreground hover:bg-accent/40 focus-visible:ring-border",
      ghost: "bg-transparent text-foreground hover:bg-accent/40 hover:text-accent-foreground focus-visible:ring-accent",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
    };

    const sizes = {
      sm: "h-8.5 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
