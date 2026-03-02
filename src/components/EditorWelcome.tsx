import { FileCode } from "lucide-react";

const EditorWelcome = () => {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="inline-flex w-14 h-14 items-center justify-center rounded-lg bg-primary/10 border border-border mb-4">
          <FileCode className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1.5">Select a file</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Choose a file from the explorer or create a new one.
        </p>
      </div>
    </div>
  );
};

export default EditorWelcome;
