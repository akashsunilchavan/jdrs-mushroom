"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ClipboardList, Calendar, TrendingUp, Filter } from "lucide-react"
import Link from "next/link"
import { offlineStorage } from "@/lib/offline-storage"
import { authService } from "@/lib/auth"

interface SupervisorStats {
  totalLabour: number
  todayHarvest: number
  todayEntries: number
  averageWeight: number
}

interface RecentHarvest {
  id: string
  labourName: string
  roomName: string
  netWeight: number
  harvestDate: string
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<SupervisorStats>({
    totalLabour: 0,
    todayHarvest: 0,
    todayEntries: 0,
    averageWeight: 0,
  })
  const [recentHarvests, setRecentHarvests] = useState<RecentHarvest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        if (!currentUser) return

        const [labour, todayHarvest, rooms] = await Promise.all([
          offlineStorage.getLabourBySupervisor(currentUser.id),
          offlineStorage.getTodaysHarvest(currentUser.id),
          offlineStorage.getRooms(),
        ])

        const todayWeight = todayHarvest.reduce((sum, harvest) => sum + harvest.netWeight, 0)
        const avgWeight = todayHarvest.length > 0 ? todayWeight / todayHarvest.length : 0

        // Get recent harvests (last 5)
        const recentHarvestData = await offlineStorage.getHarvestingData({
          supervisorId: currentUser.id,
        })

        const enrichedRecent = recentHarvestData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((harvest) => {
            const labourInfo = labour.find((l) => l.id === harvest.labourId)
            const roomInfo = rooms.find((r) => r.id === harvest.roomId)

            return {
              id: harvest.id,
              labourName: labourInfo ? `${labourInfo.firstName} ${labourInfo.lastName}` : "Unknown",
              roomName: roomInfo ? `${roomInfo.name} (${roomInfo.number})` : "Unknown",
              netWeight: harvest.netWeight,
              harvestDate: harvest.harvestDate,
            }
          })

        setStats({
          totalLabour: labour.length,
          todayHarvest: todayWeight,
          todayEntries: todayHarvest.length,
          averageWeight: avgWeight,
        })
        setRecentHarvests(enrichedRecent)
      } catch (error) {
        console.error("Failed to load supervisor stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const quickActions = [
    {
      title: "Add Labour",
      description: "Register new labour worker",
      href: "/supervisor/labour/add",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Fill Harvesting",
      description: "Record harvest data",
      href: "/supervisor/harvesting/fill",
      icon: ClipboardList,
      color: "bg-green-500",
    },
    {
      title: "View Filters",
      description: "Filter harvest records",
      href: "/supervisor/harvesting/filters",
      icon: Filter,
      color: "bg-purple-500",
    },
  ]

  return (
    <DashboardLayout requiredRole="supervisor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Supervisor Dashboard</h1>
          <p className="text-muted-foreground">Manage your labour and harvesting activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Labour</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLabour}</div>
              <p className="text-xs text-muted-foreground">Registered workers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Harvest</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayHarvest.toFixed(2)} kg</div>
              <p className="text-xs text-muted-foreground">Net weight today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayEntries}</div>
              <p className="text-xs text-muted-foreground">Harvest records today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageWeight.toFixed(2)} kg</div>
              <p className="text-xs text-muted-foreground">Per entry today</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Harvest Activity</CardTitle>
            <CardDescription>Your latest harvest entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading recent activity...</div>
            ) : recentHarvests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent harvest activity found.
                <div className="mt-2">
                  <Link href="/supervisor/harvesting/fill">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Record First Harvest
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentHarvests.map((harvest) => (
                  <div key={harvest.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{harvest.labourName}</div>
                      <div className="text-sm text-muted-foreground">{harvest.roomName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{harvest.netWeight} kg</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(harvest.harvestDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Work Summary</CardTitle>
            <CardDescription>Overview of today's activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Entries</span>
                  <span className="font-medium">{stats.todayEntries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Weight</span>
                  <span className="font-medium">{stats.todayHarvest.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average per Entry</span>
                  <span className="font-medium">{stats.averageWeight.toFixed(2)} kg</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Labour</span>
                  <span className="font-medium">{stats.totalLabour}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Status</span>
                  <span className="text-sm text-green-600 font-medium">Stored Offline</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
