import { offlineStorage } from "./offline-storage"

export interface StorageStats {
  totalUsers: number
  totalRooms: number
  totalLabour: number
  totalHarvesting: number
  pendingSyncItems: number
  storageSize: string
  lastBackup?: string
}

export interface BackupData {
  version: string
  timestamp: string
  users: any[]
  rooms: any[]
  labour: any[]
  harvesting: any[]
  metadata: {
    exportedBy: string
    totalRecords: number
  }
}

class StorageManager {
  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    try {
      const [users, rooms, labour, harvesting, syncQueue] = await Promise.all([
        offlineStorage.getUsers(),
        offlineStorage.getRooms(),
        this.getAllLabour(),
        offlineStorage.getHarvestingData(),
        offlineStorage.getSyncQueue(),
      ])

      // Estimate storage size (rough calculation)
      const dataSize = JSON.stringify({ users, rooms, labour, harvesting }).length
      const sizeInKB = Math.round(dataSize / 1024)
      const storageSize = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`

      return {
        totalUsers: users.length,
        totalRooms: rooms.length,
        totalLabour: labour.length,
        totalHarvesting: harvesting.length,
        pendingSyncItems: syncQueue.length,
        storageSize,
        lastBackup: localStorage.getItem("jdrs_last_backup") || undefined,
      }
    } catch (error) {
      console.error("Failed to get storage stats:", error)
      throw error
    }
  }

  // Get all labour across all supervisors
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

  // Create backup of all data
  async createBackup(exportedBy: string): Promise<BackupData> {
    try {
      const [users, rooms, labour, harvesting] = await Promise.all([
        offlineStorage.getUsers(),
        offlineStorage.getRooms(),
        this.getAllLabour(),
        offlineStorage.getHarvestingData(),
      ])

      const backup: BackupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        users: users.map(({ password, ...user }) => user), // Exclude passwords from backup
        rooms,
        labour,
        harvesting,
        metadata: {
          exportedBy,
          totalRecords: users.length + rooms.length + labour.length + harvesting.length,
        },
      }

      // Store backup timestamp
      localStorage.setItem("jdrs_last_backup", backup.timestamp)

      return backup
    } catch (error) {
      console.error("Failed to create backup:", error)
      throw error
    }
  }

  // Export backup as downloadable file
  async exportBackup(exportedBy: string): Promise<void> {
    try {
      const backup = await this.createBackup(exportedBy)
      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `jdrs-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export backup:", error)
      throw error
    }
  }

  // Validate backup data structure
  private validateBackupData(data: any): data is BackupData {
    return (
      data &&
      typeof data === "object" &&
      data.version &&
      data.timestamp &&
      Array.isArray(data.users) &&
      Array.isArray(data.rooms) &&
      Array.isArray(data.labour) &&
      Array.isArray(data.harvesting) &&
      data.metadata &&
      typeof data.metadata.totalRecords === "number"
    )
  }

  // Import backup from file
  async importBackup(file: File): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      if (!this.validateBackupData(backupData)) {
        return { success: false, message: "Invalid backup file format" }
      }

      // Clear existing data (optional - could be made configurable)
      await this.clearAllData()

      // Import data
      let importedCount = 0

      // Import users (with default passwords)
      for (const user of backupData.users) {
        try {
          await offlineStorage.addUser({
            ...user,
            password: "imported123", // Default password for imported users
          })
          importedCount++
        } catch (error) {
          console.warn("Failed to import user:", user.email, error)
        }
      }

      // Import rooms
      for (const room of backupData.rooms) {
        try {
          await offlineStorage.addRoom(room)
          importedCount++
        } catch (error) {
          console.warn("Failed to import room:", room.name, error)
        }
      }

      // Import labour
      for (const worker of backupData.labour) {
        try {
          await offlineStorage.addLabour(worker)
          importedCount++
        } catch (error) {
          console.warn("Failed to import labour:", worker.firstName, error)
        }
      }

      // Import harvesting data
      for (const harvest of backupData.harvesting) {
        try {
          await offlineStorage.addHarvesting(harvest)
          importedCount++
        } catch (error) {
          console.warn("Failed to import harvest:", harvest.id, error)
        }
      }

      return {
        success: true,
        message: `Successfully imported ${importedCount} records from backup`,
        stats: {
          users: backupData.users.length,
          rooms: backupData.rooms.length,
          labour: backupData.labour.length,
          harvesting: backupData.harvesting.length,
          imported: importedCount,
        },
      }
    } catch (error) {
      console.error("Failed to import backup:", error)
      return { success: false, message: "Failed to import backup: " + (error as Error).message }
    }
  }

  // Clear all data (use with caution)
  async clearAllData(): Promise<void> {
    try {
      await offlineStorage.init()
      const db = (offlineStorage as any).db

      if (db) {
        await Promise.all([
          db.clear("users"),
          db.clear("rooms"),
          db.clear("labour"),
          db.clear("harvesting"),
          db.clear("syncQueue"),
        ])
      }
    } catch (error) {
      console.error("Failed to clear data:", error)
      throw error
    }
  }

  // Validate data integrity
  async validateDataIntegrity(): Promise<{
    isValid: boolean
    issues: string[]
    stats: any
  }> {
    try {
      const issues: string[] = []
      const [users, rooms, labour, harvesting] = await Promise.all([
        offlineStorage.getUsers(),
        offlineStorage.getRooms(),
        this.getAllLabour(),
        offlineStorage.getHarvestingData(),
      ])

      // Check for orphaned labour (labour without valid supervisor)
      const supervisorIds = users.filter((u) => u.role === "supervisor").map((u) => u.id)
      const orphanedLabour = labour.filter((l) => !supervisorIds.includes(l.supervisorId))
      if (orphanedLabour.length > 0) {
        issues.push(`${orphanedLabour.length} labour records have invalid supervisor references`)
      }

      // Check for orphaned harvesting data
      const labourIds = labour.map((l) => l.id)
      const roomIds = rooms.map((r) => r.id)
      const orphanedHarvests = harvesting.filter(
        (h) =>
          !labourIds.includes(h.labourId) || !roomIds.includes(h.roomId) || !supervisorIds.includes(h.supervisorId),
      )
      if (orphanedHarvests.length > 0) {
        issues.push(`${orphanedHarvests.length} harvest records have invalid references`)
      }

      // Check for duplicate emails
      const emails = users.map((u) => u.email)
      const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index)
      if (duplicateEmails.length > 0) {
        issues.push(`${duplicateEmails.length} duplicate email addresses found`)
      }

      return {
        isValid: issues.length === 0,
        issues,
        stats: {
          users: users.length,
          rooms: rooms.length,
          labour: labour.length,
          harvesting: harvesting.length,
          orphanedLabour: orphanedLabour.length,
          orphanedHarvests: orphanedHarvests.length,
        },
      }
    } catch (error) {
      console.error("Failed to validate data integrity:", error)
      return {
        isValid: false,
        issues: ["Failed to validate data integrity: " + (error as Error).message],
        stats: {},
      }
    }
  }

  // Cleanup orphaned data
  async cleanupOrphanedData(): Promise<{ cleaned: number; message: string }> {
    try {
      // This would require more complex operations to actually remove orphaned data
      // For now, we'll just return a message
      const validation = await this.validateDataIntegrity()

      if (validation.isValid) {
        return { cleaned: 0, message: "No orphaned data found" }
      }

      // In a real implementation, you would:
      // 1. Remove orphaned labour records
      // 2. Remove orphaned harvest records
      // 3. Fix duplicate emails

      return {
        cleaned: 0,
        message: `Found ${validation.issues.length} issues. Manual cleanup required.`,
      }
    } catch (error) {
      console.error("Failed to cleanup orphaned data:", error)
      throw error
    }
  }
}

export const storageManager = new StorageManager()
