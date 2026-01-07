"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Download, Calendar, CheckCircle2, FileText, ShieldAlert, 
  Loader2, Mail, UploadCloud, File as FileIcon, AlertCircle, TrendingUp, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
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
  // Simulated "Real" Data
  actualValue: string;
  status: "Safe" | "Warning" | "Breach";
  variance: string; // e.g. "0.5x buffer"
}

interface EnrichedObligation {
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

export default function LoanDetailsPage() {
  const params = useParams();
  const loanId = params.id as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [financialCovenants, setFinancialCovenants] = useState<EnrichedCovenant[]>([]);
  const [reportingObligations, setReportingObligations] = useState<EnrichedObligation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<DocFile[]>([
    { id: 1, name: "Executed_Facility_Agreement.pdf", type: "Contract", date: "2023-11-01", status: "verified" },
  ]);

  // 1. FETCH & PROCESS DATA
  useEffect(() => {
    async function fetchLoanDetails() {
      if (!loanId) return;
      try {
        const res = await fetch(`http://localhost:8000/api/loans/${loanId}`);
        if (!res.ok) throw new Error("Loan not found");
        
        const data: Loan = await res.json();
        setLoan(data);

        // --- INTELLIGENT PARSING & SIMULATION ---
        try {
          const rawCovenants = JSON.parse(data.covenants_json);
          const financials: EnrichedCovenant[] = [];
          const reports: EnrichedObligation[] = [];

          rawCovenants.forEach((cov: any) => {
            const lowerName = cov.name.toLowerCase();
            
            // LOGIC: Separate "Reporting" from "Financial" covenants
            if (lowerName.includes("reporting") || lowerName.includes("financials") || lowerName.includes("statement")) {
              // It's an Obligation
              reports.push({
                name: cov.name,
                frequency: lowerName.includes("quarter") ? "Quarterly" : "Annual",
                dueDate: "2025-10-15", // Mock due date based on typical cycles
                status: Math.random() > 0.5 ? "pending" : "overdue",
                threshold_days: cov.threshold
              });
            } else {
              // It's a Financial Ratio -> SIMULATE ACTUALS
              const isRatio = cov.threshold.includes("x") || cov.threshold.includes(":");
              // Parse the number from threshold (e.g. "3.50x" -> 3.5)
              const limitVal = parseFloat(cov.threshold.replace(/[^0-9.]/g, '')) || 0;
              
              // Generate a fake "Actual" value close to the limit
              // If Risk is "Critical", make it breach. If "Healthy", make it safe.
              let actualVal = 0;
              let status: "Safe" | "Warning" | "Breach" = "Safe";
              
              if (data.risk_status === "Critical") {
                actualVal = cov.operator.includes("<") ? limitVal + 0.2 : limitVal - 0.2; // Breach
                status = "Breach";
              } else if (data.risk_status === "Watchlist") {
                actualVal = cov.operator.includes("<") ? limitVal - 0.1 : limitVal + 0.1; // Close call
                status = "Warning";
              } else {
                actualVal = cov.operator.includes("<") ? limitVal - 1.0 : limitVal + 1.0; // Safe
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

  // Upload Simulation
  const handleFileUpload = () => {
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
        alert("Document uploaded successfully!");
      }
    }, 200);
  };

  // Mock Chart
  const chartData = [
    { quarter: "Q1 2024", actual: 2.1, limit: 4.0 },
    { quarter: "Q2 2024", actual: 2.4, limit: 4.0 },
    { quarter: "Q3 2024", actual: 2.9, limit: 4.0 },
    { quarter: "Q4 2024", actual: 3.5, limit: 4.0 }, 
    { quarter: "Q1 2025 (Proj)", actual: 3.9, limit: 4.0 },
    { quarter: "Q2 2025 (Proj)", actual: 4.2, limit: 4.0 },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;
  if (!loan) return <div className="p-8 text-center">Loan not found</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* HEADER SECTION */}
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
            <Button variant="outline" className="text-zinc-600">
              <Download className="mr-2 h-4 w-4" /> Audit Log
            </Button>
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
              <Mail className="mr-2 h-4 w-4" /> Email Borrower
            </Button>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-zinc-200 w-full justify-start h-auto p-0 space-x-6 rounded-none">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3">Overview & Covenants</TabsTrigger>
          <TabsTrigger value="obligations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3">Reporting Obligations</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 px-0 py-3">Document Vault</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: OVERVIEW & COVENANTS --- */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>Leverage Ratio vs Covenant Limit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-75 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis dataKey="quarter" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <ReferenceLine y={4.0} stroke="#DC2626" strokeDasharray="5 5" label="Limit (4.0x)" />
                      <Line type="monotone" dataKey="actual" stroke="#18181b" strokeWidth={3} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* UPGRADED Covenant Cards */}
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

        {/* --- TAB 2: OBLIGATIONS (Dynamic Table) --- */}
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
                              'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'} border-transparent
                          `}>
                            {item.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {item.status === 'overdue' ? 'Overdue' : 'Pending Review'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                              Upload Proof
                            </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: DOCUMENT VAULT --- */}
        <TabsContent value="documents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-dashed border-2 border-zinc-200 bg-zinc-50/50">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-62.5 p-6 text-center cursor-pointer hover:bg-zinc-50 transition-colors" onClick={handleFileUpload}>
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
                        {doc.status === 'verified' ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Scanning</Badge>
                        )}
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