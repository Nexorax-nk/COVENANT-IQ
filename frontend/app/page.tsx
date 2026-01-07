"use client"; // Add this for now to avoid server component conflicts while building

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, AlertTriangle, CheckCircle2, FileWarning, FileText } from "lucide-react"; // Added FileText
import Link from "next/link";
import { LOANS, ALERTS } from "../lib/data";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Overview of your loan portfolio and risk alerts.</p>
        </div>
        <Link href="/upload">
          <Button className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-200">
            + New Agreement Analysis
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Active Loans" 
          value="124" 
          trend="+4 this month" 
          icon={<FileText className="h-5 w-5 text-zinc-500" />} 
        />
        <StatsCard 
          title="Monitored Covenants" 
          value="850" 
          trend="98% Active" 
          icon={<CheckCircle2 className="h-5 w-5 text-zinc-500" />} 
        />
        <StatsCard 
          title="Pending Reviews" 
          value="12" 
          trend="Due in 7 days" 
          icon={<ArrowUpRight className="h-5 w-5 text-yellow-600" />} 
          highlight="yellow"
        />
        <StatsCard 
          title="Critical Breaches" 
          value="2" 
          trend="Action Required" 
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />} 
          highlight="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Radar */}
        <Card className="col-span-2 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              Risk Radar (Watchlist)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-zinc-500 font-medium border-b border-zinc-100">
                  <tr>
                    <th className="pb-3 pl-2">Borrower</th>
                    <th className="pb-3">Loan Amount</th>
                    <th className="pb-3">Risk Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {/* FIXED: Added type 'any' to loan to stop the error */}
                  {LOANS.map((loan: any) => (
                    <tr key={loan.id} className="group hover:bg-zinc-50 transition-colors">
                      <td className="py-4 pl-2 font-medium text-zinc-900">{loan.borrower}</td>
                      <td className="py-4 text-zinc-600">{loan.amount}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                loan.riskScore > 80 ? 'bg-red-600' : 
                                loan.riskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`} 
                              style={{ width: `${loan.riskScore}%` }} 
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-500">{loan.riskScore}/100</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="outline" className={`
                          ${loan.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                            loan.status === 'Watchlist' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                            'bg-green-50 text-green-700 border-green-200'}
                        `}>
                          {loan.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Link href={`/loans/${loan.id}`} className="text-red-600 font-medium hover:underline text-xs">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Alerts Feed */}
        <Card className="border-zinc-200 shadow-sm h-fit">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-zinc-500" />
              Recent AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* FIXED: Added type 'any' to alert */}
            {ALERTS.map((alert: any) => (
              <div key={alert.id} className="flex gap-3 items-start p-3 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-600' : 'bg-yellow-500'}`} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 leading-snug">{alert.message}</p>
                  <p className="text-xs text-zinc-500 mt-1">Detected 2 hours ago via AI Scan</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2 text-zinc-500 border-dashed border-zinc-300">
              View All Notifications
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Helper Component
function StatsCard({ title, value, trend, icon, highlight }: any) {
  return (
    <Card className={`border-zinc-200 shadow-sm ${highlight === 'red' ? 'border-red-100 bg-red-50/30' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-2">{value}</h3>
          </div>
          <div className="p-2 bg-white rounded-lg border border-zinc-100 shadow-sm">
            {icon}
          </div>
        </div>
        <p className={`text-xs mt-2 ${highlight === 'red' ? 'text-red-600 font-medium' : 'text-zinc-500'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}