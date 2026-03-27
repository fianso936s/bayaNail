import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-[var(--transition-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[var(--elevation-2)] hover:bg-[hsl(var(--primary-hover))] hover:shadow-[var(--elevation-3)] hover:shadow-primary/30",
        secondary:
          "border border-border bg-card text-foreground hover:bg-muted hover:shadow-[var(--elevation-1)]",
        tertiary:
          "bg-transparent text-muted-foreground hover:text-primary hover:underline underline-offset-4 min-h-0 h-auto p-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)]",
        outline:
          "border border-border bg-transparent hover:bg-muted hover:shadow-[var(--elevation-1)]",
        ghost: 
          "hover:bg-muted hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline min-h-0",
        success:
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(142_76%_32%)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)]",
        warm:
          "bg-[hsl(var(--accent-warm))] text-[hsl(var(--accent-warm-foreground))] hover:bg-[hsl(25_95%_45%)] shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)]",
      },
      size: {
        default: "px-6 py-3",
        xs: "h-8 rounded-md px-2.5 text-xs",
        sm: "h-9 rounded-md px-4",
        md: "h-10 px-5 py-2.5",
        lg: "h-12 rounded-[var(--radius)] px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      success,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const content = () => {
      if (loading) {
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        );
      }
      if (success) {
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Enregistré
          </>
        );
      }
      return (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      );
    };

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant: success ? "success" : variant,
            size,
            className,
          })
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {content()}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
