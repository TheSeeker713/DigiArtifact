'use client'

import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { getApiUrl } from '@/utils/config'
import { Project } from '@/contexts/AuthContext'

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/projects'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      return data.projects || []
    },
  })
}

