import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  CheckSquare, 
  Inbox, 
  Calendar, 
  RefreshCw, 
  FolderOpen, 
  Plus,
  Settings,
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon?: string;
  taskCount: number;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory?: () => void;
}

const defaultViews = [
  { id: "inbox", name: "Inbox", icon: Inbox },
  { id: "today", name: "Today", icon: Calendar },
  { id: "daily", name: "Daily Tasks", icon: RefreshCw },
  { id: "weekly", name: "Weekly Tasks", icon: RefreshCw },
];

export default function CategorySidebar({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onAddCategory 
}: CategorySidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary">
            <CheckSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold" data-testid="text-app-title">TaskFlow</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Views</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {defaultViews.map((view) => (
                  <SidebarMenuItem key={view.id}>
                    <SidebarMenuButton
                      isActive={selectedCategoryId === view.id}
                      onClick={() => onSelectCategory(view.id)}
                      data-testid={`button-view-${view.id}`}
                    >
                      <view.icon className="w-4 h-4" />
                      <span>{view.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <SidebarGroupLabel>Categories</SidebarGroupLabel>
              {onAddCategory && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onAddCategory}
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {categories.map((category) => (
                  <SidebarMenuItem key={category.id}>
                    <SidebarMenuButton
                      isActive={selectedCategoryId === category.id}
                      onClick={() => onSelectCategory(category.id)}
                      data-testid={`button-category-${category.id}`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="flex-1">{category.name}</span>
                      <span className="text-xs text-muted-foreground">{category.taskCount}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start" data-testid="button-settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
