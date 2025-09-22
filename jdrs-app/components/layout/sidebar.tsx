"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Home,
  Users,
  Building,
  BarChart3,
  Calendar,
  UserPlus,
  ClipboardList,
  Filter,
  LogOut,
  Database,
  RefreshCw,
  ChevronRight,
  Settings,
  Bell,
} from "lucide-react";
import { authService, type User } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: User;
}

const adminNavItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Overview & analytics",
    badge: null,
  },
  {
    href: "/admin/supervisors/add",
    label: "Add Supervisor",
    icon: UserPlus,
    description: "Create supervisor account",
    badge: null,
  },
  {
    href: "/admin/rooms/add",
    label: "Add Room",
    icon: Building,
    description: "Setup new rooms",
    badge: null,
  },
  {
    href: "/admin/harvesting/total",
    label: "Total Harvesting",
    icon: BarChart3,
    description: "All harvest data",
    badge: null,
  },
  {
    href: "/admin/harvesting/today",
    label: "Today's Harvest",
    icon: Calendar,
    description: "Current day results",
    badge: "Live",
  },
  {
    href: "/admin/supervisors",
    label: "Supervisors",
    icon: Users,
    description: "Manage team leads",
    badge: null,
  },
 
 
];

const supervisorNavItems = [
  {
    href: "/supervisor/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Your overview",
    badge: null,
  },
  {
    href: "/supervisor/labour/add",
    label: "Add Labour",
    icon: UserPlus,
    description: "Register new worker",
    badge: null,
  },
  {
    href: "/supervisor/harvesting/fill",
    label: "Fill Harvesting",
    icon: ClipboardList,
    description: "Record harvest data",
    badge: "Active",
  },
  {
    href: "/supervisor/harvesting/filters",
    label: "Harvesting Filters",
    icon: Filter,
    description: "View & filter records",
    badge: null,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = user.role === "admin" ? adminNavItems : supervisorNavItems;

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.warn("No auth token found, redirecting...");
        router.push("/");
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // send token
        },
      });

      const data = await response.json();
      console.log("Logout response:", data);

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

     
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      router.push("/");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/image.webp"
            alt="JDRS Logo"
            width={96}
            height={80}
            className="rounded-md ml-24"
          />
         
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto w-32 md:w-80">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative",
                  "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-500/25"
                    : "text-slate-900 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-white/20"
                      : "bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "text-xs px-2 py-0.5",
                          isActive
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs mt-0.5 truncate",
                      isActive
                        ? "text-white/80"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-white/60 translate-x-1"
                      : "text-slate-400 opacity-0 group-hover:opacity-100"
                  )}
                />
              </Link>
            );
          })}
        </div>

       
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
       
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 bg-transparent border-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>
    </>
  );
}
