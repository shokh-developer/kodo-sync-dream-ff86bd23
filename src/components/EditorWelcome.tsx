import { motion } from "framer-motion";
import { FileCode } from "lucide-react";

const EditorWelcome = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-cyber">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="inline-flex p-6 rounded-2xl bg-primary/10 mb-6"
          animate={{ 
            boxShadow: [
              "0 0 20px hsl(330 100% 60% / 0.2)",
              "0 0 40px hsl(330 100% 60% / 0.4)",
              "0 0 20px hsl(330 100% 60% / 0.2)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FileCode className="h-16 w-16 text-primary" />
        </motion.div>
        
        <h2 className="text-2xl font-orbitron font-bold text-foreground mb-3">
          Fayl tanlang
        </h2>
        <p className="text-muted-foreground font-rajdhani max-w-md">
          Chapdan fayl tanlang yoki yangi fayl yarating.
          <br />
          Do'stlaringiz bilan real-time rejimda kod yozing!
        </p>
      </motion.div>
    </div>
  );
};

export default EditorWelcome;
