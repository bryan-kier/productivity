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
  MoreVertical,
  Edit,
  Trash2,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Category {
  id: string;
  name: string;
  icon?: string;
  taskCount: number;
  noteCount: number;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory?: () => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (id: string) => void;
}

const defaultViews = [
  { id: "inbox", name: "Inbox", icon: Inbox },
  { id: "today", name: "Today", icon: Calendar },
  { id: "daily", name: "Daily Tasks", icon: RefreshCw },
  { id: "weekly", name: "Weekly Tasks", icon: RefreshCw },
  { id: "completed", name: "Completed", icon: CheckCheck },
];

export default function CategorySidebar({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
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
                    <div className="flex items-center w-full group">
                      <SidebarMenuButton
                        isActive={selectedCategoryId === category.id}
                        onClick={() => onSelectCategory(category.id)}
                        data-testid={`button-category-${category.id}`}
                        className="flex-1"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span className="flex-1">{category.name}</span>
                        <div className="flex items-center gap-1">
                          {category.taskCount > 0 && (
                            <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded" title="Tasks">
                              {category.taskCount}
                            </span>
                          )}
                          {category.noteCount > 0 && (
                            <span className="text-xs font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded" title="Notes">
                              {category.noteCount}
                            </span>
                          )}
                        </div>
                      </SidebarMenuButton>
                      {(onEditCategory || onDeleteCategory) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-category-menu-${category.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEditCategory && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditCategory(category);
                                }}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDeleteCategory && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteCategory(category.id);
                                }}
                                className="text-destructive"
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
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
