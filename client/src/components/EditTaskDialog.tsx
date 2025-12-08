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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { RefreshType, Task } from "./TaskCard";
import { Category } from "./CategorySidebar";
import { cn } from "@/lib/utils";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  categories: Category[];
  onUpdateTask: (id: string, updates: { title?: string; refreshType?: RefreshType; categoryId?: string; deadline?: Date | null }) => void;
}

export default function EditTaskDialog({ 
  open, 
  onOpenChange, 
  task,
  categories, 
  onUpdateTask 
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [refreshType, setRefreshType] = useState<RefreshType>("none");
  const [categoryId, setCategoryId] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setRefreshType(task.refreshType);
      setCategoryId(task.categoryId || "");
      if (task.deadline) {
        const deadlineDate = typeof task.deadline === 'string' ? new Date(task.deadline) : task.deadline;
        setDeadline(deadlineDate);
      } else {
        setDeadline(undefined);
      }
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !task) return;
    
    onUpdateTask(task.id, {
      title: title.trim(),
      refreshType,
      categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
      deadline: deadline || null,
    });
    
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                data-testid="input-task-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refresh">Refresh Cycle</Label>
              <Select value={refreshType} onValueChange={(value) => setRefreshType(value as RefreshType)}>
                <SelectTrigger data-testid="select-refresh-type">
                  <SelectValue placeholder="Select refresh cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Refresh</SelectItem>
                  <SelectItem value="daily">Daily (7am SGT)</SelectItem>
                  <SelectItem value="weekly">Weekly (Sunday 7am SGT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Deadline (Optional)</Label>
                {deadline && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeadline(undefined);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
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
                    onSelect={(date) => {
                      if (date) {
                        // Set to midnight in local timezone to avoid timezone issues
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        setDeadline(localDate);
                      } else {
                        setDeadline(undefined);
                      }
                    }}
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
            <Button type="submit" disabled={!title.trim()} data-testid="button-submit-task">
              Update Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
