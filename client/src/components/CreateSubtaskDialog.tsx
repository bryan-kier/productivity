import { useState } from "react";
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
import { cn } from "@/lib/utils";

interface CreateSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  onCreateSubtask: (taskId: string, subtask: { title: string; deadline?: Date }) => void;
}

export default function CreateSubtaskDialog({ 
  open, 
  onOpenChange, 
  taskId,
  onCreateSubtask 
}: CreateSubtaskDialogProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onCreateSubtask(taskId, {
      title: title.trim(),
      deadline: deadline,
    });
    
    setTitle("");
    setDeadline(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subtask</DialogTitle>
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
              Add Subtask
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
