import * as React from "react";

import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: "default" | "elevated" | "outlined" | "glass";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, variant = "default", ...props }, ref) => {
    const variants = {
      default: "border border-border/50 bg-card shadow-elevation-1",
      elevated: "border-0 bg-card shadow-elevation-3",
      outlined: "border-2 border-border bg-transparent shadow-none",
      glass: "border border-white/10 bg-card/80 backdrop-blur-md shadow-elevation-2",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] text-card-foreground transition-all duration-[var(--transition-normal)] ease-[var(--ease-standard)]",
          variants[variant],
          hoverable && [
            "group/card",
            "hover:shadow-elevation-3",
            "hover:border-primary/20",
            "hover:-translate-y-0.5",
            "active:translate-y-0",
            "active:scale-[0.995]",
          ],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight transition-colors duration-[var(--transition-fast)] group-hover/card:text-primary md:text-2xl",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// CardIcon component for consistent icon styling within cards
const CardIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "primary" | "muted" | "success" | "warning" | "destructive" }
>(({ className, variant = "primary", ...props }, ref) => {
  const variants = {
    primary: "bg-primary/10 text-primary group-hover/card:bg-primary/15",
    muted: "bg-muted text-muted-foreground group-hover/card:bg-muted/80",
    success: "bg-success/10 text-success group-hover/card:bg-success/15",
    warning: "bg-accent-warm/10 text-accent-warm group-hover/card:bg-accent-warm/15",
    destructive: "bg-destructive/10 text-destructive group-hover/card:bg-destructive/15",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-[var(--radius)] transition-all duration-[var(--transition-fast)]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
CardIcon.displayName = "CardIcon";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardIcon,
};
