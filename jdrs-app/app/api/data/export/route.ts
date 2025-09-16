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

    // Only admins can export all data
    if (authResult.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Export all data (excluding passwords)
    const exportData = {
      users: users.map(({ password, ...user }) => user),
      rooms,
      labour,
      harvesting,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: authResult.user.email,
        totalRecords: users.length + rooms.length + labour.length + harvesting.length,
      },
    }

    return NextResponse.json({
      success: true,
      ...exportData,
    })
  } catch (error) {
    console.error("Export data error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
