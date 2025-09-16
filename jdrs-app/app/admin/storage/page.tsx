"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StorageManagement } from "@/components/admin/storage-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StoragePage() {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Storage Management</h1>
            <p className="text-muted-foreground">Manage offline data storage and backups</p>
          </div>
        </div>

        <StorageManagement />
      </div>
    </DashboardLayout>
  )
}
