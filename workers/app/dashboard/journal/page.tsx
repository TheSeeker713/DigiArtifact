'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useJournal, JournalEntry } from '@/contexts/JournalContext'
import JournalLibrary from '@/components/JournalLibrary'
import JournalEditor from '@/components/JournalEditor'

export default function JournalPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { entries, isLoading: journalLoading, deleteEntry, exportToPDF } = useJournal()
  const [activeTab, setActiveTab] = useState<'library' | 'editor'>('library')
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setActiveTab('editor')
  }

  const handleDelete = async (id: string) => {
    await deleteEntry(id)
    setDeleteConfirm(null)
  }

  const handleExport = (entry: JournalEntry) => {
    exportToPDF(entry)
  }

  const handleNewEntry = () => {
    setEditingEntry(null)
    setActiveTab('editor')
  }

  const handleEditorClose = () => {
    setEditingEntry(null)
    setActiveTab('library')
  }

  if (authLoading || journalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-amber-400 animate-pulse text-xl">Loading Journal...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Journal
            </h1>
            <p className="text-slate-400 mt-1">Your personal archive of notes and thoughts</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
            <button
              onClick={handleNewEntry}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Entry
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('library'); setEditingEntry(null); }}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'library'
                ? 'bg-slate-700 text-amber-400 shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Library
            </span>
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'editor'
                ? 'bg-slate-700 text-amber-400 shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editor
              {editingEntry && <span className="text-xs bg-amber-600 px-2 py-0.5 rounded-full">Editing</span>}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 min-h-[60vh]">
          {activeTab === 'library' ? (
            <JournalLibrary
              entries={entries}
              onEdit={handleEdit}
              onDelete={(id: string) => setDeleteConfirm(id)}
              onExport={handleExport}
            />
          ) : (
            <JournalEditor
              entry={editingEntry}
              onClose={handleEditorClose}
            />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Entry</h3>
                  <p className="text-slate-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6">
                Are you sure you want to permanently delete this journal entry? All content will be lost.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
