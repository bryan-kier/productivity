import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import CategorySidebar, { Category } from "@/components/CategorySidebar";
import TaskCard, { Task, RefreshType } from "@/components/TaskCard";
import NoteCard, { Note } from "@/components/NoteCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import EditTaskDialog from "@/components/EditTaskDialog";
import CreateNoteDialog from "@/components/CreateNoteDialog";
import EditNoteDialog from "@/components/EditNoteDialog";
import CreateCategoryDialog from "@/components/CreateCategoryDialog";
import EditCategoryDialog from "@/components/EditCategoryDialog";
import CreateSubtaskDialog from "@/components/CreateSubtaskDialog";
import EditSubtaskDialog from "@/components/EditSubtaskDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, RefreshCw, FileText, Loader2, ArrowDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ApiCategory {
  id: string;
  name: string;
}

interface ApiTask {
  id: string;
  title: string;
  completed: boolean;
  refreshType: string;
  categoryId: string | null;
  categoryName?: string;
  lastRefreshed: string | null;
  deadline: string | null;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
    deadline: string | null;
  }>;
}

interface ApiNote {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  categoryName?: string;
}

const STORAGE_KEY = "taskflow-selected-view";
const VALID_VIEWS = ["inbox", "today", "daily", "weekly"];

export default function Home() {
  // Load saved view from localStorage, default to "today"
  const [selectedView, setSelectedView] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          // Check if it's a valid predefined view
          if (VALID_VIEWS.includes(saved)) {
            return saved;
          }
          // Otherwise, it might be a category ID (we'll validate this when categories load)
          // For now, return it and we'll validate later
          return saved;
        }
      } catch (error) {
        console.error("Failed to load saved view:", error);
      }
    }
    return "today";
  });
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [createSubtaskTaskId, setCreateSubtaskTaskId] = useState<string>("");
  const [editSubtaskOpen, setEditSubtaskOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<{ id: string; title: string; completed: boolean; deadline?: Date | string | null } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "task" | "subtask" | "note" | "category"; id: string; name: string } | null>(null);
  const { toast } = useToast();

  // Save selected view to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && selectedView) {
      try {
        localStorage.setItem(STORAGE_KEY, selectedView);
      } catch (error) {
        console.error("Failed to save selected view:", error);
      }
    }
  }, [selectedView]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const { data: apiCategories = [], isLoading: categoriesLoading } = useQuery<ApiCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: apiTasks = [], isLoading: tasksLoading } = useQuery<ApiTask[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: apiNotes = [], isLoading: notesLoading } = useQuery<ApiNote[]>({
    queryKey: ["/api/notes"],
  });

  const categories: Category[] = apiCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    taskCount: apiTasks.filter(t => t.categoryId === cat.id).length,
  }));

  // Validate saved view when categories load - if it's a category ID that no longer exists, default to "today"
  useEffect(() => {
    if (!categoriesLoading && selectedView && !VALID_VIEWS.includes(selectedView)) {
      const categoryExists = categories.some(cat => cat.id === selectedView);
      if (!categoryExists) {
        setSelectedView("today");
      }
    }
  }, [categoriesLoading, categories, selectedView]);

  const tasks: Task[] = apiTasks.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    refreshType: task.refreshType as RefreshType,
    categoryId: task.categoryId || undefined,
    categoryName: task.categoryName,
    deadline: task.deadline || undefined,
    subtasks: task.subtasks.map(st => ({
      id: st.id,
      title: st.title,
      completed: st.completed,
      deadline: st.deadline || undefined,
    })),
  }));

  const notes: Note[] = apiNotes.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content,
    categoryId: note.categoryId || undefined,
    categoryName: note.categoryName,
  }));

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/categories", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: { title: string; refreshType: RefreshType; categoryId?: string; deadline?: Date }) => {
      return apiRequest("POST", "/api/tasks", {
        title: task.title,
        refreshType: task.refreshType,
        categoryId: task.categoryId || null,
        deadline: task.deadline ? task.deadline.toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { completed?: boolean; title?: string; refreshType?: RefreshType; categoryId?: string; deadline?: Date | null } }) => {
      const payload: any = { ...updates };
      if (updates.deadline !== undefined) {
        payload.deadline = updates.deadline ? updates.deadline.toISOString() : null;
      }
      return apiRequest("PATCH", `/api/tasks/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { completed?: boolean; title?: string; deadline?: Date | null } }) => {
      const payload: any = { ...updates };
      if (updates.deadline !== undefined) {
        payload.deadline = updates.deadline ? updates.deadline.toISOString() : null;
      }
      return apiRequest("PATCH", `/api/subtasks/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Subtask updated" });
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async (subtask: { taskId: string; title: string; deadline?: Date }) => {
      return apiRequest("POST", "/api/subtasks", {
        taskId: subtask.taskId,
        title: subtask.title,
        deadline: subtask.deadline ? subtask.deadline.toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Subtask created" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Note deleted" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Category deleted" });
      if (selectedView === id) {
        setSelectedView("inbox");
      }
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest("PATCH", `/api/categories/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { title?: string; content?: string; categoryId?: string | null } }) => {
      return apiRequest("PATCH", `/api/notes/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Note updated" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: { title: string; content: string; categoryId?: string }) => {
      return apiRequest("POST", "/api/notes", {
        title: note.title,
        content: note.content,
        categoryId: note.categoryId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Note created" });
    },
  });

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTaskMutation.mutate({ id, updates: { completed: !task.completed } });
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      updateSubtaskMutation.mutate({ id: subtaskId, updates: { completed: !subtask.completed } });
    }
  };

  const handleCreateTask = (newTask: { title: string; refreshType: RefreshType; categoryId?: string; deadline?: Date }) => {
    createTaskMutation.mutate(newTask);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskOpen(true);
  };

  const handleUpdateTask = (id: string, updates: { title?: string; refreshType?: RefreshType; categoryId?: string; deadline?: Date | null }) => {
    updateTaskMutation.mutate({ id, updates });
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setDeleteTarget({ type: "task", id, name: task.title });
      setDeleteConfirmOpen(true);
    }
  };

  const handleCreateNote = (newNote: { title: string; content: string; categoryId?: string }) => {
    createNoteMutation.mutate(newNote);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNoteOpen(true);
  };

  const handleUpdateNote = (id: string, updates: { title?: string; content?: string; categoryId?: string | null }) => {
    updateNoteMutation.mutate({ id, updates });
  };

  const handleDeleteNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setDeleteTarget({ type: "note", id, name: note.title });
      setDeleteConfirmOpen(true);
    }
  };

  const handleCreateCategory = (name: string) => {
    createCategoryMutation.mutate(name);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryOpen(true);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    updateCategoryMutation.mutate({ id, name });
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      setDeleteTarget({ type: "category", id, name: category.name });
      setDeleteConfirmOpen(true);
    }
  };

  const handleAddSubtask = (taskId: string) => {
    setCreateSubtaskTaskId(taskId);
    setCreateSubtaskOpen(true);
  };

  const handleCreateSubtask = (taskId: string, subtask: { title: string; deadline?: Date }) => {
    createSubtaskMutation.mutate({ taskId, ...subtask });
  };

  const handleEditSubtask = (subtask: { id: string; title: string; completed: boolean; deadline?: Date | string | null }) => {
    setEditingSubtask(subtask);
    setEditSubtaskOpen(true);
  };

  const handleUpdateSubtask = (id: string, updates: { title?: string; deadline?: Date | null }) => {
    updateSubtaskMutation.mutate({ id, updates });
  };

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/subtasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Subtask deleted" });
    },
  });

  const handleDeleteSubtask = (id: string) => {
    // Find subtask to get name for confirmation
    const task = tasks.find(t => t.subtasks.some(st => st.id === id));
    const subtask = task?.subtasks.find(st => st.id === id);
    if (subtask) {
      setDeleteTarget({ type: "subtask", id, name: subtask.title });
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    
    switch (deleteTarget.type) {
      case "task":
        deleteTaskMutation.mutate(deleteTarget.id);
        break;
      case "subtask":
        deleteSubtaskMutation.mutate(deleteTarget.id);
        break;
      case "note":
        deleteNoteMutation.mutate(deleteTarget.id);
        break;
      case "category":
        deleteCategoryMutation.mutate(deleteTarget.id);
        break;
    }
    
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const getFilteredTasks = () => {
    switch (selectedView) {
      case "inbox":
        return tasks;
      case "today":
        return tasks.filter(t => t.refreshType === "daily" || !t.completed);
      case "daily":
        return tasks.filter(t => t.refreshType === "daily");
      case "weekly":
        return tasks.filter(t => t.refreshType === "weekly");
      default:
        return tasks.filter(t => t.categoryId === selectedView);
    }
  };

  const getFilteredNotes = () => {
    if (selectedView === "inbox" || selectedView === "today" || selectedView === "daily" || selectedView === "weekly") {
      return notes;
    }
    return notes.filter(n => n.categoryId === selectedView);
  };

  const getViewTitle = () => {
    switch (selectedView) {
      case "inbox": return "Inbox";
      case "today": return "Today";
      case "daily": return "Daily Tasks";
      case "weekly": return "Weekly Tasks";
      default:
        return categories.find(c => c.id === selectedView)?.name || "Tasks";
    }
  };

  const handleRefresh = () => {
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
    ]);
    toast({ title: "Refreshing..." });
  };

  const filteredTasks = getFilteredTasks();
  const filteredNotes = getFilteredNotes();
  const isLoading = categoriesLoading || tasksLoading || notesLoading;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pullCurrentY = useRef(0);
  const isDragging = useRef(false);
  const PULL_THRESHOLD = 80; // Distance in pixels to trigger refresh

  // Pull-to-refresh: detect pull gesture from top
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull if at the top of the scroll container
      if (container.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
        isDragging.current = true;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || container.scrollTop > 0) {
        isDragging.current = false;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      pullCurrentY.current = e.touches[0].clientY;
      const distance = Math.max(0, pullCurrentY.current - pullStartY.current);
      
      // Only allow pulling down (positive distance)
      if (distance > 0) {
        setPullDistance(distance);
        // Prevent default scrolling when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        // Refresh all queries
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
        ]).then(() => {
          // Reset after refresh completes
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
          }, 300);
        });
      } else {
        // Snap back if not enough pull
        setPullDistance(0);
        setIsPulling(false);
      }
      
      isDragging.current = false;
    };

    // Mouse events for desktop
    const handleMouseDown = (e: MouseEvent) => {
      if (container.scrollTop === 0 && e.button === 0) {
        pullStartY.current = e.clientY;
        isDragging.current = true;
        setIsPulling(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || container.scrollTop > 0) {
        isDragging.current = false;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      pullCurrentY.current = e.clientY;
      const distance = Math.max(0, pullCurrentY.current - pullStartY.current);
      
      if (distance > 0) {
        setPullDistance(distance);
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
        ]).then(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
          }, 300);
        });
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
      
      isDragging.current = false;
    };

    // Touch events
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    // Mouse events
    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pullDistance, isRefreshing]);

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedView}
          onSelectCategory={setSelectedView}
          onAddCategory={() => setCreateCategoryOpen(true)}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
        
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-4 p-4 border-b border-border flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-semibold" data-testid="text-view-title">{getViewTitle()}</h1>
            {!isLoading && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{filteredTasks.length} tasks</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{filteredNotes.length} notes</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-4 ml-auto">
              {(selectedView === "daily" || selectedView === "weekly") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    {selectedView === "daily" ? "Refreshes daily at 7:00 AM SGT" : "Refreshes every Sunday at 7:00 AM SGT"}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-9 w-9"
                data-testid="button-refresh"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </header>
          
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto relative"
            style={{
              transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, PULL_THRESHOLD)}px)` : 'translateY(0)',
              transition: isPulling || isRefreshing ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {/* Pull-to-refresh indicator */}
            {(isPulling || isRefreshing) && (
              <div 
                className="absolute top-0 left-0 right-0 flex items-center justify-center"
                style={{
                  height: `${Math.min(pullDistance, PULL_THRESHOLD)}px`,
                  transform: `translateY(-${Math.min(pullDistance, PULL_THRESHOLD)}px)`,
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  {isRefreshing ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <ArrowDown 
                      className="w-6 h-6 text-muted-foreground transition-transform"
                      style={{
                        transform: pullDistance >= PULL_THRESHOLD ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {isRefreshing 
                      ? 'Refreshing...' 
                      : pullDistance >= PULL_THRESHOLD 
                        ? 'Release to refresh' 
                        : 'Pull to refresh'}
                  </span>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 min-w-0 lg:w-3/5">
                  <div className="p-6 space-y-4">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No tasks yet. Create one to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={handleToggleTask}
                            onToggleSubtask={handleToggleSubtask}
                            onAddSubtask={handleAddSubtask}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onEditSubtask={handleEditSubtask}
                            onDeleteSubtask={handleDeleteSubtask}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lg:w-2/5 border-t lg:border-t-0 lg:border-l border-border">
                  <div className="p-6 space-y-4">
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No notes yet. Create one to capture your thoughts!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredNotes.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={(n) => console.log("View note:", n.id)}
                            onEdit={handleEditNote}
                            onDelete={handleDeleteNote}
                            categories={categories}
                            onUpdateNote={handleUpdateNote}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <FloatingActionButton
          onCreateTask={() => setCreateTaskOpen(true)}
          onCreateNote={() => setCreateNoteOpen(true)}
        />
        
        <CreateTaskDialog
          open={createTaskOpen}
          onOpenChange={setCreateTaskOpen}
          categories={categories}
          onCreateTask={handleCreateTask}
        />
        
        <CreateNoteDialog
          open={createNoteOpen}
          onOpenChange={setCreateNoteOpen}
          categories={categories}
          onCreateNote={handleCreateNote}
        />
        
        <CreateCategoryDialog
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          onCreateCategory={handleCreateCategory}
        />
        
        <EditTaskDialog
          open={editTaskOpen}
          onOpenChange={setEditTaskOpen}
          task={editingTask}
          categories={categories}
          onUpdateTask={handleUpdateTask}
        />
        
        <EditNoteDialog
          open={editNoteOpen}
          onOpenChange={setEditNoteOpen}
          note={editingNote}
          categories={categories}
          onUpdateNote={handleUpdateNote}
        />
        
        <EditCategoryDialog
          open={editCategoryOpen}
          onOpenChange={setEditCategoryOpen}
          category={editingCategory}
          onUpdateCategory={handleUpdateCategory}
        />
        
        <CreateSubtaskDialog
          open={createSubtaskOpen}
          onOpenChange={setCreateSubtaskOpen}
          taskId={createSubtaskTaskId}
          onCreateSubtask={handleCreateSubtask}
        />
        
        <EditSubtaskDialog
          open={editSubtaskOpen}
          onOpenChange={setEditSubtaskOpen}
          subtask={editingSubtask}
          onUpdateSubtask={handleUpdateSubtask}
        />
        
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {deleteTarget?.type} "{deleteTarget?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
}
