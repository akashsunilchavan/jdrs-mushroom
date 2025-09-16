"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, ArrowLeft, Calendar, Download } from "lucide-react"
import { offlineStorage } from "@/lib/offline-storage"
import { authService } from "@/lib/auth"
import Link from "next/link"

interface HarvestData {
  id: string
  labourName: string
  roomName: string
  emptyWeight: number
  filledWeight: number
  netWeight: number
  notes?: string
  harvestDate: string
}

interface FilterOptions {
  labourId: string
  roomId: string
  startDate: string
  endDate: string
}

export default function HarvestingFiltersPage() {
  const [harvestData, setHarvestData] = useState<HarvestData[]>([])
  const [filteredData, setFilteredData] = useState<HarvestData[]>([])
  const [labour, setLabour] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    labourId: "all",
    roomId: "all",
    startDate: "",
    endDate: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        if (!currentUser) return

        const [supervisorHarvest, labourData, roomsData] = await Promise.all([
          offlineStorage.getHarvestingData({ supervisorId: currentUser.id }),
          offlineStorage.getLabourBySupervisor(currentUser.id),
          offlineStorage.getRooms(),
        ])

        setLabour(labourData)
        setRooms(roomsData)

        // Enrich harvest data
        const enrichedData = supervisorHarvest.map((harvest) => {
          const labourInfo = labourData.find((l) => l.id === harvest.labourId)
          const roomInfo = roomsData.find((r) => r.id === harvest.roomId)

          return {
            id: harvest.id,
            labourName: labourInfo ? `${labourInfo.firstName} ${labourInfo.lastName}` : "Unknown",
            roomName: roomInfo ? `${roomInfo.name} (${roomInfo.number})` : "Unknown",
            emptyWeight: harvest.emptyWeight,
            filledWeight: harvest.filledWeight,
            netWeight: harvest.netWeight,
            notes: harvest.notes,
            harvestDate: harvest.harvestDate,
          }
        })

        setHarvestData(enrichedData)
        setFilteredData(enrichedData)
      } catch (error) {
        console.error("Failed to load harvest data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    let filtered = [...harvestData]

    if (filters.labourId !== "all") {
      const selectedLabour = labour.find((l) => l.id === filters.labourId)
      if (selectedLabour) {
        filtered = filtered.filter(
          (item) => item.labourName === `${selectedLabour.firstName} ${selectedLabour.lastName}`,
        )
      }
    }

    if (filters.roomId !== "all") {
      const selectedRoom = rooms.find((r) => r.id === filters.roomId)
      if (selectedRoom) {
        filtered = filtered.filter((item) => item.roomName.includes(selectedRoom.name))
      }
    }

    if (filters.startDate) {
      filtered = filtered.filter((item) => item.harvestDate >= filters.startDate)
    }

    if (filters.endDate) {
      filtered = filtered.filter((item) => item.harvestDate <= filters.endDate)
    }

    setFilteredData(filtered)
  }, [filters, harvestData, labour, rooms])

  const totalWeight = filteredData.reduce((sum, item) => sum + item.netWeight, 0)
  const todayData = filteredData.filter((item) => item.harvestDate === new Date().toISOString().split("T")[0])
  const todayWeight = todayData.reduce((sum, item) => sum + item.netWeight, 0)

  const clearFilters = () => {
    setFilters({
      labourId: "all",
      roomId: "all",
      startDate: "",
      endDate: "",
    })
  }

  const setTodayFilter = () => {
    const today = new Date().toISOString().split("T")[0]
    setFilters({
      labourId: "all",
      roomId: "all",
      startDate: today,
      endDate: today,
    })
  }

  return (
    <DashboardLayout requiredRole="supervisor">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/supervisor/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Harvesting Filters</h1>
            <p className="text-muted-foreground">View and filter your harvest records</p>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today's Harvest</TabsTrigger>
            <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Summary
                </CardTitle>
                <CardDescription>Your harvest activities for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{todayData.length}</div>
                    <div className="text-sm text-green-600">Today's Entries</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{todayWeight.toFixed(2)} kg</div>
                    <div className="text-sm text-blue-600">Today's Weight</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {todayData.length > 0 ? (todayWeight / todayData.length).toFixed(2) : 0} kg
                    </div>
                    <div className="text-sm text-orange-600">Average per Entry</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={setTodayFilter} variant="outline" size="sm">
                    View Today's Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Options
                </CardTitle>
                <CardDescription>Apply filters to view specific harvest records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Labour Worker</Label>
                    <Select
                      value={filters.labourId}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, labourId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select labour" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Labour</SelectItem>
                        {labour.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.firstName} {worker.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select
                      value={filters.roomId}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, roomId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} ({room.number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                  <Button variant="outline" onClick={setTodayFilter} size="sm">
                    Today Only
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Harvest Records ({filteredData.length})</div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardTitle>
            <CardDescription>
              Showing {filteredData.length} records with total weight of {totalWeight.toFixed(2)} kg
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading harvest data...</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No harvest records found matching the selected filters.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Labour</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Empty Weight</TableHead>
                      <TableHead>Filled Weight</TableHead>
                      <TableHead>Net Weight</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((harvest) => (
                      <TableRow key={harvest.id}>
                        <TableCell>{new Date(harvest.harvestDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{harvest.labourName}</TableCell>
                        <TableCell>{harvest.roomName}</TableCell>
                        <TableCell>{harvest.emptyWeight} kg</TableCell>
                        <TableCell>{harvest.filledWeight} kg</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {harvest.netWeight} kg
                          </Badge>
                        </TableCell>
                        <TableCell>{harvest.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
