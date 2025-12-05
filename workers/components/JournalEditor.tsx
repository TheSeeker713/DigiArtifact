'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { JournalEntry, JournalEntrySource, useJournal } from '@/contexts/JournalContext'

interface JournalEditorProps {
  entry: JournalEntry | null
  onClose: () => void
}

type FormatAction = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'heading' | 'quote' | 'ul' | 'ol' | 'link' | 'code'

export default function JournalEditor({ entry, onClose }: JournalEditorProps) {
  const { archiveNote, updateEntry } = useJournal()
  const editorRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.richContent || entry?.content || '')
  const [tags, setTags] = useState<string[]>(entry?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Track changes
  useEffect(() => {
    const originalContent = entry?.richContent || entry?.content || ''
    const originalTitle = entry?.title || ''
    const originalTags = entry?.tags || []
    
    const contentChanged = content !== originalContent
    const titleChanged = title !== originalTitle
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalTags)
    
    setHasChanges(contentChanged || titleChanged || tagsChanged)
  }, [content, title, tags, entry])

  // Auto-save on leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
        handleSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content
    }
  }, [])

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }, [])

  const execCommand = (command: FormatAction, value?: string) => {
    switch (command) {
      case 'bold':
        document.execCommand('bold', false)
        break
      case 'italic':
        document.execCommand('italic', false)
        break
      case 'underline':
        document.execCommand('underline', false)
        break
      case 'strikethrough':
        document.execCommand('strikeThrough', false)
        break
      case 'heading':
        document.execCommand('formatBlock', false, '<h2>')
        break
      case 'quote':
        document.execCommand('formatBlock', false, '<blockquote>')
        break
      case 'ul':
        document.execCommand('insertUnorderedList', false)
        break
      case 'ol':
        document.execCommand('insertOrderedList', false)
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) {
          document.execCommand('createLink', false, url)
        }
        break
      case 'code':
        document.execCommand('formatBlock', false, '<pre>')
        break
    }
    handleContentChange()
    editorRef.current?.focus()
  }

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

  const handleSave = async () => {
    if (!editorRef.current) return
    
    const htmlContent = editorRef.current.innerHTML
    const plainContent = editorRef.current.textContent || ''
    
    if (!plainContent.trim() && !title.trim()) {
      return // Don't save empty entries
    }

    setIsSaving(true)
    
    try {
      if (entry) {
        // Update existing entry
        await updateEntry(entry.id, {
          title: title.trim() || undefined,
          content: plainContent,
          richContent: htmlContent,
          tags
        })
      } else {
        // Create new entry
        await archiveNote(
          plainContent,
          'journal_editor',
          undefined,
          title.trim() || undefined,
          tags,
          htmlContent
        )
      }
      setLastSaved(new Date())
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save journal entry:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = async () => {
    if (hasChanges) {
      await handleSave()
    }
    onClose()
  }

  const formatButtons: { action: FormatAction; icon: JSX.Element; tooltip: string }[] = [
    {
      action: 'bold',
      tooltip: 'Bold (Ctrl+B)',
      icon: <span className="font-bold">B</span>
    },
    {
      action: 'italic',
      tooltip: 'Italic (Ctrl+I)',
      icon: <span className="italic">I</span>
    },
    {
      action: 'underline',
      tooltip: 'Underline (Ctrl+U)',
      icon: <span className="underline">U</span>
    },
    {
      action: 'strikethrough',
      tooltip: 'Strikethrough',
      icon: <span className="line-through">S</span>
    },
    {
      action: 'heading',
      tooltip: 'Heading',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      )
    },
    {
      action: 'quote',
      tooltip: 'Quote',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      )
    },
    {
      action: 'ul',
      tooltip: 'Bullet List',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      action: 'ol',
      tooltip: 'Numbered List',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      )
    },
    {
      action: 'link',
      tooltip: 'Insert Link',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    {
      action: 'code',
      tooltip: 'Code Block',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    }
  ]

  return (
    <div className="p-6 flex flex-col h-full min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {entry ? 'Edit Entry' : 'New Entry'}
          </h2>
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-slate-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              hasChanges && !isSaving
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title (optional)"
        className="w-full px-4 py-3 mb-4 bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/30 rounded-lg text-slate-900 dark:text-white text-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
      />

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/30 rounded-t-lg">
        {formatButtons.map((btn, i) => (
          <button
            key={i}
            onClick={() => execCommand(btn.action)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600/50 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
        className="flex-1 min-h-[300px] p-4 bg-white dark:bg-slate-700/20 border-x border-b border-slate-200 dark:border-slate-600/30 rounded-b-lg text-slate-900 dark:text-white focus:outline-none overflow-y-auto prose prose-slate dark:prose-invert max-w-none
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-amber-600 dark:[&_h2]:text-amber-400 [&_h2]:mb-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-300
          [&_ul]:list-disc [&_ul]:ml-6
          [&_ol]:list-decimal [&_ol]:ml-6
          [&_li]:text-slate-600 dark:[&_li]:text-slate-300
          [&_a]:text-amber-600 dark:[&_a]:text-amber-400 [&_a]:underline
          [&_pre]:bg-slate-100 dark:[&_pre]:bg-slate-800 [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm"
        data-placeholder="Start writing..."
      />

      {/* Tags */}
      <div className="mt-4">
        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-full text-sm"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
              className="w-24 px-2 py-1 bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-50 transition-colors"
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
