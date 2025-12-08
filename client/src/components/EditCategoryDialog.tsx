import { useState, useEffect } from "react";
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
import { Category } from "./CategorySidebar";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onUpdateCategory: (id: string, name: string) => void;
}

export default function EditCategoryDialog({ 
  open, 
  onOpenChange, 
  category,
  onUpdateCategory 
}: EditCategoryDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) return;
    
    onUpdateCategory(category.id, name.trim());
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                data-testid="input-category-name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} data-testid="button-submit-category">
              Update Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
