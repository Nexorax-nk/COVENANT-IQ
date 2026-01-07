"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, AlertTriangle, CheckCircle2, FileWarning, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

// 1. Define the shape of the Loan object coming from your Python Backend
interface Loan {
  id: number;
  borrower_name: string;
  loan_amount: string;
  effective_date: string;
  risk_status: string;
}

// 2. Hardcoded Alerts (Since we haven't built an Alerts Backend yet)
const MOCK_ALERTS = [
  { id: 1, message: "Oceanic Shipping: Debt-to-EBITDA projected to breach", type: "critical" },
  { id: 2, message: "Alpha Construct: Q3 Financials overdue by 2 days", type: "warning" },
];

export default function Dashboard() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. FETCH DATA FROM REAL BACKEND
  useEffect(() => {
    async function fetchLoans() {
      try {
        const res = await fetch("http://localhost:8000/api/loans");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setLoans(data);
      } catch (error) {
        console.error("Error fetching loans:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLoans();
  }, []);

  // Helper to generate a fake risk score for the UI (since DB doesn't have it yet)
  const getRiskScore = (status: string) => {
    if (status === 'Critical') return 88;
    if (status === 'Watchlist') return 65;
    return 12; // Healthy
  };

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

      {/* KPI Cards (Now Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Active Loans" 
          value={loading ? "-" : loans.length.toString()} 
          trend={loading ? "Loading..." : `+${loans.length} Total`}
          icon={<FileText className="h-5 w-5 text-zinc-500" />} 
        />
        <StatsCard 
          title="Monitored Covenants" 
          value={loading ? "-" : (loans.length * 5).toString()} // Estimating ~5 covenants per loan
          trend="98% Active" 
          icon={<CheckCircle2 className="h-5 w-5 text-zinc-500" />} 
        />
        <StatsCard 
          title="Pending Reviews" 
          value="3" 
          trend="Due in 7 days" 
          icon={<ArrowUpRight className="h-5 w-5 text-yellow-600" />} 
          highlight="yellow"
        />
        <StatsCard 
          title="Critical Breaches" 
          value="1" 
          trend="Action Required" 
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />} 
          highlight="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Radar Table */}
        <Card className="col-span-2 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              Risk Radar (Watchlist)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="flex justify-center p-8 text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Real Data...
               </div>
            ) : (
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
                    {loans.length === 0 ? (
                       <tr><td colSpan={5} className="p-4 text-center text-zinc-400">No loans found. Upload one!</td></tr>
                    ) : (
                      loans.map((loan) => {
                        const riskScore = getRiskScore(loan.risk_status);
                        return (
                          <tr key={loan.id} className="group hover:bg-zinc-50 transition-colors">
                            <td className="py-4 pl-2 font-medium text-zinc-900">{loan.borrower_name}</td>
                            <td className="py-4 text-zinc-600">{loan.loan_amount}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      riskScore > 80 ? 'bg-red-600' : 
                                      riskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} 
                                    style={{ width: `${riskScore}%` }} 
                                  />
                                </div>
                                <span className="text-xs font-medium text-zinc-500">{riskScore}/100</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge variant="outline" className={`
                                ${loan.risk_status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                  loan.risk_status === 'Watchlist' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                  'bg-green-50 text-green-700 border-green-200'}
                              `}>
                                {loan.risk_status}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <Link href={`/portfolio`} className="text-red-600 font-medium hover:underline text-xs">
                                View Details
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Feed (Still Mocked for now) */}
        <Card className="border-zinc-200 shadow-sm h-fit">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-zinc-500" />
              Recent AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {MOCK_ALERTS.map((alert) => (
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

// Helper Component for Stats
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