import { useState } from "react";
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
import { RefreshType } from "./TaskCard";
import { Category } from "./CategorySidebar";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onCreateTask: (task: { title: string; refreshType: RefreshType; categoryId?: string }) => void;
}

export default function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  categories, 
  onCreateTask 
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [refreshType, setRefreshType] = useState<RefreshType>("none");
  const [categoryId, setCategoryId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onCreateTask({
      title: title.trim(),
      refreshType,
      categoryId: categoryId || undefined,
    });
    
    setTitle("");
    setRefreshType("none");
    setCategoryId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
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
                  <SelectItem value="daily">Daily (7am)</SelectItem>
                  <SelectItem value="weekly">Weekly (Sunday)</SelectItem>
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
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} data-testid="button-submit-task">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
