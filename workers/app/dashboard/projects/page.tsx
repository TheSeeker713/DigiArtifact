'use client'

import { useState, useEffect } from 'react'
import { useAuth, Project } from '@/contexts/AuthContext'
import { useProjects } from '@/hooks/useProjects'
import Cookies from 'js-cookie'

const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

export default function TasksPage() {
  const { user } = useAuth()
  const { data: activeTasks = [], refetch: refreshData } = useProjects()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<Project | null>(null)
  const [newTask, setNewTask] = useState({ name: '', description: '', color: '#cca43b' })
  const [editTask, setEditTask] = useState({ name: '', description: '', color: '#cca43b', active: true })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterView, setFilterView] = useState<'active' | 'all' | 'archived'>('active')
  const [allTasks, setAllTasks] = useState<Project[]>([])

  const isAdmin = user?.role === 'admin'

  // Fetch all tasks (including archived) when filter changes
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const token = Cookies.get('workers_token')
        const response = await fetch(`${API_BASE}/projects?includeInactive=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAllTasks(data.projects || [])
        }
      } catch (err) {
        console.error('Failed to fetch all tasks:', err)
      }
    }

    if (filterView !== 'active') {
      fetchAllTasks()
    }
  }, [filterView])

  // Filter tasks based on view
  const filteredTasks = (() => {
    if (filterView === 'active') {
      return activeTasks
    } else if (filterView === 'archived') {
      return allTasks.filter((p) => !p.active)
    } else {
      return allTasks
    }
  })()

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = Cookies.get('workers_token')
      const response = await fetch('https://digiartifact-workers-api.digitalartifact11.workers.dev/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create task')
      }

      setShowCreateModal(false)
      setNewTask({ name: '', description: '', color: '#cca43b' })
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    setIsLoading(true)
    setError('')

    try {
      const token = Cookies.get('workers_token')
      const response = await fetch(`${API_BASE}/projects/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editTask),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update task')
      }

      setShowEditModal(false)
      setEditingTask(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchiveTask = async (taskId: number) => {
    setIsLoading(true)
    setError('')

    try {
      const token = Cookies.get('workers_token')
      const response = await fetch(`${API_BASE}/projects/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ active: false }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to archive task')
      }

      setShowArchiveConfirm(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    setIsLoading(true)
    setError('')

    try {
      const token = Cookies.get('workers_token')
      const response = await fetch(`${API_BASE}/projects/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete task')
      }

      setShowDeleteConfirm(null)
      await refreshData()
      // Also refresh all tasks if not on active view
      if (filterView !== 'active') {
        const allResponse = await fetch(`${API_BASE}/projects?includeInactive=true`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (allResponse.ok) {
          const data = await allResponse.json()
          setAllTasks(data.projects || [])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (task: Project) => {
    setEditingTask(task)
    setEditTask({
      name: task.name,
      description: task.description || '',
      color: task.color,
      active: task.active,
    })
    setError('')
    setShowEditModal(true)
  }

  const colorOptions = [
    { name: 'Relic Gold', value: '#cca43b' },
    { name: 'Hologram Cyan', value: '#00f0ff' },
    { name: 'Baked Clay', value: '#9f5f3f' },
    { name: 'Emerald', value: '#046c4e' },
    { name: 'Sapphire', value: '#0f5298' },
    { name: 'Ruby', value: '#9b111e' },
    { name: 'Amethyst', value: '#7c3aed' },
    { name: 'Coral', value: '#f97316' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl text-sand mb-2">Tasks</h1>
          <p className="text-text-slate font-mono text-sm">
            Create and organize work tasks and assignments
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && filterView === 'archived' && (
            <button
              onClick={() => setFilterView('active')}
              className="btn-hologram"
            >
              View Active
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-rune flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="mb-6 flex gap-2">
        <label className="text-sm font-mono text-sand">Show:</label>
        <select
          value={filterView}
          onChange={(e) => setFilterView(e.target.value as 'active' | 'all' | 'archived')}
          className="input-field text-sm py-1 px-3 max-w-xs"
        >
          <option value="active">Active Only</option>
          <option value="all">All Tasks</option>
          <option value="archived">Archived Only</option>
        </select>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-text-slate/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3" />
          </svg>
          <p className="text-text-slate font-mono mb-2">No tasks yet</p>
          {isAdmin && (
            <p className="text-text-slate/70 text-sm">
              Create your first task to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card card-hover">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: task.color }}
                />
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                  task.active 
                    ? 'bg-status-active/20 text-status-active' 
                    : 'bg-text-slate/20 text-text-slate'
                }`}>
                  {task.active ? 'Active' : 'Archived'}
                </span>
              </div>
              
              <h3 className="font-heading text-xl text-sand mb-2">{task.name}</h3>
              
              {task.description && (
                <p className="text-text-slate text-sm mb-4 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="pt-4 border-t border-baked-clay/30">
                <div className="flex items-center justify-between text-xs font-mono text-text-slate mb-3">
                  <span>Task #{task.id}</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => openEditModal(task)}
                      className="text-relic-gold hover:text-hologram-cyan transition-colors text-xs px-2 py-1 rounded hover:bg-baked-clay/10"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    {task.active && (
                      <button
                        onClick={() => setShowArchiveConfirm(task.id)}
                        className="text-text-slate hover:text-relic-gold transition-colors text-xs px-2 py-1 rounded hover:bg-baked-clay/10"
                        disabled={isLoading}
                      >
                        Archive
                      </button>
                    )}
                    {!task.active && (
                      <button
                        onClick={() => handleArchiveTask(task.id)}
                        className="text-status-active hover:text-hologram-cyan transition-colors text-xs px-2 py-1 rounded hover:bg-baked-clay/10"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Restoring...' : 'Restore'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(task.id)}
                      className="text-status-offline hover:text-ruby transition-colors text-xs px-2 py-1 rounded hover:bg-baked-clay/10"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-6">Create New Task</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Design new dashboard"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="Brief task description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newTask.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-offset-slate ring-white scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-status-offline/20 border border-status-offline/50 rounded-md">
                  <p className="text-status-offline text-sm font-mono">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-hologram flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newTask.name}
                  className="btn-rune flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-6">Edit Task</h3>
            
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={editTask.name}
                  onChange={(e) => setEditTask({ ...editTask, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Design new dashboard"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Description
                </label>
                <textarea
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="Brief task description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditTask({ ...editTask, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        editTask.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-offset-slate ring-white scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTask.active}
                    onChange={(e) => setEditTask({ ...editTask, active: e.target.checked })}
                    className="w-5 h-5 rounded border-baked-clay bg-obsidian text-relic-gold focus:ring-relic-gold"
                  />
                  <span className="text-sm font-mono text-sand">Active Task</span>
                </label>
              </div>
              
              {error && (
                <div className="p-3 bg-status-offline/20 border border-status-offline/50 rounded-md">
                  <p className="text-status-offline text-sm font-mono">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingTask(null)
                    setError('')
                  }}
                  className="btn-hologram flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !editTask.name}
                  className="btn-rune flex-1"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Task Confirmation Modal */}
      {showArchiveConfirm !== null && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-4">Archive Task?</h3>
            
            <p className="text-text-slate font-mono mb-6">
              This task will be moved to archived and hidden from the active list. You can restore it later from the archived view.
            </p>
            
            {error && (
              <div className="p-3 bg-status-offline/20 border border-status-offline/50 rounded-md mb-4">
                <p className="text-status-offline text-sm font-mono">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(null)}
                disabled={isLoading}
                className="btn-hologram flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleArchiveTask(showArchiveConfirm)}
                disabled={isLoading}
                className="btn-rune flex-1"
              >
                {isLoading ? 'Archiving...' : 'Archive Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-ruby mb-4">Delete Task Permanently?</h3>
            
            <p className="text-text-slate font-mono mb-4">
              This action cannot be undone. The task will be permanently deleted from the system.
            </p>
            
            <p className="text-text-slate font-mono text-sm mb-6 p-3 bg-status-offline/10 border border-status-offline/20 rounded">
              <strong>Note:</strong> Any time entries previously assigned to this task will be preserved and converted to "Work Session" entries without a task link.
            </p>
            
            {error && (
              <div className="p-3 bg-status-offline/20 border border-status-offline/50 rounded-md mb-4">
                <p className="text-status-offline text-sm font-mono">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isLoading}
                className="btn-hologram flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(showDeleteConfirm)}
                disabled={isLoading}
                className="bg-ruby hover:bg-ruby/80 disabled:opacity-50 text-white font-mono px-4 py-2 rounded transition-colors flex-1"
              >
                {isLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
