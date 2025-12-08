import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import CategorySidebar, { Category } from "../CategorySidebar";

// todo: remove mock functionality
const mockCategories: Category[] = [
  { id: "work", name: "Work", taskCount: 5 },
  { id: "personal", name: "Personal", taskCount: 3 },
  { id: "shopping", name: "Shopping", taskCount: 2 },
];

export default function CategorySidebarExample() {
  const [selected, setSelected] = useState<string | null>("inbox");
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-[400px] w-full">
        <CategorySidebar
          categories={mockCategories}
          selectedCategoryId={selected}
          onSelectCategory={setSelected}
          onAddCategory={() => console.log("Add category")}
        />
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">Selected: {selected}</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
