import { useState } from "react";
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

export default function Home() {
  const [selectedView, setSelectedView] = useState<string | null>("inbox");
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
  const [deleteTarget, setDeleteTarget] = useState<{ type: "task" | "note" | "category"; id: string; name: string } | null>(null);
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
      setDeleteTarget({ type: "task", id, name: subtask.title }); // Reusing delete dialog
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    
    // Check if it's a subtask (check if it exists in any task's subtasks)
    const isSubtask = tasks.some(t => t.subtasks.some(st => st.id === deleteTarget.id));
    if (isSubtask) {
      deleteSubtaskMutation.mutate(deleteTarget.id);
    } else {
      switch (deleteTarget.type) {
        case "task":
          deleteTaskMutation.mutate(deleteTarget.id);
          break;
        case "note":
          deleteNoteMutation.mutate(deleteTarget.id);
          break;
        case "category":
          deleteCategoryMutation.mutate(deleteTarget.id);
          break;
      }
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

  const filteredTasks = getFilteredTasks();
  const filteredNotes = getFilteredNotes();
  const isLoading = categoriesLoading || tasksLoading || notesLoading;

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
            {(selectedView === "daily" || selectedView === "weekly") && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                <RefreshCw className="w-4 h-4" />
                <span>
                  {selectedView === "daily" ? "Refreshes daily at 7:00 AM" : "Refreshes every Sunday"}
                </span>
              </div>
            )}
          </header>
          
          <div className="flex-1 overflow-y-auto">
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
