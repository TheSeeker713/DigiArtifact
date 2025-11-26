'use client'

import { useState, useEffect } from 'react'
import { useAuth, User } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

interface AdminUser extends User {
  created_at: string
  last_clock_in?: string
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [newUser, setNewUser] = useState({ name: '', email: '', pin: '', role: 'worker' as 'admin' | 'worker' })
  const [editUser, setEditUser] = useState({ name: '', email: '', role: 'worker' as 'admin' | 'worker' })
  const [resetPin, setResetPin] = useState('')
  const [showResetPin, setShowResetPin] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    } else {
      fetchUsers()
    }
  }, [user, router])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const token = Cookies.get('workers_token')
      const response = await fetch('https://digiartifact-workers-api.digitalartifact11.workers.dev/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      const token = Cookies.get('workers_token')
      const response = await fetch('https://digiartifact-workers-api.digitalartifact11.workers.dev/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess('User created successfully!')
      setShowCreateModal(false)
      setNewUser({ name: '', email: '', pin: '', role: 'worker' })
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setNewUser({ ...newUser, pin })
  }

  const generateResetPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setResetPin(pin)
  }

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u)
    setEditUser({ name: u.name, email: u.email, role: u.role })
    setResetPin('')
    setShowResetPin(false)
    setError('')
    setShowEditModal(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setError('')

    try {
      const token = Cookies.get('workers_token')
      
      // Update user info
      const response = await fetch(`${API_BASE}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      // Reset PIN if provided
      if (resetPin && resetPin.length >= 4) {
        const pinResponse = await fetch(`${API_BASE}/admin/users/${editingUser.id}/reset-pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ newPin: resetPin }),
        })

        if (!pinResponse.ok) {
          const data = await pinResponse.json()
          throw new Error(data.error || 'Failed to reset PIN')
        }
      }

      setSuccess('User updated successfully!')
      setShowEditModal(false)
      setEditingUser(null)
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-sand mb-2">Manage Users</h1>
          <p className="text-text-slate font-mono text-sm">
            Add and manage team members
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-rune flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add User
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-status-active/20 border border-status-active/50 rounded-md">
          <p className="text-status-active font-mono text-sm">{success}</p>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-relic-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-baked-clay/30">
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">User</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Role</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Status</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Joined</th>
                <th className="text-right py-4 px-4 font-mono text-sm text-text-slate">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-baked-clay/20 hover:bg-obsidian/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-hologram-cyan/20 rounded-full flex items-center justify-center">
                        <span className="text-hologram-cyan font-mono font-bold">
                          {u.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sand font-medium">{u.name}</p>
                        <p className="text-text-slate text-xs font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      u.role === 'admin' 
                        ? 'bg-relic-gold/20 text-relic-gold' 
                        : 'bg-text-slate/20 text-text-slate'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="status-dot status-dot-offline" />
                      <span className="text-text-slate text-sm font-mono">Offline</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-text-slate text-sm font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button 
                      onClick={() => openEditModal(u)}
                      className="text-relic-gold hover:text-hologram-cyan transition-colors text-sm font-mono"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-6">Add New User</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                  placeholder="john@digiartifact.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  PIN Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUser.pin}
                    onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                    className="input-field flex-1 font-mono tracking-wider"
                    placeholder="4-6 digit PIN"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={generatePin}
                    className="btn-hologram px-4"
                  >
                    Generate
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'worker' })}
                  className="input-field"
                >
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
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
                    setShowCreateModal(false)
                    setError('')
                  }}
                  className="btn-hologram flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newUser.name || !newUser.email || !newUser.pin}
                  className="btn-rune flex-1"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-6">Edit User</h3>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="input-field"
                  placeholder="john@digiartifact.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-sand mb-2">
                  Role
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as 'admin' | 'worker' })}
                  className="input-field"
                >
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {/* PIN Reset Section */}
              <div className="pt-4 border-t border-baked-clay/30">
                <button
                  type="button"
                  onClick={() => setShowResetPin(!showResetPin)}
                  className="text-hologram-cyan text-sm font-mono hover:text-hologram-cyan/80"
                >
                  {showResetPin ? '− Hide PIN Reset' : '+ Reset User PIN'}
                </button>
                
                {showResetPin && (
                  <div className="mt-4">
                    <label className="block text-sm font-mono text-sand mb-2">
                      New PIN (4-6 digits)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resetPin}
                        onChange={(e) => setResetPin(e.target.value)}
                        className="input-field flex-1 font-mono tracking-wider"
                        placeholder="Leave empty to keep current"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={generateResetPin}
                        className="btn-hologram px-4"
                      >
                        Generate
                      </button>
                    </div>
                    {resetPin && (
                      <p className="text-xs text-status-active mt-2 font-mono">
                        New PIN will be: {resetPin}
                      </p>
                    )}
                  </div>
                )}
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
                    setEditingUser(null)
                    setError('')
                  }}
                  className="btn-hologram flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editUser.name || !editUser.email}
                  className="btn-rune flex-1"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
