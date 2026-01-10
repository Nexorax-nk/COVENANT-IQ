"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, AlertTriangle, CheckCircle2, FileWarning, 
  FileText, Loader2, Check, TrendingUp, Activity, Clock, 
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
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
  const [processingId, setProcessingId] = useState<number | null>(null);

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

  // 2. RE-CALCULATE LOGIC
  useEffect(() => {
    if (loans.length === 0) return;

    let covCount = 0;
    let critical = 0;
    let watchlist = 0;
    const newAlerts: Alert[] = [];

    loans.forEach((loan) => {
      if (loan.risk_status === "Critical") critical++;
      if (loan.risk_status === "Watchlist") watchlist++;
      try {
        const covenants = JSON.parse(loan.covenants_json);
        covCount += covenants.length;
      } catch (e) { }

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
    setAlerts(newAlerts.slice(0, 6)); 

  }, [loans]);

  const handleMarkReviewed = async (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setLoans(prev => prev.map(l => l.id === id ? { ...l, risk_status: "Healthy" } : l));
      setProcessingId(null);
    }, 1000); 
  };

  const getRiskScore = (status: string) => {
    if (status === 'Critical') return Math.floor(Math.random() * (99 - 85) + 85);
    if (status === 'Watchlist') return Math.floor(Math.random() * (75 - 55) + 55);
    return Math.floor(Math.random() * (30 - 10) + 10);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Portfolio Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
             <p className="text-zinc-500 text-sm">System Operational • Updated {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <Link href="/upload">
          <Button className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm h-10 px-6">
            + New Analysis
          </Button>
        </Link>
      </div>

      {/* --- KPI GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Exposure" 
          value={loading ? "-" : stats.activeLoans.toString()} 
          subtext="Active Agreements"
          icon={<FileText className="h-4 w-4 text-zinc-500" />} 
        />
        <StatsCard 
          title="Covenants Monitored" 
          value={loading ? "-" : stats.totalCovenants.toString()} 
          subtext="Automated Checks" 
          icon={<Activity className="h-4 w-4 text-zinc-500" />} 
        />
        <StatsCard 
          title="Watchlist Items" 
          value={loading ? "-" : stats.pendingReviews.toString()} 
          subtext="Action Required" 
          icon={<ArrowUpRight className="h-4 w-4 text-amber-600" />} 
          highlight="yellow"
        />
        <StatsCard 
          title="Critical Breaches" 
          value={loading ? "-" : stats.criticalBreaches.toString()} 
          subtext="Immediate Attention" 
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />} 
          highlight="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- RISK RADAR (Left 2/3) --- */}
        <Card className="col-span-2 border-zinc-200 shadow-sm flex flex-col h-137.5 overflow-hidden">
          <Tabs defaultValue="critical" className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
              <div>
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-zinc-500" /> Risk Radar
                </CardTitle>
                <CardDescription className="mt-1 text-xs">Real-time covenant breach detection.</CardDescription>
              </div>
              <TabsList className="bg-zinc-100 p-1 h-9">
                <TabsTrigger value="critical" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm">Critical ({criticalLoans.length})</TabsTrigger>
                <TabsTrigger value="watchlist" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm">Watchlist ({watchlistLoans.length})</TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="flex-1 overflow-hidden p-0 relative bg-white">
              {loading ? (
                 <div className="flex flex-col justify-center items-center h-full text-zinc-400 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin" /> 
                    <span className="text-sm">Syncing portfolio data...</span>
                 </div>
              ) : (
                <>
                  <TabsContent value="critical" className="h-full overflow-y-auto m-0">
                    <TableContent 
                      data={criticalLoans} 
                      type="critical" 
                      getRiskScore={getRiskScore}
                    />
                  </TabsContent>

                  <TabsContent value="watchlist" className="h-full overflow-y-auto m-0">
                    <TableContent 
                      data={watchlistLoans} 
                      type="watchlist" 
                      getRiskScore={getRiskScore}
                      onReview={handleMarkReviewed}
                      processingId={processingId}
                    />
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>

        {/* --- INTELLIGENCE FEED (Right 1/3) --- */}
        <Card className="border-zinc-200 shadow-sm h-137.5 flex flex-col bg-zinc-50/50">
          <CardHeader className="bg-white border-b border-zinc-100 py-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-zinc-500" /> Live Intelligence
            </CardTitle>
            <CardDescription className="text-xs">AI-driven event stream.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            <div className="divide-y divide-zinc-100">
              {alerts.length === 0 ? (
                <div className="p-10 text-center text-zinc-400 text-sm">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No active alerts.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-white transition-colors group cursor-pointer">
                    <div className="flex gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 shadow-sm ${alert.type === 'critical' ? 'bg-red-500 shadow-red-200' : 'bg-amber-500 shadow-amber-200'}`} />
                        <div>
                            <div className="flex justify-between items-start w-full">
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded border ${
                                    alert.type === 'critical' 
                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    {alert.type}
                                </span>
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {alert.timestamp}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-zinc-900 mt-1 leading-snug group-hover:text-blue-600 transition-colors">
                                {alert.message}
                            </p>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="p-3 border-t border-zinc-100 bg-white">
             <Button variant="outline" size="sm" className="w-full text-xs h-8">View Full Audit Log</Button>
          </div>
        </Card>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TableContent({ data, type, getRiskScore, onReview, processingId }: any) {
  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
        <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-zinc-300" />
        </div>
        <p className="text-sm">No loans in this category.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs font-semibold text-zinc-500 bg-zinc-50/80 sticky top-0 z-10 uppercase tracking-wider backdrop-blur-sm border-b border-zinc-100">
        <tr>
          <th className="py-3 pl-6">Borrower</th>
          <th className="py-3">Commitment</th>
          <th className="py-3">Risk Score</th>
          <th className="py-3 pr-6 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-50">
        {data.map((loan: any) => {
          const riskScore = getRiskScore(loan.risk_status);
          return (
            <tr key={loan.id} className="group hover:bg-zinc-50/80 transition-colors">
              <td className="py-4 pl-6">
                <p className="font-semibold text-zinc-900 text-sm">{loan.borrower_name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">REF-{loan.id.toString().padStart(4, '0')}</p>
              </td>
              <td className="py-4 text-zinc-600 font-medium">{loan.loan_amount}</td>
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${type === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${riskScore}%` }} 
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-700">{riskScore}/100</span>
                </div>
              </td>
              <td className="py-4 pr-6 text-right">
                {type === 'watchlist' ? (
                  <Link href={`/review/${loan.id}`}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 shadow-sm"
                      disabled={processingId === loan.id}
                    >
                      {processingId === loan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Review Case"}
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/loans/${loan.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-zinc-500 hover:text-zinc-900">
                        View <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
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

function StatsCard({ title, value, subtext, icon, highlight }: any) {
  return (
    <Card className={`border shadow-sm transition-all hover:shadow-md ${highlight === 'red' ? 'border-red-100 bg-red-50/20' : highlight === 'yellow' ? 'border-amber-100 bg-amber-50/20' : 'border-zinc-200 bg-white'}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</p>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold tracking-tight ${highlight === 'red' ? 'text-red-700' : highlight === 'yellow' ? 'text-amber-700' : 'text-zinc-900'}`}>{value}</h3>
        </div>
        <p className={`text-xs mt-1 ${highlight === 'red' ? 'text-red-600/80' : highlight === 'yellow' ? 'text-amber-600/80' : 'text-zinc-400'}`}>
          {subtext}
        </p>
      </CardContent>
    </Card>
  )
}