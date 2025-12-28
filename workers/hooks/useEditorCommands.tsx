'use client'

import { useRef, useCallback } from 'react'

type FormatAction = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'heading' | 'quote' | 'ul' | 'ol' | 'link' | 'code'

interface UseEditorCommandsOptions {
  editorRef: React.RefObject<HTMLDivElement>
  onContentChange: () => void
}

interface UseEditorCommandsReturn {
  execCommand: (command: FormatAction, value?: string) => void
  formatButtons: Array<{ action: FormatAction; icon: JSX.Element; tooltip: string }>
}

/**
 * Hook for managing rich-text editor commands
 * Handles all formatting actions and keyboard shortcuts
 */
export function useEditorCommands({
  editorRef,
  onContentChange,
}: UseEditorCommandsOptions): UseEditorCommandsReturn {
  
  const execCommand = useCallback((command: FormatAction, value?: string) => {
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
    onContentChange()
    editorRef.current?.focus()
  }, [editorRef, onContentChange])

  const formatButtons: Array<{ action: FormatAction; icon: JSX.Element; tooltip: string }> = [
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

  return {
    execCommand,
    formatButtons,
  }
}

