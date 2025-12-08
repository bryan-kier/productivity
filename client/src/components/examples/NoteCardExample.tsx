import NoteCard, { Note } from "../NoteCard";

// todo: remove mock functionality
const mockNote: Note = {
  id: "1",
  title: "Meeting Notes",
  content: "Discussed project timeline and deliverables. Key decisions made about architecture and tech stack choices.",
  categoryId: "work",
  categoryName: "Work",
};

export default function NoteCardExample() {
  return (
    <div className="max-w-sm">
      <NoteCard
        note={mockNote}
        onClick={(note) => console.log("Clicked note:", note.id)}
      />
    </div>
  );
}
