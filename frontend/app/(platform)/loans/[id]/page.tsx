"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Download, FileText, ShieldAlert, 
  Loader2, Mail, UploadCloud, File as FileIcon, AlertCircle, TrendingUp, AlertTriangle, CheckCircle2,
  PieChart, Activity, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from "recharts";

// --- TYPES ---
interface Loan {
  id: number;
  borrower_name: string;
  loan_amount: string;
  effective_date: string;
  risk_status: "Healthy" | "Watchlist" | "Critical";
  covenants_json: string;
}

interface EnrichedCovenant {
  name: string;
  threshold: string;
  operator: string;
  confidence: string;
  actualValue: string;
  status: "Safe" | "Warning" | "Breach";
  variance: string;
}

interface EnrichedObligation {
  id: number;
  name: string;
  frequency: string;
  dueDate: string;
  status: "complete" | "pending" | "overdue";
  threshold_days: string;
}

interface DocFile {
  id: number;
  name: string;
  type: string;
  date: string;
  status: "verified" | "pending";
}

interface ChartPoint {
  quarter: string;
  actual: number;
  limit: number;
}

// --- COMPACT TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const limit = payload[0].payload.limit;
    const isBreach = value > limit;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-zinc-200 shadow-xl rounded-lg outline-none min-w-37.5">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xl font-bold ${isBreach ? 'text-red-600' : 'text-zinc-900'}`}>{value.toFixed(2)}x</span>
          {isBreach ? (
            <Badge variant="destructive" className="h-5 text-[9px] px-1.5 rounded-sm">Breach</Badge>
          ) : (
            <Badge variant="outline" className="h-5 text-[9px] px-1.5 rounded-sm text-green-600 bg-green-50 border-green-200">Safe</Badge>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-dashed border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400">
          <span>Covenant Limit</span>
          <span className="font-medium text-zinc-600">{limit.toFixed(2)}x</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function LoanDetailsPage() {
  const params = useParams();
  const loanId = params.id as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [financialCovenants, setFinancialCovenants] = useState<EnrichedCovenant[]>([]);
  const [reportingObligations, setReportingObligations] = useState<EnrichedObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  
  // File Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingObligationId, setUploadingObligationId] = useState<number | null>(null);

  const [documents, setDocuments] = useState<DocFile[]>([
    { id: 1, name: "Executed_Facility_Agreement.pdf", type: "Contract", date: "2023-11-01", status: "verified" },
  ]);

  // --- CHART DATA GENERATOR (The Logic Fix) ---
  const generateDynamicChartData = (status: string): ChartPoint[] => {
    // Base logic: 
    // Healthy = Low & Stable (2.0 -> 2.5)
    // Watchlist = Trending Up (3.0 -> 3.8)
    // Critical = Breach (3.5 -> 4.5)
    
    const quarters = ["Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025 (Proj)", "Q4 2025 (Proj)"];
    const limit = 4.0;
    
    return quarters.map((q, i) => {
      let actual = 0;
      const noise = Math.random() * 0.2; // Add some randomness

      if (status === "Critical") {
        // Start high, end very high
        actual = 3.5 + (i * 0.25) + noise; 
      } else if (status === "Watchlist") {
        // Start medium, end close to limit
        actual = 3.0 + (i * 0.15) + noise;
      } else {
        // Healthy: Start low, stay low
        actual = 2.0 + (i * 0.05) + noise;
      }

      return { quarter: q, actual: actual, limit: limit };
    });
  };

  // 1. FETCH & PROCESS DATA
  useEffect(() => {
    async function fetchLoanDetails() {
      if (!loanId) return;
      try {
        const res = await fetch(`http://localhost:8000/api/loans/${loanId}`);
        if (!res.ok) throw new Error("Loan not found");
        
        const data: Loan = await res.json();
        setLoan(data);
        
        // Generate specific chart data based on the fetched status
        setChartData(generateDynamicChartData(data.risk_status));

        try {
          const rawCovenants = JSON.parse(data.covenants_json);
          const financials: EnrichedCovenant[] = [];
          const reports: EnrichedObligation[] = [];

          rawCovenants.forEach((cov: any, index: number) => {
            const lowerName = cov.name.toLowerCase();
            
            if (lowerName.includes("reporting") || lowerName.includes("financials") || lowerName.includes("statement")) {
              reports.push({
                id: index, 
                name: cov.name,
                frequency: lowerName.includes("quarter") ? "Quarterly" : "Annual",
                dueDate: "2025-10-15",
                status: Math.random() > 0.5 ? "pending" : "overdue",
                threshold_days: cov.threshold
              });
            } else {
              const isRatio = cov.threshold.includes("x") || cov.threshold.includes(":");
              const limitVal = parseFloat(cov.threshold.replace(/[^0-9.]/g, '')) || 0;
              
              let actualVal = 0;
              let status: "Safe" | "Warning" | "Breach" = "Safe";
              
              // Ensure table values match the chart "vibes"
              if (data.risk_status === "Critical") {
                actualVal = cov.operator.includes("<") ? limitVal + 0.25 : limitVal - 0.2;
                status = "Breach";
              } else if (data.risk_status === "Watchlist") {
                actualVal = cov.operator.includes("<") ? limitVal - 0.1 : limitVal + 0.1;
                status = "Warning";
              } else {
                actualVal = cov.operator.includes("<") ? limitVal - 1.5 : limitVal + 1.5;
                status = "Safe";
              }

              financials.push({
                name: cov.name,
                threshold: cov.threshold,
                operator: cov.operator,
                confidence: cov.confidence,
                actualValue: isRatio ? `${actualVal.toFixed(2)}x` : `${actualVal.toFixed(1)}M`,
                status: status,
                variance: `${Math.abs(limitVal - actualVal).toFixed(2)} margin`
              });
            }
          });

          setFinancialCovenants(financials);
          setReportingObligations(reports);

        } catch (e) { console.error(e); }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchLoanDetails();
  }, [loanId]);

  // ACTIONS
  const handleExport = () => {
    if (!loan) return;
    alert(`Downloading Audit Log for ${loan.borrower_name}...`);
  };

  const handleContact = () => {
    if (!loan) return;
    window.location.href = `mailto:finance@${loan.borrower_name.replace(/\s/g, '').toLowerCase()}.com`;
  };

  const handleVaultUpload = () => {
    setUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setUploadProgress(0);
        setDocuments(prev => [{
          id: Date.now(),
          name: "Q4_Financials_Draft.pdf",
          type: "Financials",
          date: new Date().toISOString().split('T')[0],
          status: "pending"
        }, ...prev]);
        alert("Document securely uploaded to vault!");
      }
    }, 150);
  };

  const handleObligationUpload = (id: number) => {
    setUploadingObligationId(id);
    setTimeout(() => {
      setReportingObligations(prev => prev.map(item => {
        if (item.id === id) return { ...item, status: "complete" };
        return item;
      }));
      setUploadingObligationId(null);
      setDocuments(prev => [{
        id: Date.now(),
        name: "Compliance_Proof_Upload.pdf",
        type: "Compliance",
        date: new Date().toISOString().split('T')[0],
        status: "verified"
      }, ...prev]);
    }, 1500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
  if (!loan) return <div className="p-8 text-center">Loan not found</div>;

  // Determine Chart Colors based on Status
  const chartColor = loan.risk_status === "Critical" ? "#DC2626" : loan.risk_status === "Watchlist" ? "#CA8A04" : "#16A34A";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/loans">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{loan.borrower_name}</h1>
              <Badge className={`
                ${loan.risk_status === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 
                  loan.risk_status === 'Watchlist' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                  'bg-green-100 text-green-700 border-green-200'} px-2.5 py-0.5
              `}>
                {loan.risk_status === 'Critical' && <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />} 
                {loan.risk_status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> ID: #{loan.id}</span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span>{loan.loan_amount}</span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span>Effective: {loan.effective_date}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="text-zinc-600" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Audit Log
            </Button>
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white" onClick={handleContact}>
              <Mail className="mr-2 h-4 w-4" /> Email Borrower
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-zinc-200 w-full justify-start h-auto p-0 space-x-8 rounded-none">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3 font-medium">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3 font-medium">Performance Analysis</TabsTrigger>
          <TabsTrigger value="obligations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3 font-medium">Compliance Schedule</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3 font-medium">Document Vault</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: OVERVIEW (Summary) --- */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI Cards */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-500">Active Covenants</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{financialCovenants.length} Financial</div>
                    <p className="text-xs text-zinc-500 mt-1">{reportingObligations.length} Reporting</p>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-500">Next Review</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-zinc-400"/> Oct 15, 2025</div>
                    <p className="text-xs text-zinc-500 mt-1">12 days remaining</p>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-500">Risk Score</CardTitle></CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${loan.risk_status === 'Critical' ? 'text-red-600' : 'text-zinc-900'}`}>
                        {loan.risk_status === 'Critical' ? 'High Risk' : loan.risk_status === 'Watchlist' ? 'Medium Risk' : 'Low Risk'}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">AI Calculated</p>
                </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <h3 className="font-semibold text-zinc-900 mt-4">Financial Covenants Snapshot</h3>
             {financialCovenants.map((cov, i) => (
                 <Card key={i} className={`shadow-sm border-l-4 ${
                    cov.status === 'Breach' ? 'border-l-red-600 bg-red-50/20' : 
                    cov.status === 'Warning' ? 'border-l-yellow-500 bg-yellow-50/20' : 
                    'border-l-green-600 bg-white'
                 }`}>
                   <CardContent className="p-5 flex items-center justify-between">
                     <div>
                        <span className="font-semibold text-zinc-900 block">{cov.name}</span>
                        <span className="text-xs text-zinc-500">Target: {cov.operator} {cov.threshold}</span>
                     </div>
                     <div className="text-right">
                        <span className="block text-2xl font-bold text-zinc-900">{cov.actualValue}</span>
                        <Badge variant="outline" className={`${cov.status === 'Breach' ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}>
                            {cov.status}
                        </Badge>
                     </div>
                   </CardContent>
                 </Card>
             ))}
          </div>
        </TabsContent>

        {/* --- TAB 2: PERFORMANCE (The Chart) --- */}
        <TabsContent value="performance" className="mt-6">
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-zinc-500"/> Covenant Trend Analysis
                </CardTitle>
                <CardDescription>
                    Historical and projected performance for <strong>Net Leverage Ratio</strong> (Debt / EBITDA).
                    <br/>
                    <span className="text-xs text-zinc-400">Showing data for Facility B covenants against the 4.00x threshold.</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-112.5 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis 
                        dataKey="quarter" 
                        stroke="#71717A" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={15}
                      />
                      <YAxis 
                        stroke="#71717A" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `${value}x`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }} />
                      
                      <ReferenceLine 
                        y={4.0} 
                        stroke="#DC2626" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Default Limit (4.0x)', fill: '#DC2626', fontSize: 12, position: 'insideTopRight' }} 
                      />
                      
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke={chartColor} 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorActual)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 3: COMPLIANCE SCHEDULE --- */}
        <TabsContent value="obligations" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Reporting Obligations</CardTitle>
              <CardDescription>Upcoming and past due compliance items.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-left">
                    <tr>
                      <th className="p-4 font-medium text-zinc-500">Obligation</th>
                      <th className="p-4 font-medium text-zinc-500">Frequency</th>
                      <th className="p-4 font-medium text-zinc-500">Rule</th>
                      <th className="p-4 font-medium text-zinc-500">Status</th>
                      <th className="p-4 font-medium text-zinc-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reportingObligations.length === 0 && <tr><td colSpan={5} className="p-4 text-center">No items found.</td></tr>}
                    {reportingObligations.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-4 font-medium text-zinc-900">{item.name}</td>
                        <td className="p-4 text-zinc-500">{item.frequency}</td>
                        <td className="p-4 text-zinc-900 font-mono text-xs">{item.threshold_days}</td>
                        <td className="p-4">
                          <Badge className={`${item.status === 'overdue' ? 'bg-red-100 text-red-700' : item.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                           {item.status === 'complete' ? (
                              <span className="text-green-600 flex justify-end gap-1"><CheckCircle2 className="h-4 w-4"/> Done</span>
                           ) : (
                              <Button size="sm" variant="outline" onClick={() => handleObligationUpload(item.id)} disabled={uploadingObligationId === item.id}>
                                {uploadingObligationId === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Upload"}
                              </Button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 4: DOCUMENTS --- */}
        <TabsContent value="documents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-dashed border-2 border-zinc-200 bg-zinc-50/50 cursor-pointer hover:bg-zinc-50" onClick={handleVaultUpload}>
              <CardContent className="flex flex-col items-center justify-center h-60 text-center">
                {uploading ? (
                  <><Loader2 className="h-10 w-10 text-red-600 animate-spin"/><p className="text-sm mt-2">Uploading...</p></>
                ) : (
                  <><UploadCloud className="h-10 w-10 text-zinc-400"/><p className="text-sm mt-2 font-medium">Upload Document</p></>
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Vault</CardTitle></CardHeader>
              <CardContent>
                {documents.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 hover:bg-zinc-50 border-b last:border-0">
                        <div className="flex gap-3 items-center">
                            <div className="h-10 w-10 bg-red-50 rounded flex items-center justify-center"><FileIcon className="text-red-600 h-5 w-5"/></div>
                            <div><p className="text-sm font-medium">{doc.name}</p><p className="text-xs text-zinc-500">{doc.date}</p></div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Verified</Badge>
                    </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}