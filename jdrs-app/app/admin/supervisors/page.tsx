"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Plus, 
  Eye, 
  Users, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp
} from "lucide-react"
import { offlineStorage } from "@/lib/offline-storage"
import Link from "next/link"

interface Supervisor {
  id: string
  name: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string
}

type FilterStatus = "all" | "active" | "inactive"
type SortBy = "name" | "email" | "createdAt"

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [filteredSupervisors, setFilteredSupervisors] = useState<Supervisor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [sortBy, setSortBy] = useState<SortBy>("name")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null)

  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        setIsLoading(true)
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const users = await offlineStorage.getUsers()
        const supervisorUsers = users
          .filter((user) => user.role === "supervisor")
          .map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
          }))

        setSupervisors(supervisorUsers)
      } catch (error) {
        console.error("Failed to load supervisors:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSupervisors()
  }, [])

  useEffect(() => {
    let filtered = supervisors.filter(
      (supervisor) =>
        supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supervisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supervisor.phone.includes(searchTerm)
    )

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(supervisor => 
        filterStatus === "active" ? supervisor.isActive : !supervisor.isActive
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "email":
          return a.email.localeCompare(b.email)
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    setFilteredSupervisors(filtered)
  }, [searchTerm, supervisors, filterStatus, sortBy])

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500))
    window.location.reload()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />
  }

  const stats = {
    total: supervisors.length,
    active: supervisors.filter(s => s.isActive).length,
    inactive: supervisors.filter(s => !s.isActive).length,
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Supervisors</h1>
                  <p className="text-lg text-gray-600">Manage supervisor accounts and monitor activities</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <Badge variant="outline" className="bg-white border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Panel
                </Badge>
                <Badge variant="outline" className="bg-white border-green-200">
                  <Activity className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-white hover:bg-gray-50 shadow-sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Link href="/admin/supervisors/add">
                <Button className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supervisor
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Supervisors</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-xl">
                    <Users className="h-8 w-8 text-blue-700" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-700">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  All registered supervisors
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Active</p>
                    <p className="text-3xl font-bold text-green-900">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-xl">
                    <UserCheck className="h-8 w-8 text-green-700" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-700">
                  <Activity className="h-4 w-4 mr-1" />
                  Currently active
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Inactive</p>
                    <p className="text-3xl font-bold text-red-900">{stats.inactive}</p>
                  </div>
                  <div className="p-3 bg-red-200 rounded-xl">
                    <UserX className="h-8 w-8 text-red-700" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-red-700">
                  <UserX className="h-4 w-4 mr-1" />
                  Temporarily disabled
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-6 w-6 text-blue-600" />
                Supervisors Directory
              </CardTitle>
              <CardDescription className="text-base">
                Comprehensive view of all supervisor accounts with advanced filtering and search capabilities
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Search and Filter Controls */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                    <SelectTrigger className="w-40 h-12 bg-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                    <SelectTrigger className="w-40 h-12 bg-white">
                      <Settings className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="email">Sort by Email</SelectItem>
                      <SelectItem value="createdAt">Sort by Date</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="h-12 px-4 bg-white">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredSupervisors.length} of {supervisors.length} supervisors
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
                {filterStatus !== "all" && (
                  <Badge variant="outline" className="capitalize">
                    {filterStatus} filter applied
                  </Badge>
                )}
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Loading supervisors...</p>
                  <p className="text-sm text-gray-500">Please wait while we fetch the data</p>
                </div>
              ) : filteredSupervisors.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm || filterStatus !== "all" ? "No supervisors found" : "No supervisors yet"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterStatus !== "all" 
                      ? "Try adjusting your search terms or filters" 
                      : "Get started by adding your first supervisor"
                    }
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Link href="/admin/supervisors/add">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Supervisor
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                /* Supervisors Table */
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">Supervisor</TableHead>
                        <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Joined</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupervisors.map((supervisor, index) => (
                        <TableRow 
                          key={supervisor.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {supervisor.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{supervisor.name}</p>
                                <p className="text-sm text-gray-500">ID: {supervisor.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-700">{supervisor.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-700">{supervisor.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={`${getStatusColor(supervisor.isActive)} border`}>
                              {getStatusIcon(supervisor.isActive)}
                              {supervisor.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(supervisor.createdAt)}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedSupervisor(supervisor)}
                                  className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                      {selectedSupervisor?.name.charAt(0).toUpperCase()}
                                    </div>
                                    {selectedSupervisor?.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Detailed information about this supervisor
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedSupervisor && (
                                  <div className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-sm text-gray-900">{selectedSupervisor.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                        <p className="text-sm text-gray-900">{selectedSupervisor.phone}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                        <Badge className={`${getStatusColor(selectedSupervisor.isActive)} border text-xs`}>
                                          {getStatusIcon(selectedSupervisor.isActive)}
                                          {selectedSupervisor.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Joined</p>
                                        <p className="text-sm text-gray-900">{formatDate(selectedSupervisor.createdAt)}</p>
                                      </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="flex gap-2">
                                      <Button size="sm" className="flex-1">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Edit Profile
                                      </Button>
                                      <Button size="sm" variant="outline" className="flex-1">
                                        <Activity className="mr-2 h-4 w-4" />
                                        View Activity
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}