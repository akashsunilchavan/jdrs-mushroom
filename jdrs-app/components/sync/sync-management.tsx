"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  RefreshCw,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react"
import { syncManager, type SyncStatus, type SyncError } from "@/lib/sync-manager"

export function SyncManagement() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    pendingItems: 0,
    syncErrors: [],
    syncProgress: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")

  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status)
    }

    syncManager.addStatusListener(handleStatusChange)
    syncManager.updatePendingCount()

    return () => {
      syncManager.removeStatusListener(handleStatusChange)
    }
  }, [])

  const showMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(""), 5000)
  }

  const handleManualSync = async () => {
    setIsLoading(true)
    try {
      const result = await syncManager.syncWithServer()
      if (result.success) {
        showMessage(`Sync completed: ${result.synced} items synced, ${result.failed} failed`, "success")
      } else {
        showMessage("Sync failed", "error")
      }
    } catch (error) {
      showMessage("Sync error occurred", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceSync = async () => {
    setIsLoading(true)
    try {
      const result = await syncManager.forceSync()
      showMessage(`Force sync completed: ${result.synced} items synced`, "success")
    } catch (error) {
      showMessage("Force sync failed", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadFromServer = async () => {
    setIsLoading(true)
    try {
      const result = await syncManager.downloadFromServer()
      if (result.success) {
        showMessage(result.message, "success")
      } else {
        showMessage(result.message, "error")
      }
    } catch (error) {
      showMessage("Download failed", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadToServer = async () => {
    setIsLoading(true)
    try {
      const result = await syncManager.uploadToServer()
      if (result.success) {
        showMessage(result.message, "success")
      } else {
        showMessage(result.message, "error")
      }
    } catch (error) {
      showMessage("Upload failed", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryFailedSync = async () => {
    setIsLoading(true)
    try {
      const result = await syncManager.retryFailedSync()
      showMessage(`Retry completed: ${result.synced} items synced, ${result.failed} failed`, "success")
    } catch (error) {
      showMessage("Retry failed", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearErrors = () => {
    syncManager.clearSyncErrors()
    showMessage("Sync errors cleared", "success")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sync Management</h2>
        <p className="text-muted-foreground">Manage data synchronization between offline storage and server</p>
      </div>

      {message && (
        <Alert variant={messageType === "error" ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Sync Status</TabsTrigger>
          <TabsTrigger value="errors">Sync Errors</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection</CardTitle>
                {syncStatus.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncStatus.isOnline ? "Online" : "Offline"}</div>
                <p className="text-xs text-muted-foreground">Network status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncStatus.pendingItems}</div>
                <p className="text-xs text-muted-foreground">Awaiting sync</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sync Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncStatus.syncErrors.length}</div>
                <p className="text-xs text-muted-foreground">Failed operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleDateString() : "Never"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : "No sync yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sync Actions</CardTitle>
              <CardDescription>Manual synchronization controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleManualSync} disabled={isLoading || syncStatus.isSyncing || !syncStatus.isOnline}>
                  {syncStatus.isSyncing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>

                <Button onClick={handleForceSync} disabled={isLoading} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Sync
                </Button>

                {syncStatus.syncErrors.length > 0 && (
                  <Button onClick={handleRetryFailedSync} disabled={isLoading} variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Retry Failed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Sync Errors ({syncStatus.syncErrors.length})
                </div>
                {syncStatus.syncErrors.length > 0 && (
                  <Button onClick={handleClearErrors} size="sm" variant="outline">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Failed synchronization operations</CardDescription>
            </CardHeader>
            <CardContent>
              {syncStatus.syncErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  No sync errors found. All operations completed successfully.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Retry Count</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncStatus.syncErrors.map((error: SyncError) => (
                        <TableRow key={error.id}>
                          <TableCell>
                            <Badge variant="outline">{error.table}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{error.action}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={error.error}>
                            {error.error}
                          </TableCell>
                          <TableCell>{error.retryCount}</TableCell>
                          <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download from Server
                </CardTitle>
                <CardDescription>Replace local data with server data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will replace all local data with data from the server. Local changes will be lost.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleDownloadFromServer}
                    disabled={isLoading || !syncStatus.isOnline}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download from Server
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload to Server
                </CardTitle>
                <CardDescription>Send all local data to server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will upload all local data to the server. Server data may be overwritten.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleUploadToServer}
                    disabled={isLoading || !syncStatus.isOnline}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Server
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
