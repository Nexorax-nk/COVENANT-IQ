"use client";

import { Sidebar } from "@/components/Sidebar"; // Assuming your Sidebar is here

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-50">
      {/* 1. The Sidebar (Fixed Width) */}
      <div className="w-64 shrink-0">
        <Sidebar />
      </div>

      {/* 2. The Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full p-8">
        {children}
      </main>
    </div>
  );
}