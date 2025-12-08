import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import CategorySidebar, { Category } from "@/components/CategorySidebar";
import TaskCard, { Task } from "@/components/TaskCard";
import NoteCard, { Note } from "@/components/NoteCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import CreateNoteDialog from "@/components/CreateNoteDialog";
import CreateCategoryDialog from "@/components/CreateCategoryDialog";
import { Calendar, RefreshCw, FileText } from "lucide-react";

// todo: remove mock functionality - Initial mock data
const initialCategories: Category[] = [
  { id: "work", name: "Work", taskCount: 3 },
  { id: "personal", name: "Personal", taskCount: 2 },
  { id: "shopping", name: "Shopping", taskCount: 1 },
];

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete project proposal",
    completed: false,
    refreshType: "none",
    categoryId: "work",
    subtasks: [
      { id: "1-1", title: "Draft outline", completed: true },
      { id: "1-2", title: "Add budget estimates", completed: false },
    ],
  },
  {
    id: "2",
    title: "Morning standup",
    completed: false,
    refreshType: "daily",
    categoryId: "work",
    subtasks: [],
  },
  {
    id: "3",
    title: "Weekly review",
    completed: false,
    refreshType: "weekly",
    categoryId: "personal",
    subtasks: [],
  },
  {
    id: "4",
    title: "Grocery shopping",
    completed: false,
    refreshType: "none",
    categoryId: "shopping",
    subtasks: [
      { id: "4-1", title: "Fruits and vegetables", completed: false },
      { id: "4-2", title: "Dairy products", completed: false },
    ],
  },
  {
    id: "5",
    title: "Exercise routine",
    completed: true,
    refreshType: "daily",
    categoryId: "personal",
    subtasks: [],
  },
];

const initialNotes: Note[] = [
  {
    id: "1",
    title: "Project Ideas",
    content: "List of potential features to add: dark mode improvements, export functionality, mobile app version...",
    categoryId: "work",
    categoryName: "Work",
  },
  {
    id: "2",
    title: "Meeting Notes",
    content: "Discussed timeline for Q1 deliverables. Key action items assigned to team members.",
    categoryId: "work",
    categoryName: "Work",
  },
  {
    id: "3",
    title: "Book Recommendations",
    content: "Need to read: Atomic Habits, Deep Work, The Psychology of Money",
    categoryId: "personal",
    categoryName: "Personal",
  },
];

export default function Home() {
  const [selectedView, setSelectedView] = useState<string | null>("inbox");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            subtasks: task.subtasks.map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
          }
        : task
    ));
  };

  const handleCreateTask = (newTask: { title: string; refreshType: "daily" | "weekly" | "none"; categoryId?: string }) => {
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      completed: false,
      subtasks: [],
    };
    setTasks([task, ...tasks]);
    
    if (newTask.categoryId) {
      setCategories(categories.map(cat => 
        cat.id === newTask.categoryId ? { ...cat, taskCount: cat.taskCount + 1 } : cat
      ));
    }
  };

  const handleCreateNote = (newNote: { title: string; content: string; categoryId?: string }) => {
    const category = categories.find(c => c.id === newNote.categoryId);
    const note: Note = {
      id: Date.now().toString(),
      ...newNote,
      categoryName: category?.name,
    };
    setNotes([note, ...notes]);
  };

  const handleCreateCategory = (name: string) => {
    const category: Category = {
      id: Date.now().toString(),
      name,
      taskCount: 0,
    };
    setCategories([...categories, category]);
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
