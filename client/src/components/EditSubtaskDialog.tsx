import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Subtask } from "./TaskCard";
import { cn } from "@/lib/utils";

interface EditSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtask: { id: string; title: string; completed: boolean; deadline?: Date | string | null } | null;
  onUpdateSubtask: (id: string, updates: { title?: string; deadline?: Date | null }) => void;
}

export default function EditSubtaskDialog({ 
  open, 
  onOpenChange, 
  subtask,
  onUpdateSubtask 
}: EditSubtaskDialogProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      if (subtask.deadline) {
        const deadlineDate = typeof subtask.deadline === 'string' ? new Date(subtask.deadline) : subtask.deadline;
        setDeadline(deadlineDate);
      } else {
        setDeadline(undefined);
      }
    }
  }, [subtask, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subtask) return;
    
    onUpdateSubtask(subtask.id, {
      title: title.trim(),
      deadline: deadline || null,
    });
    
    onOpenChange(false);
  };

  if (!subtask) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subtask</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subtask-title">Subtask Title</Label>
              <Input
                id="subtask-title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                data-testid="input-subtask-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                    data-testid="button-deadline-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} data-testid="button-submit-subtask">
              Update Subtask
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
