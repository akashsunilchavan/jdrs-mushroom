"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Clock, Trash2 } from "lucide-react"
import { syncManager, type SyncStatus } from "@/lib/sync-manager"

export function SyncStatusWidget() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    pendingItems: 0,
    syncErrors: [],
    syncProgress: 0,
  })

  useEffect(() => {
    // Add status listener
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status)
    }

    syncManager.addStatusListener(handleStatusChange)
    syncManager.updatePendingCount()

    // Cleanup on unmount
    return () => {
      syncManager.removeStatusListener(handleStatusChange)
    }
  }, [])

  const handleManualSync = async () => {
    await syncManager.syncWithServer()
  }

  const handleRetrySync = async () => {
    await syncManager.retryFailedSync()
  }

  const handleClearErrors = () => {
    syncManager.clearSyncErrors()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {syncStatus.isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          Sync Status
        </CardTitle>
        <CardDescription>Data synchronization with server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Connection:</span>
          <Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
            {syncStatus.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Sync Progress */}
        {syncStatus.isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Syncing...</span>
              <span className="text-sm text-muted-foreground">{syncStatus.syncProgress}%</span>
            </div>
            <Progress value={syncStatus.syncProgress} className="w-full" />
          </div>
        )}

        {/* Pending Items */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Pending Items:</span>
          <Badge variant={syncStatus.pendingItems > 0 ? "secondary" : "outline"}>{syncStatus.pendingItems}</Badge>
        </div>

        {/* Last Sync Time */}
        {syncStatus.lastSyncTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Last Sync:</span>
            <span className="text-xs text-muted-foreground">{new Date(syncStatus.lastSyncTime).toLocaleString()}</span>
          </div>
        )}

        {/* Sync Errors */}
        {syncStatus.syncErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {syncStatus.syncErrors.length} sync error(s) occurred. Check the sync management page for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleManualSync}
            disabled={syncStatus.isSyncing || !syncStatus.isOnline}
            size="sm"
            variant="outline"
          >
            {syncStatus.isSyncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>

          {syncStatus.syncErrors.length > 0 && (
            <>
              <Button onClick={handleRetrySync} disabled={syncStatus.isSyncing} size="sm" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={handleClearErrors} size="sm" variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
