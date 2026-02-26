import { motion } from "framer-motion";
import { FileCode, Sparkles } from "lucide-react";

const EditorWelcome = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-night relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-[80px] pointer-events-none" />
      
      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <motion.div
          className="inline-flex w-20 h-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6"
          animate={{ 
            boxShadow: [
              "0 0 0px hsl(var(--primary) / 0)",
              "0 0 30px hsl(var(--primary) / 0.15)",
              "0 0 0px hsl(var(--primary) / 0)",
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <FileCode className="h-9 w-9 text-primary" />
        </motion.div>
        
        <h2 className="text-xl font-space font-bold text-foreground mb-2 tracking-tight">
          Select a file
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Choose a file from the left or create a new one.
          <br />
          Collaborate in real time with your team.
        </p>
      </motion.div>
    </div>
  );
};

export default EditorWelcome;
