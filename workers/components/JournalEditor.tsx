'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { JournalEntry, useJournal } from '@/contexts/JournalContext'
import { useJournalAutoSave } from '@/hooks/useJournalAutoSave'
import { useEditorCommands } from '@/hooks/useEditorCommands'

interface JournalEditorProps {
  entry: JournalEntry | null
  onClose: () => void
}

export default function JournalEditor({ entry, onClose }: JournalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.richContent || entry?.content || '')
  const [tags, setTags] = useState<string[]>(entry?.tags || [])
  const [tagInput, setTagInput] = useState('')

  // Use auto-save hook
  const {
    isSaving,
    hasChanges,
    lastSaved,
    save,
    activeEntry,
    setActiveEntry,
  } = useJournalAutoSave({
    entry,
    title,
    richContent: content,
    tags,
  })

  // Use editor commands hook
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }, [])

  const { execCommand, formatButtons } = useEditorCommands({
    editorRef,
    onContentChange: handleContentChange,
  })

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content
    }
  }, [])

  // Update content ref when content changes
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      // Only update if content actually changed (avoid infinite loop)
      const currentHtml = editorRef.current.innerHTML
      if (content !== currentHtml) {
        editorRef.current.innerHTML = content
      }
    }
  }, [content])

  const handleClose = async () => {
    if (hasChanges) {
      await save()
    }
    onClose()
  }

  return (
    <div className="p-6 flex flex-col h-full min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate/50 [.light-mode_&]:hover:bg-slate-200 rounded-lg text-slate-400 [.light-mode_&]:text-slate-500 hover:text-sand [.light-mode_&]:hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-sand [.light-mode_&]:text-slate-900">
            {entry ? 'Edit Entry' : 'New Entry'}
          </h2>
          {hasChanges && (
            <span className="text-xs text-amber-400 [.light-mode_&]:text-amber-600 bg-amber-500/20 [.light-mode_&]:bg-amber-100 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isSaving ? (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Saving...
            </span>
          ) : hasChanges ? (
            <span className="text-xs text-amber-400 [.light-mode_&]:text-amber-600 bg-amber-500/20 [.light-mode_&]:bg-amber-100 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="text-xs text-slate-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title (optional)"
        className="w-full px-4 py-3 mb-4 bg-obsidian/50 [.light-mode_&]:bg-white border border-slate/50 [.light-mode_&]:border-slate-200 rounded-lg text-sand [.light-mode_&]:text-slate-900 text-lg placeholder-slate-500 [.light-mode_&]:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
      />

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate/30 [.light-mode_&]:bg-slate-50 border border-slate/50 [.light-mode_&]:border-slate-200 rounded-t-lg">
        {formatButtons.map((btn, i) => (
          <button
            key={i}
            onClick={() => execCommand(btn.action)}
            className="p-2 hover:bg-slate/50 [.light-mode_&]:hover:bg-slate-200 rounded text-slate-400 [.light-mode_&]:text-slate-500 hover:text-sand [.light-mode_&]:hover:text-slate-900 transition-colors"
            title={btn.tooltip}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        className="flex-1 min-h-[300px] p-4 bg-obsidian/30 [.light-mode_&]:bg-white border-x border-b border-slate/50 [.light-mode_&]:border-slate-200 rounded-b-lg text-sand [.light-mode_&]:text-slate-900 focus:outline-none overflow-y-auto prose prose-invert [.light-mode_&]:prose-slate max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-amber-400 [.light-mode_&]:[&_h2]:text-amber-600 [&_h2]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [.light-mode_&]:[&_blockquote]:text-slate-600 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:text-slate-300 [.light-mode_&]:[&_li]:text-slate-600 [&_a]:text-amber-400 [.light-mode_&]:[&_a]:text-amber-600 [&_a]:underline [&_pre]:bg-slate/50 [.light-mode_&]:[&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm"
        data-placeholder="Start writing..."
      />

      {/* Tags */}
      <div className="mt-4">
        <label className="block text-sm text-slate-400 [.light-mode_&]:text-slate-500 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate/50 [.light-mode_&]:bg-slate-100 text-slate-300 [.light-mode_&]:text-slate-600 rounded-full text-sm"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-400 [.light-mode_&]:hover:text-red-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag..."
              className="w-24 px-2 py-1 bg-transparent border-b border-slate/50 [.light-mode_&]:border-slate-300 text-slate-300 [.light-mode_&]:text-slate-600 text-sm placeholder-slate-500 [.light-mode_&]:placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="p-1 text-slate-500 [.light-mode_&]:text-slate-400 hover:text-amber-400 [.light-mode_&]:hover:text-amber-600 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Editor placeholder styles */}
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgb(100 116 139);
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
