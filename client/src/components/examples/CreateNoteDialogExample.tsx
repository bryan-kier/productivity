import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateNoteDialog from "../CreateNoteDialog";
import { Category } from "../CategorySidebar";

// todo: remove mock functionality
const mockCategories: Category[] = [
  { id: "work", name: "Work", taskCount: 5 },
  { id: "personal", name: "Personal", taskCount: 3 },
];

export default function CreateNoteDialogExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Create Note Dialog</Button>
      <CreateNoteDialog
        open={open}
        onOpenChange={setOpen}
        categories={mockCategories}
        onCreateNote={(note) => console.log("Created note:", note)}
      />
    </div>
  );
}
