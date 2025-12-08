import TaskCard, { Task } from "../TaskCard";

// todo: remove mock functionality
const mockTask: Task = {
  id: "1",
  title: "Review project documentation",
  completed: false,
  refreshType: "daily",
  subtasks: [
    { id: "1-1", title: "Read API specs", completed: true },
    { id: "1-2", title: "Update changelog", completed: false },
  ],
};

export default function TaskCardExample() {
  return (
    <div className="max-w-md">
      <TaskCard
        task={mockTask}
        onToggle={(id) => console.log("Toggle task:", id)}
        onToggleSubtask={(taskId, subtaskId) => console.log("Toggle subtask:", taskId, subtaskId)}
        onAddSubtask={(taskId) => console.log("Add subtask to:", taskId)}
      />
    </div>
  );
}
