"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  Shield,
} from "lucide-react"
import { storageManager, type StorageStats } from "@/lib/storage-manager"
import { authService } from "@/lib/auth"

export function StorageManagement() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")
  const [validationResult, setValidationResult] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const storageStats = await storageManager.getStorageStats()
      setStats(storageStats)
    } catch (error) {
      showMessage("Failed to load storage statistics", "error")
    }
  }

  const showMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(""), 5000)
  }

  const handleExportBackup = async () => {
    setIsLoading(true)
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser) {
        showMessage("User not authenticated", "error")
        return
      }

      await storageManager.exportBackup(currentUser.email)
      showMessage("Backup exported successfully", "success")
      await loadStats() // Refresh stats to update last backup time
    } catch (error) {
      showMessage("Failed to export backup", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const result = await storageManager.importBackup(file)

      if (result.success) {
        showMessage(result.message, "success")
        await loadStats() // Refresh stats
      } else {
        showMessage(result.message, "error")
      }
    } catch (error) {
      showMessage("Failed to import backup", "error")
    } finally {
      setIsLoading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const handleValidateData = async () => {
    setIsLoading(true)
    try {
      const result = await storageManager.validateDataIntegrity()
      setValidationResult(result)

      if (result.isValid) {
        showMessage("Data integrity validation passed", "success")
      } else {
        showMessage(`Found ${result.issues.length} data integrity issues`, "error")
      }
    } catch (error) {
      showMessage("Failed to validate data integrity", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = async () => {
    if (!window.confirm("Are you sure you want to clear ALL data? This action cannot be undone!")) {
      return
    }

    if (
      !window.confirm(
        "This will permanently delete all users, rooms, labour, and harvest data. Type 'DELETE' to confirm.",
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      await storageManager.clearAllData()
      showMessage("All data cleared successfully", "success")
      await loadStats()
      setValidationResult(null)
    } catch (error) {
      showMessage("Failed to clear data", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Storage Management</h2>
        <p className="text-muted-foreground">Manage offline data storage, backups, and data integrity</p>
      </div>

      {message && (
        <Alert variant={messageType === "error" ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="validation">Data Validation</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Admin & Supervisors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRooms || 0}</div>
                <p className="text-xs text-muted-foreground">Harvesting rooms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Labour</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLabour || 0}</div>
                <p className="text-xs text-muted-foreground">Registered workers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Harvest Records</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalHarvesting || 0}</div>
                <p className="text-xs text-muted-foreground">Total entries</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Storage Size:</span>
                    <Badge variant="outline">{stats?.storageSize || "0 KB"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Sync:</span>
                    <Badge variant={stats?.pendingSyncItems ? "destructive" : "default"}>
                      {stats?.pendingSyncItems || 0} items
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup:</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleString() : "Never"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Button onClick={loadStats} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Stats
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Backup
                </CardTitle>
                <CardDescription>Create a backup file of all your data for safekeeping</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This will create a JSON file containing all users, rooms, labour, and harvest data. Passwords are
                    excluded for security.
                  </p>
                  <Button onClick={handleExportBackup} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Backup
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Backup
                </CardTitle>
                <CardDescription>Restore data from a previously exported backup file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This will replace all current data with the backup data. Imported users will have default password
                    "imported123".
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="backup-file">Select Backup File</Label>
                    <Input
                      id="backup-file"
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Integrity Validation
              </CardTitle>
              <CardDescription>Check for data consistency and integrity issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleValidateData} disabled={isLoading} variant="outline">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate Data Integrity
                    </>
                  )}
                </Button>

                {validationResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{validationResult.isValid ? "Data is valid" : "Issues found"}</span>
                    </div>

                    {!validationResult.isValid && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Issues:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {validationResult.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>Users: {validationResult.stats.users}</div>
                      <div>Rooms: {validationResult.stats.rooms}</div>
                      <div>Labour: {validationResult.stats.labour}</div>
                      <div>Harvests: {validationResult.stats.harvesting}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that will permanently delete data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These actions cannot be undone. Make sure you have a backup before proceeding.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Clear All Data</h4>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all users, rooms, labour, and harvest data from the offline storage.
                  </p>
                  <Button onClick={handleClearData} disabled={isLoading} variant="destructive">
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
