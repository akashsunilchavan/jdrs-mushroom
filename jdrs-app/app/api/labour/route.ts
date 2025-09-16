import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const labour: any[] = []

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supervisorId = searchParams.get("supervisorId")

    let filteredLabour = labour

    // Filter by supervisor if provided
    if (supervisorId) {
      filteredLabour = labour.filter((l) => l.supervisorId === supervisorId)
    }

    // Supervisors can only see their own labour
    if (authResult.user?.role === "supervisor") {
      filteredLabour = labour.filter((l) => authResult.user && l.supervisorId === authResult.user.userId)
    }

    return NextResponse.json({
      success: true,
      labour: filteredLabour,
    })
  } catch (error) {
    console.error("Get labour error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    // Only supervisors can create labour
    if (authResult.user?.role !== "supervisor") {
      return NextResponse.json({ success: false, error: "Only supervisors can add labour" }, { status: 403 })
    }

    const labourData = await request.json()
    const { firstName, lastName, contact, address, document } = labourData

    // Validation
    if (!firstName || !lastName || !contact) {
      return NextResponse.json(
        { success: false, error: "First name, last name, and contact are required" },
        { status: 400 },
      )
    }

    // Create new labour
    const newLabour = {
      id: `labour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      contact,
      address: address || null,
      document: document || null,
      supervisorId: authResult.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    labour.push(newLabour)

    return NextResponse.json({
      success: true,
      labour: newLabour,
    })
  } catch (error) {
    console.error("Create labour error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
