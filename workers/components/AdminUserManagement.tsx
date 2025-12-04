'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'

interface UserData {
  id: string
  name: string
  email: string
  role: 'admin' | 'worker'
  pin: string
  hourly_rate: number
  created_at: string
  target_weekly_hours?: number
  preferred_days?: number[]
}

const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminUserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState<Partial<UserData>>({})
  
  // Only admins can access this
  const isAdmin = currentUser?.role === 'admin'
  
  // Load all users
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return
      
      try {
        const token = Cookies.get('workers_token')
        if (!token) return
        
        const response = await fetch(`${API_BASE}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to load users')
        }
        
        const data = await response.json()
        setUsers(data.users || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUsers()
  }, [isAdmin])
  
  // Start editing a user
  const startEditing = (user: UserData) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      hourly_rate: user.hourly_rate,
      target_weekly_hours: user.target_weekly_hours || 40,
      preferred_days: user.preferred_days || [1, 2, 3, 4, 5],
    })
    setIsEditing(true)
    setSaveSuccess(false)
  }
  
  // Cancel editing
  const cancelEditing = () => {
    setSelectedUser(null)
    setEditForm({})
    setIsEditing(false)
    setError(null)
  }
  
  // Save user changes
  const saveChanges = async () => {
    if (!selectedUser) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const token = Cookies.get('workers_token')
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      const response = await fetch(`${API_BASE}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, ...editForm } as UserData : u
      ))
      
      setSaveSuccess(true)
      setTimeout(() => {
        cancelEditing()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Reset user's PIN
  const resetPin = async (userId: string) => {
    if (!confirm('Reset this user\'s PIN to "0000"? They will need to change it after logging in.')) {
      return
    }
    
    try {
      const token = Cookies.get('workers_token')
      if (!token) return
      
      const response = await fetch(`${API_BASE}/admin/users/${userId}/reset-pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset PIN')
      }
      
      alert('PIN has been reset to "0000"')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset PIN')
    }
  }
  
  // Toggle preferred day
  const togglePreferredDay = (dayIndex: number) => {
    const currentDays = editForm.preferred_days || []
    if (currentDays.includes(dayIndex)) {
      setEditForm(prev => ({
        ...prev,
        preferred_days: currentDays.filter(d => d !== dayIndex),
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        preferred_days: [...currentDays, dayIndex].sort(),
      }))
    }
  }
  
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-status-offline">Access denied. Admin only.</p>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-relic-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl text-relic-gold mb-2">User Management</h2>
        <p className="text-text-slate text-sm">
          View and edit all users, including their schedules and pay rates.
        </p>
      </div>
      
      {/* Error message */}
      {error && !isEditing && (
        <div className="p-4 bg-status-offline/20 border border-status-offline/50 rounded-lg">
          <p className="text-status-offline text-sm">{error}</p>
        </div>
      )}
      
      {/* Users list */}
      {!isEditing && (
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-text-slate text-center py-8">No users found</p>
          ) : (
            users.map(user => (
              <div 
                key={user.id}
                className="card hover:border-relic-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-relic-gold to-baked-clay flex items-center justify-center">
                      <span className="font-heading text-obsidian font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* User info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-sand">{user.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                          user.role === 'admin' 
                            ? 'bg-relic-gold/20 text-relic-gold' 
                            : 'bg-slate-600/20 text-slate-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-text-slate text-sm">{user.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-slate/70">
                        <span>${user.hourly_rate?.toFixed(2) || '0.00'}/hr</span>
                        <span>{user.target_weekly_hours || 40}h/week target</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resetPin(user.id)}
                      className="px-3 py-1.5 text-xs bg-obsidian/50 hover:bg-status-offline/20 text-text-slate hover:text-status-offline rounded transition-colors"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => startEditing(user)}
                      className="px-3 py-1.5 text-xs bg-relic-gold/20 hover:bg-relic-gold/30 text-relic-gold rounded transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditing && selectedUser && (
        <div className="card border-relic-gold/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg text-relic-gold">
              Editing: {selectedUser.name}
            </h3>
            <button
              onClick={cancelEditing}
              className="text-text-slate hover:text-sand"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-mono text-sand mb-2">Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-mono text-sand mb-2">Email</label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            
            {/* Role */}
            <div>
              <label className="block text-sm font-mono text-sand mb-2">Role</label>
              <select
                value={editForm.role || 'worker'}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'worker' }))}
                className="input-field w-full"
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-mono text-sand mb-2">Hourly Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.hourly_rate || 0}
                onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                className="input-field w-full"
              />
            </div>
            
            {/* Weekly Hours Target */}
            <div>
              <label className="block text-sm font-mono text-sand mb-2">Weekly Hours Target</label>
              <input
                type="number"
                min="1"
                max="60"
                value={editForm.target_weekly_hours || 40}
                onChange={(e) => setEditForm(prev => ({ ...prev, target_weekly_hours: parseInt(e.target.value) || 40 }))}
                className="input-field w-full"
              />
            </div>
            
            {/* Preferred Days */}
            <div>
              <label className="block text-sm font-mono text-sand mb-2">Preferred Working Days</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => togglePreferredDay(index)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      editForm.preferred_days?.includes(index)
                        ? 'bg-relic-gold/30 text-relic-gold'
                        : 'bg-obsidian/50 text-text-slate hover:bg-obsidian/70'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-status-offline/20 border border-status-offline/50 rounded-lg">
              <p className="text-status-offline text-sm">{error}</p>
            </div>
          )}
          
          {/* Success */}
          {saveSuccess && (
            <div className="mt-4 p-3 bg-status-active/20 border border-status-active/50 rounded-lg">
              <p className="text-status-active text-sm">User updated successfully!</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-baked-clay/20">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 text-sm text-text-slate hover:text-sand transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveChanges}
              disabled={isSaving}
              className="btn-rune flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
