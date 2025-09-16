"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Wheat, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { offlineStorage } from "@/lib/offline-storage"
import Link from "next/link"

interface TodayHarvestData {
  id: string
  labourName: string
  roomName: string
  supervisorName: string
  emptyWeight: number
  filledWeight: number
  netWeight: number
  notes?: string
  harvestDate: string
}

export default function TodayHarvestPage() {
  const [harvestData, setHarvestData] = useState<TodayHarvestData[]>([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTodayHarvest = async () => {
      try {
        const [todayHarvest, users, rooms, labour] = await Promise.all([
          offlineStorage.getTodaysHarvest(),
          offlineStorage.getUsers(),
          offlineStorage.getRooms(),
          offlineStorage.getLabourBySupervisor(""), // Get all labour
        ])

        // Get all labour data
        const allLabour: { id: string; firstName: string; lastName: string }[] = []
        const supervisors = users.filter((user) => user.role === "supervisor")
        for (const supervisor of supervisors) {
          const supervisorLabour = await offlineStorage.getLabourBySupervisor(supervisor.id)
          allLabour.push(...supervisorLabour)
        }

        const enrichedData = todayHarvest.map((harvest) => {
          const labourInfo = allLabour.find((l) => l.id === harvest.labourId)
          const roomInfo = rooms.find((r) => r.id === harvest.roomId)
          const supervisorInfo = users.find((u) => u.id === harvest.supervisorId)

          return {
            id: harvest.id,
            labourName: labourInfo ? `${labourInfo.firstName} ${labourInfo.lastName}` : "Unknown",
            roomName: roomInfo ? `${roomInfo.name} (${roomInfo.number})` : "Unknown",
            supervisorName: supervisorInfo ? supervisorInfo.name : "Unknown",
            emptyWeight: harvest.emptyWeight,
            filledWeight: harvest.filledWeight,
            netWeight: harvest.netWeight,
            notes: harvest.notes,
            harvestDate: harvest.harvestDate,
          }
        })

        setHarvestData(enrichedData)
        setTotalWeight(todayHarvest.reduce((sum, harvest) => sum + harvest.netWeight, 0))
      } catch (error) {
        console.error("Failed to load today's harvest:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTodayHarvest()
  }, [])

  const today = new Date().toLocaleDateString()

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
            <h1 className="text-3xl font-bold">Today's Harvest</h1>
            <p className="text-muted-foreground">Harvesting data for {today}</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Summary
            </CardTitle>
            <CardDescription>Overview of today's harvesting activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{harvestData.length}</div>
                <div className="text-sm text-green-600">Total Entries</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{totalWeight.toFixed(2)} kg</div>
                <div className="text-sm text-blue-600">Total Net Weight</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">
                  {harvestData.length > 0 ? (totalWeight / harvestData.length).toFixed(2) : 0} kg
                </div>
                <div className="text-sm text-orange-600">Average per Entry</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvest Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5" />
              Harvest Records
            </CardTitle>
            <CardDescription>Detailed harvest data for today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading harvest data...</div>
            ) : harvestData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No harvest data recorded for today.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Labour</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Empty Weight</TableHead>
                      <TableHead>Filled Weight</TableHead>
                      <TableHead>Net Weight</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {harvestData.map((harvest) => (
                      <TableRow key={harvest.id}>
                        <TableCell className="font-medium">{harvest.labourName}</TableCell>
                        <TableCell>{harvest.roomName}</TableCell>
                        <TableCell>{harvest.supervisorName}</TableCell>
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
