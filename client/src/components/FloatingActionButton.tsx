import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, CheckSquare, FileText } from "lucide-react";

interface FloatingActionButtonProps {
  onCreateTask: () => void;
  onCreateNote: () => void;
}

export default function FloatingActionButton({ onCreateTask, onCreateNote }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
            data-testid="button-fab"
          >
            <Plus className={`w-6 h-6 transition-transform duration-200 ${open ? "rotate-45" : ""}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="mb-2">
          <DropdownMenuItem 
            onClick={onCreateTask}
            data-testid="button-create-task"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            New Task
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onCreateNote}
            data-testid="button-create-note"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
