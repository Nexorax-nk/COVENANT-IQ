"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Download, FileText, ShieldAlert, 
  Loader2, Mail, UploadCloud, File as FileIcon, AlertCircle, TrendingUp, AlertTriangle, CheckCircle2
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
  id: number; // Added ID for tracking uploads
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

// --- 1. COMPACT TOOLTIP (Visual Fix) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isBreach = value > 4.0;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-2.5 border border-zinc-200 shadow-lg rounded-lg outline-none min-w-35">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-zinc-900">{value.toFixed(2)}x</span>
          {isBreach ? (
            <Badge variant="destructive" className="h-4 text-[9px] px-1.5 rounded-sm">Breach</Badge>
          ) : (
            <Badge variant="outline" className="h-4 text-[9px] px-1.5 rounded-sm text-green-600 bg-green-50 border-green-200">Safe</Badge>
          )}
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-dashed border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400">
          <span>Target Limit</span>
          <span className="font-medium text-zinc-600">4.00x</span>
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
  
  // File Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Track specific obligation being uploaded
  const [uploadingObligationId, setUploadingObligationId] = useState<number | null>(null);

  const [documents, setDocuments] = useState<DocFile[]>([
    { id: 1, name: "Executed_Facility_Agreement.pdf", type: "Contract", date: "2023-11-01", status: "verified" },
  ]);

  // FETCH DATA
  useEffect(() => {
    async function fetchLoanDetails() {
      if (!loanId) return;
      try {
        const res = await fetch(`http://localhost:8000/api/loans/${loanId}`);
        if (!res.ok) throw new Error("Loan not found");
        
        const data: Loan = await res.json();
        setLoan(data);

        try {
          const rawCovenants = JSON.parse(data.covenants_json);
          const financials: EnrichedCovenant[] = [];
          const reports: EnrichedObligation[] = [];

          rawCovenants.forEach((cov: any, index: number) => {
            const lowerName = cov.name.toLowerCase();
            
            if (lowerName.includes("reporting") || lowerName.includes("financials") || lowerName.includes("statement")) {
              reports.push({
                id: index, // Simple ID generation
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
              
              if (data.risk_status === "Critical") {
                actualVal = cov.operator.includes("<") ? limitVal + 0.2 : limitVal - 0.2;
                status = "Breach";
              } else if (data.risk_status === "Watchlist") {
                actualVal = cov.operator.includes("<") ? limitVal - 0.1 : limitVal + 0.1;
                status = "Warning";
              } else {
                actualVal = cov.operator.includes("<") ? limitVal - 1.0 : limitVal + 1.0;
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

  // --- 2. ACTION: AUDIT LOG ---
  const handleExport = () => {
    if (!loan) return;
    const fileContent = `AUDIT LOG REPORT\nLoan ID: ${loan.id}\nBorrower: ${loan.borrower_name}\nDate: ${new Date().toLocaleString()}\nStatus: ${loan.risk_status}\n\n-- EVENT HISTORY --\n[${new Date().toISOString()}] User accessed loan details.\n[${loan.effective_date}] Loan agreement analyzed by AI.\n`;
    const file = new Blob([fileContent], {type: 'text/plain'});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `Audit_Log_${loan.borrower_name.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  // --- 3. ACTION: EMAIL BORROWER ---
  const handleContact = () => {
    if (!loan) return;
    const subject = encodeURIComponent(`Urgent: Covenant Compliance Check - Loan #${loan.id}`);
    const body = encodeURIComponent(`Dear ${loan.borrower_name} Team,\n\nWe are reviewing the covenant status for your facility (${loan.loan_amount}). Please provide the latest compliance certificate.\n\nRegards,\nCredit Risk Team`);
    window.location.href = `mailto:finance@${loan.borrower_name.replace(/\s/g, '').toLowerCase()}.com?subject=${subject}&body=${body}`;
  };

  // --- 4. ACTION: VAULT UPLOAD ---
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

  // --- 5. ACTION: OBLIGATION PROOF UPLOAD ---
  const handleObligationUpload = (id: number) => {
    setUploadingObligationId(id);
    // Simulate a quick scan/upload
    setTimeout(() => {
      setReportingObligations(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: "complete" };
        }
        return item;
      }));
      setUploadingObligationId(null);
      // Also add to docs for realism
      setDocuments(prev => [{
        id: Date.now(),
        name: "Compliance_Proof_Upload.pdf",
        type: "Compliance",
        date: new Date().toISOString().split('T')[0],
        status: "verified"
      }, ...prev]);
    }, 1500);
  };

  const chartData = [
    { quarter: "Q1 2024", actual: 2.1, limit: 4.0 },
    { quarter: "Q2 2024", actual: 2.4, limit: 4.0 },
    { quarter: "Q3 2024", actual: 2.9, limit: 4.0 },
    { quarter: "Q4 2024", actual: 3.5, limit: 4.0 }, 
    { quarter: "Q1 2025 (Proj)", actual: 3.9, limit: 4.0 }, // (Proj) = Projected by AI
    { quarter: "Q2 2025 (Proj)", actual: 4.2, limit: 4.0 },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;
  if (!loan) return <div className="p-8 text-center">Loan not found</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
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
              <span>Term Loan B</span>
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
        <TabsList className="bg-transparent border-b border-zinc-200 w-full justify-start h-auto p-0 space-x-6 rounded-none">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3">Overview & Covenants</TabsTrigger>
          <TabsTrigger value="obligations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3">Reporting Obligations</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3">Document Vault</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AREA CHART */}
            <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>Leverage Ratio vs Covenant Limit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-87.5 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis 
                        dataKey="quarter" 
                        stroke="#71717A" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={10}
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
                        label={{ value: 'Limit (4.0x)', fill: '#DC2626', fontSize: 10, position: 'insideTopRight' }} 
                      />
                      
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#18181b" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorActual)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#18181b' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-zinc-900">Active Financial Covenants</h3>
               {financialCovenants.length === 0 && <p className="text-zinc-500 text-sm">No financial covenants found.</p>}
               {financialCovenants.map((cov, i) => (
                 <Card key={i} className={`shadow-sm border-l-4 ${
                    cov.status === 'Breach' ? 'border-l-red-600 bg-red-50/20' : 
                    cov.status === 'Warning' ? 'border-l-yellow-500 bg-yellow-50/20' : 
                    'border-l-green-600 bg-white'
                 }`}>
                   <CardContent className="p-5">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                          <span className="font-semibold text-zinc-900 block">{cov.name}</span>
                          <span className="text-xs text-zinc-500">Limit: {cov.operator} {cov.threshold}</span>
                       </div>
                       {cov.status === 'Breach' && <Badge variant="destructive">Breach</Badge>}
                       {cov.status === 'Warning' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Warning</Badge>}
                       {cov.status === 'Safe' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Compliant</Badge>}
                     </div>

                     <div className="flex items-end justify-between">
                       <div>
                         <p className="text-xs text-zinc-500 mb-1">Current Actual</p>
                         <p className="text-2xl font-bold text-zinc-900">{cov.actualValue}</p>
                       </div>
                       <div className="text-right">
                          {cov.status === 'Safe' ? (
                             <span className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {cov.variance} buffer</span>
                          ) : (
                             <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Risk!</span>
                          )}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="obligations" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reporting Schedule</CardTitle>
                <CardDescription>Track submission deadlines extracted from the agreement.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-left">
                    <tr>
                      <th className="p-4 font-medium text-zinc-500">Obligation Name</th>
                      <th className="p-4 font-medium text-zinc-500">Frequency</th>
                      <th className="p-4 font-medium text-zinc-500">Deadline Rule</th>
                      <th className="p-4 font-medium text-zinc-500">Status</th>
                      <th className="p-4 font-medium text-zinc-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reportingObligations.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-zinc-500">No reporting obligations found in this agreement.</td></tr>
                    )}
                    {reportingObligations.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-4 font-medium text-zinc-900">{item.name}</td>
                        <td className="p-4 text-zinc-500">{item.frequency}</td>
                        <td className="p-4 text-zinc-900 font-mono text-xs">{item.threshold_days}</td>
                        <td className="p-4">
                          <Badge className={`
                            ${item.status === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                              item.status === 'complete' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                              'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'} border-transparent
                          `}>
                            {item.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {item.status === 'complete' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                           {item.status === 'complete' ? (
                              <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Uploaded
                              </span>
                           ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 min-w-25"
                                onClick={() => handleObligationUpload(item.id)}
                                disabled={uploadingObligationId === item.id}
                              >
                                {uploadingObligationId === item.id ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                ) : "Upload Proof"}
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

        <TabsContent value="documents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-dashed border-2 border-zinc-200 bg-zinc-50/50">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-62.5 p-6 text-center cursor-pointer hover:bg-zinc-50 transition-colors" onClick={handleVaultUpload}>
                {uploading ? (
                  <div className="w-full max-w-50 space-y-4">
                    <Loader2 className="h-10 w-10 text-red-600 animate-spin mx-auto" />
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-zinc-500">Encrypting & Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                      <UploadCloud className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-zinc-900">Upload Document</h3>
                    <p className="text-sm text-zinc-500 mt-1">Drag & drop or click to browse</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Vault Content</CardTitle>
                <CardDescription>{documents.length} secure documents stored</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-lg group transition-colors border border-transparent hover:border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Verified</Badge>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}