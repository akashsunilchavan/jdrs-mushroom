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
  Wheat,
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
  {
    href: "/admin/storage",
    label: "Storage Management",
    icon: Database,
    description: "Inventory & capacity",
    badge: null,
  },
  {
    href: "/admin/sync",
    label: "Sync Management",
    icon: RefreshCw,
    description: "Data synchronization",
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
    await authService.logout();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div >
            <Image
              src="/logo-final1-removebg-preview.png" // 👈 place logo in /public folder
              alt="JDRS Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              JDRS Mobile
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="text-xs font-medium capitalize"
              >
                {user.role}
              </Badge>
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative",
                    "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                      : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
                        "h-4 w-4 transition-transform group-hover:scale-110",
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
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isActive
                        ? "text-white/60 translate-x-1"
                        : "text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100"
                    )}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-3 flex-col gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Alerts
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-3 flex-col gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Settings
              </span>
            </Button>
          </div>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="mb-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full bg-transparent border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-700 transition-all duration-200"
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
          <Button
            variant="outline"
            size="icon"
            className="md:hidden bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 bg-transparent border-0">
          <div className="h-full border-r border-slate-200 dark:border-slate-700 shadow-2xl">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-900">
        <SidebarContent />
      </div>
    </>
  );
}
