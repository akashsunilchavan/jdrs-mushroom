import { offlineStorage } from "./offline-storage"

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: string
  pendingItems: number
  syncErrors: SyncError[]
  syncProgress: number
}

export interface SyncError {
  id: string
  table: string
  action: string
  error: string
  timestamp: string
  retryCount: number
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: SyncError[]
}

class SyncManager {
  private syncStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    syncErrors: [],
    syncProgress: 0,
  }

  private listeners: ((status: SyncStatus) => void)[] = []
  private syncInterval: NodeJS.Timeout | null = null
  private retryTimeout: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.syncStatus.isOnline = navigator.onLine

      window.addEventListener("online", () => {
        this.syncStatus.isOnline = true
        this.notifyListeners()
        this.startAutoSync()
      })

      window.addEventListener("offline", () => {
        this.syncStatus.isOnline = false
        this.notifyListeners()
      })
    }
  }

  // ================================
  // Network Monitoring
  // ================================
  private initializeNetworkMonitoring() {
    this.syncStatus.isOnline = navigator.onLine

    window.addEventListener("online", () => {
      this.syncStatus.isOnline = true
      this.notifyListeners()
      this.startAutoSync()
    })

    window.addEventListener("offline", () => {
      this.syncStatus.isOnline = false
      this.stopAutoSync()
      this.notifyListeners()
    })

    if (this.syncStatus.isOnline) {
      this.startAutoSync()
    }
  }

  // ================================
  // Error Handling
  // ================================
  private loadSyncErrors() {
    try {
      const stored = localStorage.getItem("jdrs_sync_errors")
      if (stored) {
        this.syncStatus.syncErrors = JSON.parse(stored)
      }
    } catch (error) {
      console.error("Failed to load sync errors:", error)
    }
  }

  private saveSyncErrors() {
    try {
      localStorage.setItem("jdrs_sync_errors", JSON.stringify(this.syncStatus.syncErrors))
    } catch (error) {
      console.error("Failed to save sync errors:", error)
    }
  }

  private addSyncError(error: Omit<SyncError, "id" | "timestamp" | "retryCount">) {
    const syncError: SyncError = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    }

    this.syncStatus.syncErrors.push(syncError)
    this.saveSyncErrors()
    this.notifyListeners()
  }

  private removeSyncError(errorId: string) {
    this.syncStatus.syncErrors = this.syncStatus.syncErrors.filter((error) => error.id !== errorId)
    this.saveSyncErrors()
    this.notifyListeners()
  }

  // ================================
  // Auto Sync
  // ================================
  private startAutoSync() {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncWithServer()
      }
    }, 30000)

    setTimeout(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncWithServer()
      }
    }, 2000)
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // ================================
  // Listeners
  // ================================
  addStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener)
    listener(this.syncStatus)
  }

  removeStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.syncStatus }))
  }

  // ================================
  // Sync Status
  // ================================
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  async updatePendingCount() {
    try {
      const queue = await offlineStorage.getSyncQueue()
      this.syncStatus.pendingItems = queue.length
      this.notifyListeners()
    } catch (error) {
      console.error("Failed to update pending count:", error)
    }
  }

  // ================================
  // Main Sync
  // ================================
  async syncWithServer(): Promise<SyncResult> {
    if (this.syncStatus.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: [] }
    }

    if (!this.syncStatus.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: [] }
    }

    this.syncStatus.isSyncing = true
    this.syncStatus.syncProgress = 0
    this.notifyListeners()

    try {
      const queue = await offlineStorage.getSyncQueue()
      const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

      if (queue.length === 0) {
        this.syncStatus.isSyncing = false
        this.syncStatus.lastSyncTime = new Date().toISOString()
        this.notifyListeners()
        return result
      }

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i]
        this.syncStatus.syncProgress = Math.round(((i + 1) / queue.length) * 100)
        this.notifyListeners()

        try {
          const success = await this.syncItem(item)
          if (success) {
            result.synced++
            await this.removeFromSyncQueue(item.id)
          } else {
            result.failed++
            this.addSyncError({
              table: item.table,
              action: item.action,
              error: "Sync failed - server error",
            })
          }
        } catch (error) {
          result.failed++
          this.addSyncError({
            table: item.table,
            action: item.action,
            error: (error as Error).message,
          })
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      this.syncStatus.lastSyncTime = new Date().toISOString()
      localStorage.setItem("jdrs_last_sync", this.syncStatus.lastSyncTime)

      return result
    } catch (error) {
      console.error("Sync failed:", error)
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [
          {
            id: crypto.randomUUID(),
            table: "system",
            action: "sync",
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      }
    } finally {
      this.syncStatus.isSyncing = false
      this.syncStatus.syncProgress = 0
      await this.updatePendingCount()
      this.notifyListeners()
    }
  }

  // ================================
  // Sync Item
  // ================================
  private async syncItem(item: any): Promise<boolean> {
    try {
      const endpoint = this.getEndpointForTable(item.table)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          action: item.action,
          data: item.data,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("jdrs_auth_token")
          throw new Error("Unauthorized: please log in again.")
        }

        let errorMsg = response.statusText
        try {
          const errorBody = await response.json()
          errorMsg = errorBody.message || JSON.stringify(errorBody)
        } catch {}
        throw new Error(`HTTP ${response.status}: ${errorMsg}`)
      }

      const result = await response.json()
      return result.success === true
    } catch (error) {
      console.error("Failed to sync item:", error)
      return false
    }
  }

  // ================================
  // Helpers
  // ================================
  private getEndpointForTable(table: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"
    switch (table) {
      case "users":
        return `${baseUrl}/users/sync`
      case "rooms":
        return `${baseUrl}/rooms/sync`
      case "labour":
        return `${baseUrl}/labour/sync`
      case "harvesting":
        return `${baseUrl}/harvesting/sync`
      default:
        return `${baseUrl}/sync`
    }
  }

  private getAuthToken(): string {
    const token = localStorage.getItem("jdrs_auth_token")
    if (!token) {
      throw new Error("No auth token found. Please login again.")
    }
    return token
  }

  private async removeFromSyncQueue(itemId: string) {
    try {
      await offlineStorage.init()
      const db = (offlineStorage as any).db
      if (db) {
        await db.delete("syncQueue", itemId)
      }
    } catch (error) {
      console.error("Failed to remove item from sync queue:", error)
    }
  }

  // ================================
  // Retry & Clear
  // ================================
  async retryFailedSync(): Promise<SyncResult> {
    this.syncStatus.syncErrors.forEach((error) => {
      error.retryCount++
    })
    this.saveSyncErrors()
    return await this.syncWithServer()
  }

  clearSyncErrors() {
    this.syncStatus.syncErrors = []
    this.saveSyncErrors()
    this.notifyListeners()
  }

  // ================================
  // Force Sync
  // ================================
  async forceSync(): Promise<SyncResult> {
    const wasOnline = this.syncStatus.isOnline
    this.syncStatus.isOnline = true
    try {
      return await this.syncWithServer()
    } finally {
      this.syncStatus.isOnline = wasOnline
    }
  }

  // ================================
  // Download / Upload
  // ================================
  async downloadFromServer(): Promise<{ success: boolean; message: string }> {
    if (!this.syncStatus.isOnline) {
      return { success: false, message: "No internet connection" }
    }

    try {
      const response = await fetch("/api/data/export", {
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const serverData = await response.json()
      await offlineStorage.init()
      const db = (offlineStorage as any).db

      if (db) {
        await Promise.all([db.clear("users"), db.clear("rooms"), db.clear("labour"), db.clear("harvesting")])

        for (const user of serverData.users || []) {
          await db.add("users", { ...user, syncStatus: "synced" })
        }
        for (const room of serverData.rooms || []) {
          await db.add("rooms", { ...room, syncStatus: "synced" })
        }
        for (const labour of serverData.labour || []) {
          await db.add("labour", { ...labour, syncStatus: "synced" })
        }
        for (const harvest of serverData.harvesting || []) {
          await db.add("harvesting", { ...harvest, syncStatus: "synced" })
        }
      }

      return { success: true, message: "Data downloaded successfully from server" }
    } catch (error) {
      console.error("Failed to download from server:", error)
      return { success: false, message: "Failed to download data: " + (error as Error).message }
    }
  }

  async uploadToServer(): Promise<{ success: boolean; message: string }> {
    if (!this.syncStatus.isOnline) {
      return { success: false, message: "No internet connection" }
    }

    try {
      const [users, rooms, labour, harvesting] = await Promise.all([
        offlineStorage.getUsers(),
        offlineStorage.getRooms(),
        this.getAllLabour(),
        offlineStorage.getHarvestingData(),
      ])

      const response = await fetch("/api/data/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          users: users.map(({ password, ...user }) => user),
          rooms,
          labour,
          harvesting,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: true, message: `Uploaded ${result.totalRecords} records to server` }
    } catch (error) {
      console.error("Failed to upload to server:", error)
      return { success: false, message: "Failed to upload data: " + (error as Error).message }
    }
  }

  private async getAllLabour() {
    try {
      const users = await offlineStorage.getUsers()
      const supervisors = users.filter((user) => user.role === "supervisor")

      const allLabour = []
      for (const supervisor of supervisors) {
        const supervisorLabour = await offlineStorage.getLabourBySupervisor(supervisor.id)
        allLabour.push(...supervisorLabour)
      }
      return allLabour
    } catch (error) {
      console.error("Failed to get all labour:", error)
      return []
    }
  }

  // ================================
  // Cleanup
  // ================================
  cleanup() {
    this.stopAutoSync()
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
    this.listeners = []
  }
}

export const syncManager = new SyncManager()
