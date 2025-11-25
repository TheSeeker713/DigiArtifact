'use client'

import { useState } from 'react'
import { useAuth, Project } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'

export default function ProjectsPage() {
  const { projects, user, refreshData } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#cca43b' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'admin'

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = Cookies.get('workers_token')
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newProject),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      setShowCreateModal(false)
      setNewProject({ name: '', description: '', color: '#cca43b' })
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-sand mb-2">Projects</h1>
          <p className="text-text-slate font-mono text-sm">
            Track time across different projects and clients
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-rune flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-text-slate/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-text-slate font-mono mb-2">No projects yet</p>
          {isAdmin && (
            <p className="text-text-slate/70 text-sm">
              Create your first project to start organizing time entries
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="card card-hover">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                  project.active 
                    ? 'bg-status-active/20 text-status-active' 
                    : 'bg-text-slate/20 text-text-slate'
                }`}>
                  {project.active ? 'Active' : 'Archived'}
                </span>
              </div>
              
              <h3 className="font-heading text-xl text-sand mb-2">{project.name}</h3>
              
              {project.description && (
                <p className="text-text-slate text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              
              <div className="pt-4 border-t border-baked-clay/30">
                <div className="flex items-center justify-between text-xs font-mono text-text-slate">
                  <span>Project #{project.id}</span>
                  {isAdmin && (
                    <button className="text-relic-gold hover:text-hologram-cyan transition-colors">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-6">Create New Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Client Website"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="Brief project description..."
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
                      onClick={() => setNewProject({ ...newProject, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newProject.color === color.value 
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
                  disabled={isLoading || !newProject.name}
                  className="btn-rune flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
