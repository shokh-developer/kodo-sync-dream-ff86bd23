import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-destructive/[0.03] blur-[120px]" />
      </div>
      <motion.div className="text-center relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 mb-6">
          <FileQuestion className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Page not found</p>
        <Button asChild className="gap-2">
          <a href="/"><ArrowLeft className="h-4 w-4" /> Back to Home</a>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
