import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MangaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "pink" | "blue" | "green";
  hover?: boolean;
}

const MangaCard = React.forwardRef<HTMLDivElement, MangaCardProps>(
  ({ className, glowColor = "pink", hover = true, children, ...props }, ref) => {
    const glowStyles = {
      pink: "hover:border-neon-pink hover:shadow-[0_0_30px_hsl(330_100%_60%/0.3)]",
      blue: "hover:border-neon-blue hover:shadow-[0_0_30px_hsl(195_100%_50%/0.3)]",
      green: "hover:border-neon-green hover:shadow-[0_0_30px_hsl(150_100%_45%/0.3)]",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "manga-panel rounded-xl p-6 transition-all duration-300",
          hover && glowStyles[glowColor],
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);
MangaCard.displayName = "MangaCard";

export { MangaCard };
