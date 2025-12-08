import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateTaskDialog from "../CreateTaskDialog";
import { Category } from "../CategorySidebar";

// todo: remove mock functionality
const mockCategories: Category[] = [
  { id: "work", name: "Work", taskCount: 5 },
  { id: "personal", name: "Personal", taskCount: 3 },
];

export default function CreateTaskDialogExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Create Task Dialog</Button>
      <CreateTaskDialog
        open={open}
        onOpenChange={setOpen}
        categories={mockCategories}
        onCreateTask={(task) => console.log("Created task:", task)}
      />
    </div>
  );
}
