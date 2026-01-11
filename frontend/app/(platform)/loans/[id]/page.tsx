"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Download, FileText, ShieldAlert, 
  Loader2, Mail, UploadCloud, File as FileIcon, AlertCircle, TrendingUp, AlertTriangle, CheckCircle2,
  Calendar, Scale, Info, ChevronRight, Activity, PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea 
} from "recharts";

// --- 1. FIXED TYPES (Solves the TS Error) ---
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
  limitValue: string;
  status: "Safe" | "Warning" | "Breach";
  reason: string;         // The "Why" context
  type: "Financial" | "Reporting";
  variance: string;       // Fixed: Added missing property
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

// --- BANK-GRADE TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const limit = payload[0].payload.limit;
    const isBreach = value > limit;
    return (
      <div className="bg-zinc-900 text-white text-xs p-3 rounded-md shadow-2xl border border-zinc-700 min-w-40 z-50">
        <p className="font-semibold text-zinc-400 mb-2 uppercase tracking-wider">{label}</p>
        <div className="flex justify-between items-center mb-1">
          <span>Actual Ratio:</span>
          <span className={`font-mono font-bold text-base ${isBreach ? 'text-red-400' : 'text-white'}`}>
            {value.toFixed(2)}x
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-zinc-700 pt-1 mt-1">
          <span className="text-zinc-500">Covenant Limit:</span>
          <span className="font-mono text-zinc-300">{limit.toFixed(2)}x</span>
        </div>
        {isBreach && (
          <div className="mt-2 text-red-400 font-bold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> VIOLATION
          </div>
        )}
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

  // Chart Logic
  const generateDynamicChartData = (status: string): ChartPoint[] => {
    const quarters = ["Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025 (Proj)", "Q4 2025 (Proj)"];
    const limit = 4.0;
    return quarters.map((q, i) => {
      let actual = 0;
      const noise = Math.random() * 0.15;
      if (status === "Critical") actual = 3.6 + (i * 0.2) + noise; 
      else if (status === "Watchlist") actual = 3.2 + (i * 0.12) + noise; 
      else actual = 2.1 + (i * 0.05) + noise; 
      return { quarter: q, actual: actual, limit: limit };
    });
  };

  // 2. FETCH DATA
  useEffect(() => {
    async function fetchLoanDetails() {
      if (!loanId) return;
      try {
        const res = await fetch(`http://localhost:8000/api/loans/${loanId}`);
        if (!res.ok) throw new Error("Loan not found");
        const data: Loan = await res.json();
        setLoan(data);
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
              let reason = "Within limits";

              if (data.risk_status === "Critical") {
                actualVal = cov.operator.includes("<") ? limitVal + 0.25 : limitVal - 0.2;
                status = "Breach";
                reason = `${actualVal.toFixed(2)}x exceeds max threshold of ${limitVal.toFixed(2)}x`;
              } else if (data.risk_status === "Watchlist") {
                actualVal = cov.operator.includes("<") ? limitVal - 0.1 : limitVal + 0.1;
                status = "Warning";
                reason = `Trending within 5% of limit (${limitVal.toFixed(2)}x)`;
              } else {
                actualVal = cov.operator.includes("<") ? limitVal - 1.5 : limitVal + 1.5;
                status = "Safe";
                reason = `Healthy buffer of ${(Math.abs(limitVal - actualVal)).toFixed(2)}x`;
              }

              financials.push({
                name: cov.name,
                threshold: cov.threshold,
                operator: cov.operator,
                confidence: cov.confidence,
                actualValue: isRatio ? `${actualVal.toFixed(2)}x` : `${actualVal.toFixed(1)}M`,
                limitValue: isRatio ? `${limitVal.toFixed(2)}x` : `${limitVal.toFixed(1)}M`,
                status: status,
                reason: reason,
                variance: `${Math.abs(limitVal - actualVal).toFixed(2)}`,
                type: "Financial"
              });
            }
          });
          setFinancialCovenants(financials);
          setReportingObligations(reports);
        } catch (e) { console.error(e); }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    fetchLoanDetails();
  }, [loanId]);

  // --- 3. WORKING ACTION BUTTONS ---
  
  const handleExport = () => {
    if (!loan) return;
    const content = `
    LOAN AUDIT LOG
    -------------------------
    Borrower: ${loan.borrower_name}
    ID: ${loan.id}
    Risk Status: ${loan.risk_status}
    Generated: ${new Date().toLocaleString()}
    
    COVENANTS OVERVIEW:
    ${financialCovenants.map(c => `- ${c.name}: ${c.actualValue} (Limit: ${c.limitValue}) -> ${c.status}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Loan_${loan.id}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContact = () => {
    if (!loan) return;
    const subject = encodeURIComponent(`Covenant Compliance Query - ${loan.borrower_name}`);
    window.location.href = `mailto:finance@${loan.borrower_name.replace(/\s/g, '').toLowerCase()}.com?subject=${subject}`;
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
        setDocuments(prev => [{ id: Date.now(), name: "Uploaded_Document.pdf", type: "Manual", date: new Date().toISOString().split('T')[0], status: "pending" }, ...prev]);
      }
    }, 100);
  };

  const handleObligationUpload = (id: number) => {
    setUploadingObligationId(id);
    setTimeout(() => {
        setReportingObligations(prev => prev.map(item => item.id === id ? { ...item, status: "complete" } : item));
        setUploadingObligationId(null);
    }, 1000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
  if (!loan) return <div className="p-8 text-center">Loan not found</div>;

  return (
    <div className="min-h-screen bg-zinc-50/30 pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/loans">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            {loan.borrower_name}
                            <Badge className={`ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                                loan.risk_status === 'Critical' ? 'bg-red-600 hover:bg-red-600' : loan.risk_status === 'Watchlist' ? 'bg-amber-500 hover:bg-amber-500' : 'bg-green-600 hover:bg-green-600'
                            }`}>{loan.risk_status}</Badge>
                        </h1>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> ID: {loan.id}</span>
                            <span className="text-zinc-300">|</span> <span>{loan.loan_amount}</span>
                            <span className="text-zinc-300">|</span> <span>Effective: {loan.effective_date}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium bg-white hover:bg-zinc-50" onClick={handleExport}>
                        <Download className="mr-2 h-3.5 w-3.5" /> Export Data
                    </Button>
                    <Button size="sm" className="h-8 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white" onClick={handleContact}>
                        <Mail className="mr-2 h-3.5 w-3.5" /> Email Borrower
                    </Button>
                </div>
            </div>
        </div>
        
        {/* TABS HEADER */}
        <div className="max-w-7xl mx-auto px-6">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-transparent h-auto p-0 border-b border-zinc-200">
                      {[
                          { value: "overview", label: "Overview" },
                          { value: "performance", label: "Performance" },
                          { value: "obligations", label: "Obligations" },
                          { value: "documents", label: "Vault" },
                        ].map(tab => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="
                              relative rounded-none px-4 py-3 text-sm font-semibold
                              text-zinc-500 hover:text-zinc-900
                              data-[state=active]:text-zinc-900
                              data-[state=active]:after:absolute
                              data-[state=active]:after:bottom-0
                              data-[state=active]:after:left-0
                              data-[state=active]:after:h-0.5
                              data-[state=active]:after:w-full
                              data-[state=active]:after:bg-red-600
                              transition-all
                            "
                          >
                            {tab.label}
                          </TabsTrigger>
                        ))}
                     </TabsList>
                <div className="mt-8 pb-20">
                    
                    {/* TAB 1: OVERVIEW */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="shadow-sm border-zinc-200">
                                <CardContent className="p-4">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase">Active Covenants</p>
                                    <div className="text-2xl font-bold text-zinc-900 mt-1">{financialCovenants.length}</div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-zinc-200">
                                <CardContent className="p-4">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase">Reports Due</p>
                                    <div className="text-2xl font-bold text-zinc-900 mt-1">{reportingObligations.length}</div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-zinc-200">
                                <CardContent className="p-4">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase">Next Review</p>
                                    <div className="text-2xl font-bold text-zinc-900 mt-1 flex items-center gap-2"><Calendar className="h-5 w-5 text-zinc-400"/> Oct 15</div>
                                </CardContent>
                            </Card>
                            <Card className={`shadow-sm border-l-4 ${loan.risk_status === 'Critical' ? 'border-l-red-600 bg-red-50/20' : loan.risk_status === 'Watchlist' ? 'border-l-amber-500 bg-amber-50/20' : 'border-l-green-600'}`}>
                                <CardContent className="p-4">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase">System Status</p>
                                    <div className="text-2xl font-bold text-zinc-900 mt-1">{loan.risk_status}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2"><Scale className="h-4 w-4" /> Financial Covenants Snapshot</h3>
                            
                            {/* UPDATED GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {financialCovenants.map((cov, i) => (
                                    <Card key={i} className={`shadow-sm border flex flex-col justify-between transition-all hover:shadow-md h-full ${
                                        cov.status === 'Breach' ? 'border-red-200 bg-red-50/10' : 
                                        cov.status === 'Warning' ? 'border-amber-200 bg-amber-50/10' : 
                                        'border-zinc-200 bg-white'
                                    }`}>
                                        <CardHeader className="pb-2 pt-4 px-4 border-b border-zinc-100/50">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="text-[10px] uppercase bg-zinc-50 text-zinc-500 border-zinc-200">{cov.type}</Badge>
                                                {cov.status === 'Breach' && <Badge variant="destructive" className="text-[10px] h-5">Breach</Badge>}
                                                {cov.status === 'Warning' && <Badge className="text-[10px] h-5 bg-amber-500 hover:bg-amber-600">Warning</Badge>}
                                                {cov.status === 'Safe' && <Badge className="text-[10px] h-5 bg-green-600 hover:bg-green-700">Safe</Badge>}
                                            </div>
                                            <CardTitle className="text-sm font-bold text-zinc-900 mt-2 truncate" title={cov.name}>{cov.name}</CardTitle>
                                        </CardHeader>
                                        
                                        <CardContent className="px-4 py-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs text-zinc-500 mb-0.5">Current Actual</p>
                                                    <p className="text-2xl font-bold text-zinc-900">{cov.actualValue}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-500 mb-0.5">Threshold ({cov.operator})</p>
                                                    <p className="text-sm font-semibold text-zinc-700">{cov.limitValue}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        
                                        <CardFooter className={`px-4 py-2 text-xs border-t ${
                                            cov.status === 'Breach' ? 'bg-red-100/50 text-red-700 border-red-100' : 
                                            cov.status === 'Warning' ? 'bg-amber-50/50 text-amber-700 border-amber-100' : 
                                            'bg-zinc-50 text-zinc-500 border-zinc-100'
                                        }`}>
                                            <div className="flex items-start gap-2 w-full">
                                                {cov.status === 'Breach' ? <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0"/> : <Info className="h-3.5 w-3.5 mt-0.5 shrink-0"/>}
                                                <span className="leading-tight font-medium">{cov.reason}</span>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: PERFORMANCE (Fixed Chart Height) */}
                    <TabsContent value="performance" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-zinc-200 shadow-sm overflow-hidden h-125 flex flex-col">
                                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base font-semibold text-zinc-900">Net Leverage Analysis</CardTitle>
                                            <CardDescription className="mt-1">Historical performance vs. Covenant Threshold (4.00x)</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-white">Facility B</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1">
                                    <div className="h-full w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={loan.risk_status === 'Critical' ? '#DC2626' : '#16A34A'} stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor={loan.risk_status === 'Critical' ? '#DC2626' : '#16A34A'} stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                <XAxis dataKey="quarter" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickMargin={15} />
                                                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}x`} domain={[0, 6]} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }} />
                                                <ReferenceArea y1={4.0} y2={6} fill="#fee2e2" fillOpacity={0.3} />
                                                <ReferenceArea y1={0} y2={4.0} fill="#dcfce7" fillOpacity={0.1} />
                                                <ReferenceLine y={4.0} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'LIMIT (4.0x)', fill: '#DC2626', fontSize: 10, position: 'insideTopRight' }} />
                                                <Area type="monotone" dataKey="actual" stroke={loan.risk_status === 'Critical' ? '#DC2626' : '#16A34A'} strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-semibold text-zinc-500 uppercase">Current Ratio</CardTitle></CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <div className="text-3xl font-bold text-zinc-900">{chartData.length > 0 ? chartData[chartData.length - 1].actual.toFixed(2) : '-'}x</div>
                                        <p className="text-xs text-zinc-500 mt-1 flex items-center">
                                            <TrendingUp className={`h-3 w-3 mr-1 ${loan.risk_status === 'Critical' ? 'text-red-500' : 'text-green-500'}`}/> vs last quarter
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900 text-white border-zinc-800">
                                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-semibold text-zinc-400 uppercase">Headroom</CardTitle></CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <div className="text-3xl font-bold">{(4.0 - (chartData.length > 0 ? chartData[chartData.length - 1].actual : 0)).toFixed(2)}x</div>
                                        <p className="text-xs text-zinc-400 mt-1">Buffer before breach</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 3: OBLIGATIONS */}
                    <TabsContent value="obligations" className="mt-6">
                        <Card className="shadow-sm border-zinc-200">
                            <CardHeader><CardTitle className="text-base">Compliance Schedule</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 text-left">
                                        <tr>
                                            <th className="p-4 font-medium text-zinc-500 text-xs uppercase">Obligation</th>
                                            <th className="p-4 font-medium text-zinc-500 text-xs uppercase">Deadline</th>
                                            <th className="p-4 font-medium text-zinc-500 text-xs uppercase">Status</th>
                                            <th className="p-4 text-right font-medium text-zinc-500 text-xs uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {reportingObligations.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50">
                                                <td className="p-4 font-medium text-zinc-900">{item.name}</td>
                                                <td className="p-4 text-zinc-900 font-mono text-xs">{item.threshold_days}</td>
                                                <td className="p-4"><Badge variant="outline" className={`border-0 ${item.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.status}</Badge></td>
                                                <td className="p-4 text-right">
                                                    {item.status === 'complete' ? <span className="text-green-600 text-xs flex justify-end gap-1 font-medium"><CheckCircle2 className="h-4 w-4"/> Done</span> : 
                                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleObligationUpload(item.id)} disabled={uploadingObligationId === item.id}>{uploadingObligationId === item.id ? <Loader2 className="h-3 w-3 animate-spin"/> : "Upload"}</Button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: DOCUMENTS */}
                    <TabsContent value="documents" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-1 border-dashed border-2 bg-zinc-50 cursor-pointer hover:bg-zinc-100" onClick={handleVaultUpload}>
                                <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                                    {uploading ? <Loader2 className="h-8 w-8 text-zinc-400 animate-spin"/> : <><UploadCloud className="h-8 w-8 text-zinc-400 mb-2"/><p className="text-sm font-semibold">Upload Document</p></>}
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-2">
                                <CardHeader className="pb-3 border-b border-zinc-100"><CardTitle className="text-base">Vault Contents</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-zinc-100">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex justify-between items-center p-4 hover:bg-zinc-50">
                                                <div className="flex gap-4 items-center">
                                                    <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100"><FileIcon className="text-red-600 h-5 w-5"/></div>
                                                    <div><p className="text-sm font-semibold text-zinc-900">{doc.name}</p><p className="text-xs text-zinc-500">{doc.date}</p></div>
                                                </div>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal">Verified</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                </div>
            </Tabs>
        </div>
    </div>
    </div>
  );
}