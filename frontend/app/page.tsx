"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, AlertTriangle, CheckCircle2, FileWarning, FileText, Loader2, Check } from "lucide-react";
import Link from "next/link";

interface Loan {
  id: number;
  borrower_name: string;
  loan_amount: string;
  effective_date: string;
  risk_status: "Healthy" | "Watchlist" | "Critical";
  covenants_json: string;
}

interface Alert {
  id: number;
  message: string;
  type: "critical" | "warning";
  timestamp: string;
}

export default function Dashboard() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    activeLoans: 0,
    totalCovenants: 0,
    pendingReviews: 0,
    criticalBreaches: 0
  });

  const [criticalLoans, setCriticalLoans] = useState<Loan[]>([]);
  const [watchlistLoans, setWatchlistLoans] = useState<Loan[]>([]);

  // 1. FETCH DATA
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8000/api/loans");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Loan[] = await res.json();
        setLoans(data);
      } catch (error) {
        console.error("Error fetching loans:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 2. RE-CALCULATE STATS & ALERTS WHENEVER DATA CHANGES
  useEffect(() => {
    if (loans.length === 0) return;

    let covCount = 0;
    let critical = 0;
    let watchlist = 0;
    const newAlerts: Alert[] = [];

    loans.forEach((loan) => {
      // Stats
      if (loan.risk_status === "Critical") critical++;
      if (loan.risk_status === "Watchlist") watchlist++;
      try {
        const covenants = JSON.parse(loan.covenants_json);
        covCount += covenants.length;
      } catch (e) { }

      // Generate Dynamic Alerts
      if (loan.risk_status === "Critical") {
        newAlerts.push({
          id: loan.id,
          message: `${loan.borrower_name}: Financial Covenant Breach Detected`,
          type: "critical",
          timestamp: "Just now"
        });
      } else if (loan.risk_status === "Watchlist") {
        newAlerts.push({
          id: loan.id,
          message: `${loan.borrower_name}: Trending towards threshold limit`,
          type: "warning",
          timestamp: "2 hours ago"
        });
      }
    });

    setStats({
      activeLoans: loans.length,
      totalCovenants: covCount,
      pendingReviews: watchlist,
      criticalBreaches: critical
    });

    setCriticalLoans(loans.filter(l => l.risk_status === "Critical"));
    setWatchlistLoans(loans.filter(l => l.risk_status === "Watchlist"));
    setAlerts(newAlerts.slice(0, 6)); // Show top 6 alerts

  }, [loans]);

  const getRiskScore = (status: string) => {
    if (status === 'Critical') return Math.floor(Math.random() * (99 - 85) + 85);
    if (status === 'Watchlist') return Math.floor(Math.random() * (75 - 55) + 55);
    return Math.floor(Math.random() * (30 - 10) + 10);
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Active Loans" 
          value={loading ? "-" : stats.activeLoans.toString()} 
          trend="Total Portfolio"
          icon={<FileText className="h-5 w-5 text-zinc-500" />} 
        />
        <StatsCard 
          title="Monitored Covenants" 
          value={loading ? "-" : stats.totalCovenants.toString()} 
          trend="Across all agreements" 
          icon={<CheckCircle2 className="h-5 w-5 text-zinc-500" />} 
        />
        <StatsCard 
          title="Pending Reviews" 
          value={loading ? "-" : stats.pendingReviews.toString()} 
          trend="Loans on Watchlist" 
          icon={<ArrowUpRight className="h-5 w-5 text-yellow-600" />} 
          highlight="yellow"
        />
        <StatsCard 
          title="Critical Breaches" 
          value={loading ? "-" : stats.criticalBreaches.toString()} 
          trend="Requires Immediate Action" 
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />} 
          highlight="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INTERACTIVE RISK RADAR */}
        <Card className="col-span-2 border-zinc-200 shadow-sm flex flex-col h-125">
          <Tabs defaultValue="critical" className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  Risk Radar
                </CardTitle>
                <TabsList>
                  <TabsTrigger value="critical">Critical Breaches ({criticalLoans.length})</TabsTrigger>
                  <TabsTrigger value="watchlist">Pending Reviews ({watchlistLoans.length})</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              {loading ? (
                 <div className="flex justify-center p-8 text-zinc-500 items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Data...
                 </div>
              ) : (
                <>
                  {/* TAB 1: CRITICAL */}
                  <TabsContent value="critical" className="h-full overflow-y-auto m-0">
                    <TableContent 
                      data={criticalLoans} 
                      type="critical" 
                      getRiskScore={getRiskScore}
                    />
                  </TabsContent>

                  {/* TAB 2: WATCHLIST (ACTIONABLE) */}
                  <TabsContent value="watchlist" className="h-full overflow-y-auto m-0">
                    <TableContent 
                      data={watchlistLoans} 
                      type="watchlist" 
                      getRiskScore={getRiskScore}
                    />
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>

        {/* DYNAMIC ALERTS FEED */}
        <Card className="border-zinc-200 shadow-sm h-fit max-h-125 overflow-hidden flex flex-col">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-zinc-500" />
              Recent AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-y-auto flex-1">
            <div className="space-y-0 divide-y divide-zinc-100">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-sm">No active alerts. Portfolio is healthy.</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex gap-3 items-start p-4 hover:bg-zinc-50 transition-all">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-600' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 leading-snug">{alert.message}</p>
                      <p className="text-xs text-zinc-500 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="p-3 border-t border-zinc-100 bg-zinc-50/30">
             <Button variant="ghost" size="sm" className="w-full text-zinc-500 h-8 text-xs">View All Notifications</Button>
          </div>
        </Card>

      </div>
    </div>
  );
}

// Sub-component for Table Rows
function TableContent({ data, type, getRiskScore }: any) {
  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
        <CheckCircle2 className="h-8 w-8 opacity-20" />
        <p>No loans in this category.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-zinc-500 font-medium border-b border-zinc-100 bg-zinc-50 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="py-3 pl-6">Borrower</th>
          <th className="py-3">Amount</th>
          <th className="py-3">Risk</th>
          <th className="py-3 pr-6 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {data.map((loan: any) => {
          const riskScore = getRiskScore(loan.risk_status);
          return (
            <tr key={loan.id} className="group hover:bg-zinc-50 transition-colors">
              <td className="py-4 pl-6">
                <p className="font-medium text-zinc-900">{loan.borrower_name}</p>
                <p className="text-xs text-zinc-500">ID: #{loan.id}</p>
              </td>
              <td className="py-4 text-zinc-600">{loan.loan_amount}</td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${type === 'critical' ? 'bg-red-600' : 'bg-yellow-500'}`}
                      style={{ width: `${riskScore}%` }} 
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">{riskScore}</span>
                </div>
              </td>
              <td className="py-4 pr-6 text-right">
                {type === 'watchlist' ? (
                  // FIXED: Now links to the dedicated Review Page
                  <Link href={`/review/${loan.id}`}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                    >
                      <Check className="h-3 w-3 mr-1" /> Review
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/loans/${loan.id}`} className="text-red-600 font-medium hover:underline text-xs">
                    View
                  </Link>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StatsCard({ title, value, trend, icon, highlight }: any) {
  return (
    <Card className={`border-zinc-200 shadow-sm ${highlight === 'red' ? 'border-red-100 bg-red-50/30' : highlight === 'yellow' ? 'border-yellow-100 bg-yellow-50/30' : ''}`}>
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
        <p className={`text-xs mt-2 ${highlight === 'red' ? 'text-red-600 font-medium' : highlight === 'yellow' ? 'text-yellow-700 font-medium' : 'text-zinc-500'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}