import FloatingActionButton from "../FloatingActionButton";

export default function FloatingActionButtonExample() {
  return (
    <div className="relative h-32 w-full">
      <FloatingActionButton
        onCreateTask={() => console.log("Create task")}
        onCreateNote={() => console.log("Create note")}
      />
    </div>
  );
}
