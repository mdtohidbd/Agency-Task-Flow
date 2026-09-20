import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { marked } from 'marked';

interface TipTapMarkdownEditorProps {
  initialContent?: string;
  initialValue?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TipTapMarkdownEditor: React.FC<TipTapMarkdownEditorProps> = ({
  initialContent,
  initialValue = '',
  onChange,
  placeholder = 'Write or paste Markdown documentation, specs, or meeting notes...',
  disabled = false
}) => {
  const effectiveInitial = initialContent !== undefined ? initialContent : initialValue;
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawText, setRawText] = useState(effectiveInitial);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: effectiveInitial ? marked.parse(effectiveInitial, { async: false }) as string : '',
    editable: !disabled && !isRawMode,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(isRawMode ? rawText : html);
    }
  });

  // Keep editor editable state in sync
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !isRawMode);
    }
  }, [editor, disabled, isRawMode]);

  // Handle switching between WYSIWYG and Raw Markdown
  const handleToggleMode = () => {
    if (!editor) return;
    if (!isRawMode) {
      // Switching to Raw: use editor text/html or initial raw
      setIsRawMode(true);
      onChange(rawText);
    } else {
      // Switching to WYSIWYG: parse raw markdown into HTML for TipTap
      const parsedHtml = marked.parse(rawText, { async: false }) as string;
      editor.commands.setContent(parsedHtml);
      setIsRawMode(false);
      onChange(rawText);
    }
  };

  // Handle Raw Text Change
  const handleRawChange = (val: string) => {
    setRawText(val);
    onChange(val);
  };

  // Handle File Upload (.md or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        onChange(content);
        if (editor) {
          const parsed = marked.parse(content, { async: false }) as string;
          editor.commands.setContent(parsed);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Copy to Clipboard
  const handleCopy = () => {
    const contentToCopy = isRawMode ? rawText : (editor?.getText() || rawText);
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-outline rounded-xl overflow-hidden bg-surface dark:bg-surface-container-low transition-colors flex flex-col focus-within:border-primary/60">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline/50 bg-surface-variant/40 flex-wrap gap-1.5 text-xs">
        {/* Left Toolbar Controls (Only active in WYSIWYG mode) */}
        {!isRawMode && editor ? (
          <div className="flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('bold') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Bold (Ctrl+B)"
            >
              <span className="material-symbols-outlined text-[16px]">format_bold</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('italic') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Italic (Ctrl+I)"
            >
              <span className="material-symbols-outlined text-[16px]">format_italic</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('strike') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Strikethrough"
            >
              <span className="material-symbols-outlined text-[16px]">strikethrough_s</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('code') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Inline Code"
            >
              <span className="material-symbols-outlined text-[16px]">code</span>
            </button>

            <span className="h-4 w-[1px] bg-outline/60 mx-1"></span>

            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-1.5 py-0.5 rounded font-bold hover:bg-surface-variant transition-colors ${
                editor.isActive('heading', { level: 1 }) ? 'bg-primary/15 text-primary' : 'text-secondary'
              }`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-1.5 py-0.5 rounded font-bold hover:bg-surface-variant transition-colors ${
                editor.isActive('heading', { level: 2 }) ? 'bg-primary/15 text-primary' : 'text-secondary'
              }`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-1.5 py-0.5 rounded font-bold hover:bg-surface-variant transition-colors ${
                editor.isActive('heading', { level: 3 }) ? 'bg-primary/15 text-primary' : 'text-secondary'
              }`}
              title="Heading 3"
            >
              H3
            </button>

            <span className="h-4 w-[1px] bg-outline/60 mx-1"></span>

            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('bulletList') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Bullet List"
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('orderedList') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Numbered List"
            >
              <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('blockquote') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Quote Block"
            >
              <span className="material-symbols-outlined text-[16px]">format_quote</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${
                editor.isActive('codeBlock') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary'
              }`}
              title="Code Block"
            >
              <span className="material-symbols-outlined text-[16px]">terminal</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-secondary font-medium">
            <span className="material-symbols-outlined text-[16px] text-primary">markdown</span>
            <span>Raw Markdown Mode (Paste or write MD)</span>
          </div>
        )}

        {/* Right Tools: File Upload, Mode Switch, Copy */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Hidden File Input for .md/.txt import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface hover:bg-surface-variant border border-outline text-secondary hover:text-primary transition-colors text-[11px] font-medium"
            title="Import .md or .txt file"
          >
            <span className="material-symbols-outlined text-[14px]">upload_file</span>
            <span className="hidden sm:inline">Import .md</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface hover:bg-surface-variant border border-outline text-secondary hover:text-primary transition-colors text-[11px] font-medium"
            title="Copy Content"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={handleToggleMode}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
              isRawMode
                ? 'bg-ink-blue-container text-primary border-primary'
                : 'bg-surface border-outline text-secondary hover:text-primary hover:bg-surface-variant'
            }`}
            title={isRawMode ? 'Switch to Visual WYSIWYG' : 'Switch to Raw Markdown'}
          >
            {isRawMode ? 'WYSIWYG View' : 'Raw Markdown'}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-3 min-h-[160px] max-h-[350px] overflow-y-auto">
        {isRawMode ? (
          <textarea
            value={rawText}
            disabled={disabled}
            onChange={(e) => handleRawChange(e.target.value)}
            placeholder="Paste or write Markdown (# Heading, - List, **Bold**, etc.)..."
            className="w-full h-full min-h-[160px] bg-transparent font-mono text-xs text-on-surface focus:outline-none resize-none leading-relaxed"
          />
        ) : (
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert prose-sm max-w-none focus:outline-none min-h-[140px] text-on-surface text-sm"
          />
        )}
      </div>

      {/* Editor Footer / Info */}
      <div className="px-3 py-1.5 border-t border-outline/30 bg-surface-container-lowest flex items-center justify-between text-[11px] text-secondary">
        <span>TipTap Rich Engine • Supports full Markdown</span>
        <span>
          {isRawMode
            ? `${rawText.length} characters`
            : `${editor?.getText().length || 0} characters`}
        </span>
      </div>
    </div>
  );
};
