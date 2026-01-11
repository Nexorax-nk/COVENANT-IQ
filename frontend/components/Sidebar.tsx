"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, PieChart, UploadCloud, Settings, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  // FIXED: Points to /dashboard instead of root /
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Loan Portfolio", href: "/loans" },
  { icon: UploadCloud, label: "Analyze Agreement", href: "/upload" },
  { icon: PieChart, label: "Reports", href: "/reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-zinc-950 text-white flex flex-col fixed left-0 top-0 border-r border-zinc-800 z-40">
      
      {/* Logo Area */}
      <Link href="/dashboard">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800 cursor-pointer hover:bg-zinc-900/50 transition-colors">
          <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Covenant IQ</span>
        </div>
      </Link>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 mt-2">
        {menuItems.map((item) => {
          // Logic: If href is /dashboard, exact match. Otherwise, check if path starts with href (e.g. /loans/123)
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-red-600 text-white shadow-md shadow-red-900/20" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-zinc-500 group-hover:text-white")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-800">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
          <Settings className="h-5 w-5 text-zinc-500 group-hover:text-white" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <div className="mt-4 px-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                JD
            </div>
            <div className="text-xs">
                <p className="text-zinc-200 font-medium">John Doe</p>
                <p className="text-zinc-500">Credit Officer</p>
            </div>
        </div>
      </div>
    </div>
  );
}