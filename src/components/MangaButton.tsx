import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const mangaButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 tracking-wide",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110",
        secondary:
          "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 hover:shadow-secondary/35 hover:brightness-110",
        accent:
          "bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:brightness-110",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted hover:border-primary/50 hover:text-primary",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        cyber:
          "bg-card border border-border text-foreground hover:border-primary/50 hover:text-primary shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg font-medium",
        md: "h-10 px-5 text-sm rounded-lg",
        lg: "h-12 px-7 text-base rounded-xl",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface MangaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mangaButtonVariants> {
  asChild?: boolean;
}

const MangaButton = React.forwardRef<HTMLButtonElement, MangaButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(mangaButtonVariants({ variant, size, className }))}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);
MangaButton.displayName = "MangaButton";

export { MangaButton, mangaButtonVariants };
