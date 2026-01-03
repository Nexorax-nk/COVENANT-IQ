"use client";

import { FileText, Download, Calendar, ShieldCheck, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// MOCK AUDIT DATA
const AUDIT_LOGS = [
  { id: 1, action: "Document Uploaded", detail: "Oceanic_FY24_Financials.pdf", user: "John Doe (Credit Officer)", time: "10 mins ago" },
  { id: 2, action: "AI Extraction Completed", detail: "Extracted 12 covenants from Term Sheet", user: "Covenant IQ System", time: "12 mins ago" },
  { id: 3, action: "Risk Status Change", detail: "Oceanic Shipping marked as 'Critical'", user: "System Alert", time: "2 hours ago" },
  { id: 4, action: "Waiver Approved", detail: "Temp waiver for Leverage Ratio > 4.5x", user: "Sarah Smith (Risk Mgr)", time: "1 day ago" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Compliance & Reports</h1>
        <p className="text-zinc-500 mt-1">Generate regulatory reports and view system audit logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Report Generation */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-zinc-900 text-white border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" /> Generate Report
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Create a consolidated compliance certificate for lenders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase">Select Borrower</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600">
                  <option>Oceanic Shipping Ltd.</option>
                  <option>TechFlow Logistics</option>
                  <option>Alpha Construct Co.</option>
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-medium text-zinc-400 uppercase">Report Type</label>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="border border-red-900/50 bg-red-900/20 p-3 rounded cursor-pointer hover:bg-red-900/30 transition-colors">
                        <p className="font-bold text-sm text-red-200">Compliance Cert</p>
                        <p className="text-xs text-red-300/60 mt-1">Standard LMA</p>
                    </div>
                    <div className="border border-zinc-700 bg-zinc-800/50 p-3 rounded cursor-pointer hover:bg-zinc-800 transition-colors">
                        <p className="font-bold text-sm text-zinc-200">Audit Trail</p>
                        <p className="text-xs text-zinc-500 mt-1">Full History</p>
                    </div>
                 </div>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700 mt-2">
                <Download className="mr-2 h-4 w-4" /> Generate PDF
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Downloads</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
                {[1,2,3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-zinc-100 rounded flex items-center justify-center">
                                <FileText className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-900">Compliance_Q3_Oceanic.pdf</p>
                                <p className="text-xs text-zinc-500">Generated 2 days ago</p>
                            </div>
                        </div>
                        <Download className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600" />
                    </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Audit Log */}
        <div className="md:col-span-2">
          <Card className="h-full border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-zinc-500" /> System Audit Log
                </CardTitle>
                <Badge variant="outline" className="bg-white text-zinc-500 font-normal">
                  <ShieldCheck className="h-3 w-3 mr-1 text-green-600" /> Immutable Ledger
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100">
                {AUDIT_LOGS.map((log) => (
                  <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-zinc-50/50 transition-colors">
                    <div className="mt-1">
                        {log.user === "Covenant IQ System" ? (
                             <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <ShieldCheck className="h-4 w-4 text-purple-600" />
                             </div>
                        ) : log.user === "System Alert" ? (
                             <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <ShieldCheck className="h-4 w-4 text-red-600" />
                             </div>
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-zinc-500" />
                             </div>
                        )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-zinc-900">{log.action}</p>
                        <span className="text-xs text-zinc-400 font-mono">{log.time}</span>
                      </div>
                      <p className="text-sm text-zinc-600 mt-0.5">{log.detail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-500">
                           User: {log.user}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/30 text-center">
                 <Button variant="ghost" className="text-xs text-zinc-500 h-auto p-0 hover:bg-transparent hover:text-red-600 hover:underline">
                    View Full History (Blockchain Verified)
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}