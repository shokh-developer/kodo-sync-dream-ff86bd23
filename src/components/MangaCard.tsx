import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MangaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "pink" | "blue" | "green";
  hover?: boolean;
}

const MangaCard = React.forwardRef<HTMLDivElement, MangaCardProps>(
  ({ className, glowColor = "pink", hover = true, children, ...props }, ref) => {
    const hoverStyles = {
      pink: "hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)]",
      blue: "hover:border-secondary/40 hover:shadow-[0_0_40px_hsl(var(--secondary)/0.1)]",
      green: "hover:border-accent/40 hover:shadow-[0_0_40px_hsl(var(--accent)/0.1)]",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass-card rounded-2xl p-6 transition-all duration-300",
          hover && hoverStyles[glowColor],
          className
        )}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);
MangaCard.displayName = "MangaCard";

export { MangaCard };
