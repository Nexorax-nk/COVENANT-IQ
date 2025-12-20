"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, PieChart, UploadCloud, Settings, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Loan Portfolio", href: "/loans" },
  { icon: UploadCloud, label: "Analyze Agreement", href: "/upload" },
  { icon: PieChart, label: "Reports", href: "/reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-zinc-950 text-white flex flex-col fixed left-0 top-0 border-r border-zinc-800">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-2 border-b border-zinc-800">
        <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">Covenant IQ</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-red-600 text-white shadow-md shadow-red-900/20" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-800">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}