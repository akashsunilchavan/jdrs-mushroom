"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Calculator } from "lucide-react"
import { offlineStorage } from "@/lib/offline-storage"
import { authService } from "@/lib/auth"
import Link from "next/link"

interface Labour {
  id: string
  firstName: string
  lastName: string
  contact: string
}

interface Room {
  id: string
  name: string
  number: string
}

export default function FillHarvesting() {
  const [formData, setFormData] = useState({
    labourId: "",
    roomId: "",
    emptyWeight: "",
    filledWeight: "",
    notes: "",
  })
  const [labour, setLabour] = useState<Labour[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [netWeight, setNetWeight] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = authService.getCurrentUser()
        if (!currentUser) return

        const [labourData, roomsData] = await Promise.all([
          offlineStorage.getLabourBySupervisor(currentUser.id),
          offlineStorage.getRooms(),
        ])

        setLabour(labourData)
        setRooms(roomsData)
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const empty = Number.parseFloat(formData.emptyWeight) || 0
    const filled = Number.parseFloat(formData.filledWeight) || 0
    const net = filled - empty
    setNetWeight(net > 0 ? net : 0)
  }, [formData.emptyWeight, formData.filledWeight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser) {
        setError("User not authenticated")
        return
      }

      const emptyWeight = Number.parseFloat(formData.emptyWeight)
      const filledWeight = Number.parseFloat(formData.filledWeight)

      if (isNaN(emptyWeight) || isNaN(filledWeight)) {
        setError("Please enter valid weights")
        return
      }

      if (filledWeight <= emptyWeight) {
        setError("Filled weight must be greater than empty weight")
        return
      }

      // Create harvest record
      await offlineStorage.addHarvesting({
        id: crypto.randomUUID(),
        labourId: formData.labourId,
        roomId: formData.roomId,
        supervisorId: currentUser.id,
        emptyWeight,
        filledWeight,
        netWeight: filledWeight - emptyWeight,
        notes: formData.notes || undefined,
        harvestDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      })

      setSuccess("Harvest data recorded successfully!")

      // Reset form
      setFormData({
        labourId: "",
        roomId: "",
        emptyWeight: "",
        filledWeight: "",
        notes: "",
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/supervisor/dashboard")
      }, 2000)
    } catch (err) {
      setError("Failed to record harvest data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
            <h1 className="text-3xl font-bold">Fill Harvesting Data</h1>
            <p className="text-muted-foreground">Record carret weights and harvest information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Harvest Information</CardTitle>
                <CardDescription>Fill in the harvest details for the selected labour and room</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="labourId">Select Labour</Label>
                      <Select value={formData.labourId} onValueChange={(value) => handleInputChange("labourId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose labour worker" />
                        </SelectTrigger>
                        <SelectContent>
                          {labour.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.firstName} {worker.lastName} - {worker.contact}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomId">Select Room</Label>
                      <Select value={formData.roomId} onValueChange={(value) => handleInputChange("roomId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose harvesting room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} ({room.number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emptyWeight">Empty Carret Weight (kg)</Label>
                      <Input
                        id="emptyWeight"
                        type="number"
                        step="0.01"
                        placeholder="Enter empty weight"
                        value={formData.emptyWeight}
                        onChange={(e) => handleInputChange("emptyWeight", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filledWeight">Filled Carret Weight (kg)</Label>
                      <Input
                        id="filledWeight"
                        type="number"
                        step="0.01"
                        placeholder="Enter filled weight"
                        value={formData.filledWeight}
                        onChange={(e) => handleInputChange("filledWeight", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Enter any additional notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        "Record Harvest"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Weight Calculator
                </CardTitle>
                <CardDescription>Automatic net weight calculation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Empty Weight:</span>
                    <span className="font-medium">{formData.emptyWeight || "0"} kg</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Filled Weight:</span>
                    <span className="font-medium">{formData.filledWeight || "0"} kg</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-green-700">Net Weight:</span>
                    <span className="font-bold text-green-700">{netWeight.toFixed(2)} kg</span>
                  </div>

                  {netWeight > 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                      Net weight is automatically calculated as: Filled - Empty
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Available Labour:</span>
                    <span className="font-medium">{labour.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Rooms:</span>
                    <span className="font-medium">{rooms.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
