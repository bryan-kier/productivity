import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Note } from "./NoteCard";
import { Category } from "./CategorySidebar";

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  categories: Category[];
  onUpdateNote: (id: string, updates: { title?: string; content?: string; categoryId?: string | null }) => void;
}

export default function EditNoteDialog({ 
  open, 
  onOpenChange, 
  note,
  categories, 
  onUpdateNote 
}: EditNoteDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategoryId(note.categoryId || "");
    }
  }, [note, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !note) return;
    
    onUpdateNote(note.id, {
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId || null,
    });
    
    onOpenChange(false);
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Note Title</Label>
              <Input
                id="note-title"
                placeholder="Give your note a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                data-testid="input-note-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                data-testid="textarea-note-content"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-category">Category (Optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-note-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} data-testid="button-submit-note">
              Update Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
