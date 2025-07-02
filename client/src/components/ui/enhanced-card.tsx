import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'elevated' | 'interactive' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, variant = 'default', size = 'md', ...props }, ref) => {
  const variants = {
    default: "bg-card text-card-foreground border shadow-sm",
    elevated: "bg-card text-card-foreground border shadow-lg hover:shadow-xl transition-shadow duration-300",
    interactive: "bg-card text-card-foreground border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer",
    outline: "border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors",
    ghost: "hover:bg-muted/50 transition-colors duration-200"
  };

  const sizes = {
    sm: "p-3 rounded-md",
    md: "p-4 rounded-lg", 
    lg: "p-6 rounded-lg",
    xl: "p-8 rounded-xl"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'none' | 'sm' | 'md' | 'lg';
  }
>(({ className, spacing = 'md', ...props }, ref) => {
  const spacingClasses = {
    none: "p-0",
    sm: "pb-2",
    md: "pb-4",
    lg: "pb-6"
  };

  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", spacingClasses[spacing], className)}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }
>(({ className, level = 3, ...props }, ref) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Component
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        level === 1 && "text-4xl",
        level === 2 && "text-3xl", 
        level === 3 && "text-2xl",
        level === 4 && "text-xl",
        level === 5 && "text-lg",
        level === 6 && "text-base",
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    truncate?: boolean;
    lines?: number;
  }
>(({ className, truncate, lines, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      truncate && "truncate",
      lines && `line-clamp-${lines}`,
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'none' | 'sm' | 'md' | 'lg';
  }
>(({ className, spacing = 'md', ...props }, ref) => {
  const spacingClasses = {
    none: "p-0",
    sm: "p-2",
    md: "p-4",
    lg: "p-6"
  };

  return (
    <div
      ref={ref} 
      className={cn(spacingClasses[spacing], className)} 
      {...props} 
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right' | 'between';
  }
>(({ className, align = 'left', ...props }, ref) => {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center", 
    right: "justify-end",
    between: "justify-between"
  };

  return (
    <div
      ref={ref}
      className={cn("flex items-center pt-4", alignClasses[align], className)}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }