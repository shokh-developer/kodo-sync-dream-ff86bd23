import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const mangaButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-orbitron font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-manga text-primary-foreground glow-pink hover:scale-105 active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground glow-blue hover:brightness-110 hover:scale-105 active:scale-95",
        accent:
          "bg-accent text-accent-foreground hover:brightness-110 hover:scale-105 active:scale-95",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:glow-pink",
        ghost:
          "bg-transparent text-foreground hover:bg-muted hover:text-primary",
        cyber:
          "bg-cyber-mid border border-border text-foreground hover:border-primary hover:text-primary hover:glow-pink",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-md",
        md: "h-11 px-6 text-base rounded-lg",
        lg: "h-14 px-8 text-lg rounded-xl",
        icon: "h-10 w-10 rounded-lg",
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
        whileTap={{ scale: 0.98 }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);
MangaButton.displayName = "MangaButton";

export { MangaButton, mangaButtonVariants };
