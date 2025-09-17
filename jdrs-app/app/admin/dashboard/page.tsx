"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Building,
  BarChart3,
  Calendar,
  TrendingUp,
  RefreshCw,
  Database,
  ArrowUpRight,
  Activity,
  Clock,
  Zap,
  Target,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { offlineStorage } from "@/lib/offline-storage"
import { SyncStatusWidget } from "@/components/sync/sync-status"

interface DashboardStats {
  totalSupervisors: number
  totalRooms: number
  todayHarvest: number
  totalHarvest: number
  activeSupervisors: number
  weeklyGrowth: number
  monthlyTarget: number
  efficiency: number
}

interface RecentActivity {
  id: string
  type: "harvest" | "supervisor" | "room"
  message: string
  timestamp: string
  status: "success" | "warning" | "info"
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSupervisors: 0,
    totalRooms: 0,
    todayHarvest: 0,
    totalHarvest: 0,
    activeSupervisors: 0,
    weeklyGrowth: 0,
    monthlyTarget: 0,
    efficiency: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  
  // ⏰ Clock updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 📊 Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users = [], rooms = [], todayHarvest = [], allHarvest = []] =
          await Promise.all([
            offlineStorage.getUsers?.() ?? [],
            offlineStorage.getRooms?.() ?? [],
            offlineStorage.getTodaysHarvest?.() ?? [],
            offlineStorage.getHarvestingData?.() ?? [],
          ])

        const supervisors = users.filter((u: any) => u.role === "supervisor")
        const activeSupervisors = supervisors.filter((u: any) => u.isActive)

        const todayWeight = todayHarvest?.reduce(
          (sum: number, h: any) => sum + (h.netWeight || 0),
          0
        )
        const totalWeight = allHarvest?.reduce(
          (sum: number, h: any) => sum + (h.netWeight || 0),
          0
        )

        // Mock stats
        const weeklyGrowth = Math.random() * 20 + 5
        const monthlyTarget = 1000
        const efficiency = Math.min(
          (todayWeight / (monthlyTarget / 30)) * 100,
          100
        )

        setStats({
          totalSupervisors: supervisors.length,
          totalRooms: rooms.length,
          todayHarvest: todayWeight,
          totalHarvest: totalWeight,
          activeSupervisors: activeSupervisors.length,
          weeklyGrowth,
          monthlyTarget,
          efficiency,
        })

        // Mock recent activities
        setRecentActivities([
          {
            id: "1",
            type: "harvest",
            message: "New harvest recorded: 45.2kg from Room A",
            timestamp: "2 minutes ago",
            status: "success",
          },
          {
            id: "2",
            type: "supervisor",
            message: "Supervisor John Doe logged in",
            timestamp: "15 minutes ago",
            status: "info",
          },
          {
            id: "3",
            type: "room",
            message: "Room B maintenance scheduled",
            timestamp: "1 hour ago",
            status: "warning",
          },
        ])
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const quickActions = [
    {
      title: "Add Supervisor",
      description: "Create new supervisor account",
      href: "/admin/supervisors/add",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Add Room",
      description: "Register new harvesting room",
      href: "/admin/rooms/add",
      icon: Building,
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Today's Harvest",
      description: "Check today's harvesting data",
      href: "/admin/harvesting/today",
      icon: Calendar,
      gradient: "from-orange-500 to-orange-600",
    },
    {
      title: "Total Harvesting",
      description: "View all harvesting records",
      href: "/admin/harvesting/total",
      icon: BarChart3,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Sync Management",
      description: "Manage data synchronization",
      href: "/admin/sync",
      icon: RefreshCw,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Storage Management",
      description: "Manage offline storage",
      href: "/admin/storage",
      icon: Database,
      gradient: "from-teal-500 to-teal-600",
    },
  ]

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-green-500" />
            <span className="text-lg font-medium text-slate-600">
              Loading dashboard...
            </span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8 p-6  min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                  {getGreeting()}, Admin
                </h1>
                <p className="text-slate-600 dark:text-slate-400">Welcome to JDRS Harvesting Management System</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                {formatTime(currentTime)}
              </span>
            </div>
            <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              System Online
            </Badge>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-blue-100">Total Supervisors</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-1">{stats.totalSupervisors}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  {stats.activeSupervisors} active
                </Badge>
                <ArrowUpRight className="h-3 w-3 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-green-100">Total Rooms</CardTitle>
              <Building className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-1">{stats.totalRooms}</div>
              <p className="text-xs text-green-100">Harvesting facilities</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-orange-100">Today's Harvest</CardTitle>
              <Calendar className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-1">{stats.todayHarvest.toFixed(1)} <span className="text-lg">kg</span></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-orange-200" />
                <span className="text-xs text-orange-100">+{stats.weeklyGrowth.toFixed(1)}% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-purple-100">Total Harvest</CardTitle>
              <Trophy className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-1">{stats.totalHarvest.toFixed(0)} <span className="text-lg">kg</span></div>
              <p className="text-xs text-purple-100">All time record</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Progress */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Monthly Progress
                  </CardTitle>
                  <CardDescription>Track your harvesting goals</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats.efficiency.toFixed(0)}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Current: {stats.todayHarvest.toFixed(1)} kg</span>
                  <span className="text-slate-600">Target: {stats.monthlyTarget} kg</span>
                </div>
                <Progress value={stats.efficiency} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.efficiency.toFixed(0)}%</div>
                  <div className="text-xs text-slate-500">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeSupervisors}</div>
                  <div className="text-xs text-slate-500">Active Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalRooms}</div>
                  <div className="text-xs text-slate-500">Facilities</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{activity.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50">
                  View all activities
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Status Widget */}
        <SyncStatusWidget />

        {/* Quick Actions Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
              <p className="text-slate-600 dark:text-slate-400">Streamline your workflow</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <Card className={`group border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-gradient-to-br ${action.gradient} text-white overflow-hidden relative`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                      </div>
                      <CardTitle className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                        {action.title}
                      </CardTitle>
                      <CardDescription className="text-white/80 group-hover:text-white/70 transition-colors">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* System Status */}
      
      </div>
    </DashboardLayout>
  )
}