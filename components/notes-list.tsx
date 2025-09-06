"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Link,
  Code,
  ImageIcon,
  Trash2,
  ExternalLink,
  AlertCircle,
  Clock,
  Star,
  Edit,
  Search,
  Bell,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getUserNotes,
  deleteNote,
  searchUserNotes,
  getUserNotesByCategory,
  type Note,
} from "@/lib/notes";
import { getCategoryIcon, getPriorityColor } from "@/lib/ai-service";
import { SearchBar } from "@/components/search-bar";
import { NoteEditDialog } from "@/components/note-edit-dialog";
import { CategoryFilter } from "@/components/category-filter";
import { NotesGrid } from "@/components/notes-grid";
import { ReminderDialog } from "@/components/reminder-dialog";
import { toast } from "sonner";
import { NoteDetailDialog } from "./note-detail-dialog";

interface NotesListProps {
  refreshTrigger?: number;
}

export function NotesList({ refreshTrigger }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [reminderNote, setReminderNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "stats">("list");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Add this function to handle viewing note details
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setDetailDialogOpen(true);
  };

  const { user } = useAuth();

  const loadNotes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let userNotes: Note[];

      if (selectedCategory) {
        userNotes = await getUserNotesByCategory(user.uid, selectedCategory);
      } else {
        userNotes = await getUserNotes(user.uid);
      }

      setNotes(userNotes);

      // Apply search if there's a search term
      if (searchTerm.trim()) {
        const searchResults = await searchUserNotes(user.uid, searchTerm);
        const categoryFilteredResults = selectedCategory
          ? searchResults.filter((note) => note.category === selectedCategory)
          : searchResults;
        setFilteredNotes(categoryFilteredResults);
      } else {
        setFilteredNotes(userNotes);
      }
    } catch (error) {
      console.error("[v0] Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [user, refreshTrigger, selectedCategory]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!user) return;

    try {
      if (term.trim()) {
        const searchResults = await searchUserNotes(user.uid, term);
        const categoryFilteredResults = selectedCategory
          ? searchResults.filter((note) => note.category === selectedCategory)
          : searchResults;
        setFilteredNotes(categoryFilteredResults);
      } else {
        setFilteredNotes(notes);
      }
    } catch (error) {
      console.error("[v0] Search error:", error);
      toast.error("Search failed");
    }
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setSearchTerm(""); // Clear search when changing category
  };

  const handleDelete = async (noteId: string) => {
    if (!noteId) return;

    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully");
      loadNotes(); // Refresh the list
    } catch (error) {
      console.error("[v0] Delete error:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
  };

  const handleNoteUpdated = () => {
    loadNotes(); // Refresh the list after editing
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSetReminder = (note: Note) => {
    setReminderNote(note);
  };

  const handleReminderSet = () => {
    loadNotes(); // Refresh the list after setting reminder
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "url":
        return <Link className="h-4 w-4" />;
      case "code":
        return <Code className="h-4 w-4" />;
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "url":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "code":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "image":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "mixed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      case "low":
        return <Star className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatContent = (content: string, type: string) => {
    if (type === "url") {
      return content;
    }

    if (content.length > 200) {
      return content.substring(0, 200) + "...";
    }

    return content;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CategoryFilter
          onCategoryChange={handleCategoryChange}
          onViewModeChange={setViewMode}
          selectedCategory={selectedCategory}
          viewMode={viewMode}
        />
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notes.length === 0 && !selectedCategory) {
    return (
      <div className="space-y-4">
        <CategoryFilter
          onCategoryChange={handleCategoryChange}
          onViewModeChange={setViewMode}
          selectedCategory={selectedCategory}
          viewMode={viewMode}
        />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Start by pasting some content from your clipboard above
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CategoryFilter
        onCategoryChange={handleCategoryChange}
        onViewModeChange={setViewMode}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
      />
      <div className="flex items-center justify-between">
        <h2 className="font-playfair text-2xl font-bold text-foreground">
          {selectedCategory ? `${selectedCategory} Notes` : "Your Notes"}
        </h2>
        <Badge variant="secondary">
          {filteredNotes.length} of {notes.length} notes
        </Badge>
      </div>
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search notes by title, content, category, or tags..."
      />
      {filteredNotes.length === 0 && (searchTerm || selectedCategory) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? `No notes found for "${searchTerm}"${
                    selectedCategory ? ` in ${selectedCategory}` : ""
                  }`
                : `No notes in ${selectedCategory} category`}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "stats" ? (
        <div className="text-center py-8 text-muted-foreground">
          Category statistics are shown in the filter panel above
        </div>
      ) : viewMode === "grid" ? (
        <NotesGrid
          notes={filteredNotes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenUrl={handleOpenUrl}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        className={`${getTypeColor(
                          note.type
                        )} flex items-center gap-1`}
                      >
                        {getTypeIcon(note.type)}
                        {note.type}
                      </Badge>

                      {note.category && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <span>{getCategoryIcon(note.category)}</span>
                          {note.category}
                        </Badge>
                      )}

                      {note.priority && (
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${getPriorityColor(
                            note.priority
                          )}`}
                        >
                          {getPriorityIcon(note.priority)}
                          {note.priority}
                        </Badge>
                      )}

                      {note.reminderEnabled && note.reminderDate && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-blue-600"
                        >
                          <Bell className="h-3 w-3" />
                          reminder
                        </Badge>
                      )}

                      {note.metadata?.domain && (
                        <Badge variant="outline" className="text-xs">
                          {note.metadata.domain}
                        </Badge>
                      )}
                      {note.metadata?.language && (
                        <Badge variant="outline" className="text-xs">
                          {note.metadata.language}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {note.title && (
                        <h3 className="font-medium text-foreground text-sm">
                          {note.title}
                        </h3>
                      )}

                      {note.summary && (
                        <p className="text-xs text-muted-foreground italic">
                          {note.summary}
                        </p>
                      )}

                      {note.type === "image" ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={note.originalContent || "/placeholder.svg"}
                            alt="Pasted image"
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <span className="text-sm text-muted-foreground">
                            Image from clipboard
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground break-words">
                          {formatContent(
                            note.cleanedContent || note.originalContent,
                            note.type
                          )}
                        </p>
                      )}
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {note.createdAt?.toDate?.()?.toLocaleDateString() ||
                        "Recently"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetReminder(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {note.type === "url" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenUrl(note.originalContent)}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => note.id && handleDelete(note.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewNote(note)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <NoteEditDialog
        note={editingNote}
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
        onNoteUpdated={handleNoteUpdated}
      />
      <ReminderDialog
        note={reminderNote}
        open={!!reminderNote}
        onOpenChange={(open) => !open && setReminderNote(null)}
        onReminderSet={handleReminderSet}
      />
      // Add the dialog at the end of your component
      <NoteDetailDialog
        note={selectedNote}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
