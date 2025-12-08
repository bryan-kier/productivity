import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateCategoryDialog from "../CreateCategoryDialog";

export default function CreateCategoryDialogExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Create Category Dialog</Button>
      <CreateCategoryDialog
        open={open}
        onOpenChange={setOpen}
        onCreateCategory={(name) => console.log("Created category:", name)}
      />
    </div>
  );
}
