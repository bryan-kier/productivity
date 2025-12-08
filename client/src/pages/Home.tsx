import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import CategorySidebar, { Category } from "@/components/CategorySidebar";
import TaskCard, { Task, RefreshType } from "@/components/TaskCard";
import NoteCard, { Note } from "@/components/NoteCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import CreateNoteDialog from "@/components/CreateNoteDialog";
import CreateCategoryDialog from "@/components/CreateCategoryDialog";
import { Calendar, RefreshCw, FileText, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    taskId: string;
  }>;
}

interface ApiNote {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  categoryName?: string;
}

export default function Home() {
  const [selectedView, setSelectedView] = useState<string | null>("inbox");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const { toast } = useToast();

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

  const tasks: Task[] = apiTasks.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    refreshType: task.refreshType as RefreshType,
    categoryId: task.categoryId || undefined,
    categoryName: task.categoryName,
    subtasks: task.subtasks.map(st => ({
      id: st.id,
      title: st.title,
      completed: st.completed,
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
    mutationFn: async (task: { title: string; refreshType: RefreshType; categoryId?: string }) => {
      return apiRequest("POST", "/api/tasks", {
        title: task.title,
        refreshType: task.refreshType,
        categoryId: task.categoryId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { completed?: boolean } }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { completed?: boolean } }) => {
      return apiRequest("PATCH", `/api/subtasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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

  const handleCreateTask = (newTask: { title: string; refreshType: RefreshType; categoryId?: string }) => {
    createTaskMutation.mutate(newTask);
  };

  const handleCreateNote = (newNote: { title: string; content: string; categoryId?: string }) => {
    createNoteMutation.mutate(newNote);
  };

  const handleCreateCategory = (name: string) => {
    createCategoryMutation.mutate(name);
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

  const filteredTasks = getFilteredTasks();
  const filteredNotes = getFilteredNotes();
  const isLoading = categoriesLoading || tasksLoading || notesLoading;

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedView}
          onSelectCategory={setSelectedView}
          onAddCategory={() => setCreateCategoryOpen(true)}
        />
        
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-4 p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-semibold" data-testid="text-view-title">{getViewTitle()}</h1>
            {(selectedView === "daily" || selectedView === "weekly") && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                <span>
                  {selectedView === "daily" ? "Refreshes daily at 7:00 AM" : "Refreshes every Sunday"}
                </span>
              </div>
            )}
          </header>
          
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-full flex flex-col lg:flex-row">
                <div className="flex-1 min-w-0 lg:w-3/5">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{filteredTasks.length} tasks</span>
                      </div>
                      
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
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="lg:w-2/5 border-t lg:border-t-0 lg:border-l border-border">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{filteredNotes.length} notes</span>
                      </div>
                      
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
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
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
      </div>
    </SidebarProvider>
  );
}
