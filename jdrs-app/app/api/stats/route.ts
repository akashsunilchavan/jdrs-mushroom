import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const users: any[] = []
const rooms: any[] = []
const labour: any[] = []
const harvesting: any[] = []

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supervisorId = searchParams.get("supervisorId")

    let filteredHarvesting = harvesting
    let filteredLabour = labour

    // Filter by supervisor if provided or if user is supervisor
    if (supervisorId || authResult.user?.role === "supervisor") {
      const targetSupervisorId = supervisorId || authResult.user?.userId
      filteredHarvesting = harvesting.filter((h) => h.supervisorId === targetSupervisorId)
      filteredLabour = labour.filter((l) => l.supervisorId === targetSupervisorId)
    }

    // Calculate statistics
    const today = new Date().toISOString().split("T")[0]
    const todayHarvesting = filteredHarvesting.filter((h) => h.harvestDate === today)

    const stats = {
      totalUsers: authResult.user?.role === "admin" ? users.length : 1,
      totalSupervisors: authResult.user?.role === "admin" ? users.filter((u) => u.role === "supervisor").length : 0,
      totalRooms: rooms.length,
      totalLabour: filteredLabour.length,
      totalHarvesting: filteredHarvesting.length,
      todayHarvesting: todayHarvesting.length,
      todayWeight: todayHarvesting.reduce((sum, h) => sum + h.netWeight, 0),
      totalWeight: filteredHarvesting.reduce((sum, h) => sum + h.netWeight, 0),
      averageWeight:
        filteredHarvesting.length > 0
          ? filteredHarvesting.reduce((sum, h) => sum + h.netWeight, 0) / filteredHarvesting.length
          : 0,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
