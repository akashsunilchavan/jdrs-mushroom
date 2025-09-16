import { openDB, type DBSchema, type IDBPDatabase } from "idb"

interface JDRSSchema extends DBSchema {
  users: {
    key: string
    value: {
      id: string
      name: string
      email: string
      phone: string
      role: "admin" | "supervisor"
      password: string
      isActive: boolean
      createdAt: string
      syncStatus: "pending" | "synced"
    }
  }
  rooms: {
    key: string
    value: {
      id: string
      name: string
      number: string
      area: string
      description?: string
      createdAt: string
      syncStatus: "pending" | "synced"
    }
  }
  labour: {
    key: string
    value: {
      id: string
      firstName: string
      lastName: string
      contact: string
      address?: string
      document?: string
      supervisorId: string
      createdAt: string
      syncStatus: "pending" | "synced"
    }
  }
  harvesting: {
    key: string
    value: {
      id: string
      labourId: string
      roomId: string
      supervisorId: string
      emptyWeight: number
      filledWeight: number
      netWeight: number
      notes?: string
      harvestDate: string
      createdAt: string
      syncStatus: "pending" | "synced"
    }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      table: string
      action: "create" | "update" | "delete"
      data: any
      timestamp: string
    }
  }
}

class OfflineStorage {
  private db: IDBPDatabase<JDRSSchema> | null = null

  async init() {
    this.db = await openDB<JDRSSchema>("jdrs-db", 1, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "id" })
          userStore.createIndex("email", "email", { unique: true })
          userStore.createIndex("role", "role")
        }

        // Rooms store
        if (!db.objectStoreNames.contains("rooms")) {
          db.createObjectStore("rooms", { keyPath: "id" })
        }

        // Labour store
        if (!db.objectStoreNames.contains("labour")) {
          const labourStore = db.createObjectStore("labour", { keyPath: "id" })
          labourStore.createIndex("supervisorId", "supervisorId")
        }

        // Harvesting store
        if (!db.objectStoreNames.contains("harvesting")) {
          const harvestStore = db.createObjectStore("harvesting", { keyPath: "id" })
          harvestStore.createIndex("labourId", "labourId")
          harvestStore.createIndex("roomId", "roomId")
          harvestStore.createIndex("supervisorId", "supervisorId")
          harvestStore.createIndex("harvestDate", "harvestDate")
        }

        // Sync queue store
        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", { keyPath: "id" })
        }
      },
    })
  }

  // User operations
  async addUser(user: Omit<JDRSSchema["users"]["value"], "syncStatus">) {
    if (!this.db) await this.init()
    const userWithSync = { ...user, syncStatus: "pending" as const }
    await this.db!.add("users", userWithSync)
    await this.addToSyncQueue("users", "create", userWithSync)
    return userWithSync
  }

  async getUsers() {
    if (!this.db) await this.init()
    return await this.db!.getAll("users")
  }

  async getUserByEmail(email: string) {
    if (!this.db) await this.init()
    return await this.db!.getFromIndex("users", "email", email)
  }

  // Room operations
  async addRoom(room: Omit<JDRSSchema["rooms"]["value"], "syncStatus">) {
    if (!this.db) await this.init()
    const roomWithSync = { ...room, syncStatus: "pending" as const }
    await this.db!.add("rooms", roomWithSync)
    await this.addToSyncQueue("rooms", "create", roomWithSync)
    return roomWithSync
  }

  async getRooms() {
    if (!this.db) await this.init()
    return await this.db!.getAll("rooms")
  }

  // Labour operations
  async addLabour(labour: Omit<JDRSSchema["labour"]["value"], "syncStatus">) {
    if (!this.db) await this.init()
    const labourWithSync = { ...labour, syncStatus: "pending" as const }
    await this.db!.add("labour", labourWithSync)
    await this.addToSyncQueue("labour", "create", labourWithSync)
    return labourWithSync
  }

  async getLabourBySupervisor(supervisorId: string) {
    if (!this.db) await this.init()
    return await this.db!.getAllFromIndex("labour", "supervisorId", supervisorId)
  }

  // Harvesting operations
  async addHarvesting(harvest: Omit<JDRSSchema["harvesting"]["value"], "syncStatus">) {
    if (!this.db) await this.init()
    const harvestWithSync = { ...harvest, syncStatus: "pending" as const }
    await this.db!.add("harvesting", harvestWithSync)
    await this.addToSyncQueue("harvesting", "create", harvestWithSync)
    return harvestWithSync
  }

  async getHarvestingData(filters?: {
    supervisorId?: string
    labourId?: string
    roomId?: string
    startDate?: string
    endDate?: string
  }) {
    if (!this.db) await this.init()
    let results = await this.db!.getAll("harvesting")

    if (filters) {
      results = results.filter((item) => {
        if (filters.supervisorId && item.supervisorId !== filters.supervisorId) return false
        if (filters.labourId && item.labourId !== filters.labourId) return false
        if (filters.roomId && item.roomId !== filters.roomId) return false
        if (filters.startDate && item.harvestDate < filters.startDate) return false
        if (filters.endDate && item.harvestDate > filters.endDate) return false
        return true
      })
    }

    return results
  }

  async getTodaysHarvest(supervisorId?: string) {
    const today = new Date().toISOString().split("T")[0]
    return await this.getHarvestingData({
      supervisorId,
      startDate: today,
      endDate: today,
    })
  }

  // Sync queue operations
  private async addToSyncQueue(table: string, action: "create" | "update" | "delete", data: any) {
    if (!this.db) await this.init()
    const queueItem = {
      id: crypto.randomUUID(),
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
    }
    await this.db!.add("syncQueue", queueItem)
  }

  async getSyncQueue() {
    if (!this.db) await this.init()
    return await this.db!.getAll("syncQueue")
  }

  async clearSyncQueue() {
    if (!this.db) await this.init()
    await this.db!.clear("syncQueue")
  }

  // Network sync operations
  async syncWithServer() {
    const queue = await this.getSyncQueue()
    const results = []

    for (const item of queue) {
      try {
        // This would sync with your Node.js backend when network is available
        const response = await fetch(`/api/${item.table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: item.action, data: item.data }),
        })

        if (response.ok) {
          results.push({ success: true, item })
        } else {
          results.push({ success: false, item, error: "Server error" })
        }
      } catch (error) {
        results.push({ success: false, item, error: "Network error" })
      }
    }

    // Clear successfully synced items
    const successfulItems = results.filter((r) => r.success)
    if (successfulItems.length > 0) {
      // In a real implementation, you'd remove only the successful items
      console.log(`Synced ${successfulItems.length} items successfully`)
    }

    return results
  }
}

export const offlineStorage = new OfflineStorage()
