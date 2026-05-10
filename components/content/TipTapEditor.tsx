"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link2,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[200px] px-4 py-3 text-white text-sm focus:outline-none prose prose-invert max-w-none",
      },
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        active
          ? "bg-[#D4AF37]/10 text-[#D4AF37]"
          : "text-[#9ba5b3] hover:text-white hover:bg-[#212d40]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-[#0f1621]">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#3a4757] flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Titre"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Liste"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-4 bg-[#3a4757] mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("URL du lien:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
          title="Lien"
        >
          <Link2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("URL de l'image:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          active={false}
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-4 bg-[#3a4757] mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Annuler"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Rétablir"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <Button className="hidden" />
    </div>
  );
}
