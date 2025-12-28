'use client'

/**
 * Robust sync queue system for background API synchronization
 * Ensures data is written to LocalStorage immediately and synced in background
 */

interface SyncTask {
  id: string
  url: string
  options: RequestInit
  retries: number
  timestamp: number
}

class SyncQueue {
  private queue: SyncTask[] = []
  private processing = false
  private maxRetries = 3
  private retryDelay = 2000 // 2 seconds

  /**
   * Add a sync task to the queue
   */
  enqueue(url: string, options: RequestInit): void {
    const task: SyncTask = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      options,
      retries: 0,
      timestamp: Date.now(),
    }
    
    this.queue.push(task)
    this.process()
  }

  /**
   * Process the queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      
      try {
        const response = await fetch(task.url, task.options)
        
        if (!response.ok && task.retries < this.maxRetries) {
          // Retry with exponential backoff
          task.retries++
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * task.retries))
          this.queue.push(task)
        } else if (!response.ok) {
          console.error(`Failed to sync after ${this.maxRetries} retries:`, task.url)
        }
      } catch (error) {
        if (task.retries < this.maxRetries) {
          task.retries++
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * task.retries))
          this.queue.push(task)
        } else {
          console.error('Sync task failed:', error)
        }
      }
    }
    
    this.processing = false
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length
  }
}

// Singleton instance
export const syncQueue = new SyncQueue()

/**
 * Hook for using the sync queue
 */
export function useSyncQueue() {
  const sync = (url: string, options: RequestInit) => {
    syncQueue.enqueue(url, options)
  }

  return { sync }
}

