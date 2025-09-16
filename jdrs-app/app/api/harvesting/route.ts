import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const harvesting: any[] = []

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supervisorId = searchParams.get("supervisorId")
    const labourId = searchParams.get("labourId")
    const roomId = searchParams.get("roomId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let filteredHarvesting = harvesting

    // Apply filters
    if (supervisorId) {
      filteredHarvesting = filteredHarvesting.filter((h) => h.supervisorId === supervisorId)
    }

    if (labourId) {
      filteredHarvesting = filteredHarvesting.filter((h) => h.labourId === labourId)
    }

    if (roomId) {
      filteredHarvesting = filteredHarvesting.filter((h) => h.roomId === roomId)
    }

    if (startDate) {
      filteredHarvesting = filteredHarvesting.filter((h) => h.harvestDate >= startDate)
    }

    if (endDate) {
      filteredHarvesting = filteredHarvesting.filter((h) => h.harvestDate <= endDate)
    }

    // Supervisors can only see their own harvesting data
    if (authResult.user?.role === "supervisor") {
      filteredHarvesting = filteredHarvesting.filter((h) => authResult.user && h.supervisorId === authResult.user.userId)
    }

    return NextResponse.json({
      success: true,
      harvesting: filteredHarvesting,
    })
  } catch (error) {
    console.error("Get harvesting error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    // Only supervisors can create harvesting records
    if (authResult.user?.role !== "supervisor") {
      return NextResponse.json({ success: false, error: "Only supervisors can add harvesting data" }, { status: 403 })
    }

    const harvestingData = await request.json()
    const { labourId, roomId, emptyWeight, filledWeight, notes, harvestDate } = harvestingData

    // Validation
    if (!labourId || !roomId || emptyWeight === undefined || filledWeight === undefined) {
      return NextResponse.json({ success: false, error: "Labour, room, and weights are required" }, { status: 400 })
    }

    if (filledWeight <= emptyWeight) {
      return NextResponse.json(
        { success: false, error: "Filled weight must be greater than empty weight" },
        { status: 400 },
      )
    }

    // Create new harvesting record
    const newHarvesting = {
      id: `harvest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      labourId,
      roomId,
      supervisorId: authResult.user.userId,
      emptyWeight: Number.parseFloat(emptyWeight),
      filledWeight: Number.parseFloat(filledWeight),
      netWeight: Number.parseFloat(filledWeight) - Number.parseFloat(emptyWeight),
      notes: notes || null,
      harvestDate: harvestDate || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    harvesting.push(newHarvesting)

    return NextResponse.json({
      success: true,
      harvesting: newHarvesting,
    })
  } catch (error) {
    console.error("Create harvesting error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
