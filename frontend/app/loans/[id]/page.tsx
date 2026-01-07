"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation"; // <--- 1. NEW IMPORT
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  ShieldAlert,
  Loader2,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts";

interface Loan {
  id: number;
  borrower_name: string;
  loan_amount: string;
  effective_date: string;
  risk_status: "Healthy" | "Watchlist" | "Critical";
  covenants_json: string;
}

interface Covenant {
  name: string;
  threshold: string;
  operator: string;
  confidence: string;
}

// 2. REMOVE { params } from here
export default function LoanDetailsPage() {
  const params = useParams(); // <--- 3. USE THE HOOK
  const loanId = params.id as string; // Safely get the ID

  const [loan, setLoan] = useState<Loan | null>(null);
  const [covenants, setCovenants] = useState<Covenant[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH DATA
  useEffect(() => {
    async function fetchLoanDetails() {
      if (!loanId) return; // Wait for ID to be ready

      try {
        const res = await fetch(`http://localhost:8000/api/loans/${loanId}`);
        if (!res.ok) throw new Error("Loan not found");
        
        const data: Loan = await res.json();
        setLoan(data);

        try {
          const parsedCovenants = JSON.parse(data.covenants_json);
          setCovenants(parsedCovenants);
        } catch (e) {
          console.error("Failed to parse covenants", e);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchLoanDetails();
  }, [loanId]);

  // 2. ACTION: EXPORT AUDIT LOG
  const handleExport = () => {
    if (!loan) return;
    const element = document.createElement("a");
    const fileContent = `AUDIT LOG REPORT\nLoan ID: ${loan.id}\nBorrower: ${loan.borrower_name}\nDate: ${new Date().toLocaleString()}\nStatus: ${loan.risk_status}\n\n-- EVENT HISTORY --\n[${new Date().toISOString()}] User accessed loan details.\n[${loan.effective_date}] Loan agreement analyzed by AI.\n`;
    const file = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Audit_Log_${loan.borrower_name.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  // 3. ACTION: CONTACT BORROWER
  const handleContact = () => {
    if (!loan) return;
    const subject = encodeURIComponent(`Urgent: Covenant Compliance Check - Loan #${loan.id}`);
    const body = encodeURIComponent(`Dear ${loan.borrower_name} Team,\n\nWe are reviewing the covenant status for your facility (${loan.loan_amount}). Please provide the latest compliance certificate.\n\nRegards,\nCredit Risk Team`);
    window.location.href = `mailto:finance@${loan.borrower_name.replace(/\s/g, '').toLowerCase()}.com?subject=${subject}&body=${body}`;
  };

  const generateChartData = (id: string) => {
    const seed = parseInt(id) || 1;
    const baseValue = (seed % 5) + 2;
    return [
      { quarter: "Q1 2024", actual: baseValue - 0.2, limit: baseValue + 1.5 },
      { quarter: "Q2 2024", actual: baseValue + 0.1, limit: baseValue + 1.5 },
      { quarter: "Q3 2024", actual: baseValue + 0.5, limit: baseValue + 1.5 },
      { quarter: "Q4 2024", actual: baseValue + 0.9, limit: baseValue + 1.5 }, 
      { quarter: "Q1 2025 (Proj)", actual: baseValue + 1.2, limit: baseValue + 1.5 },
      { quarter: "Q2 2025 (Proj)", actual: baseValue + 1.6, limit: baseValue + 1.5 },
    ];
  };

  const chartData = generateChartData(loanId);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;
  if (!loan) return <div className="p-8 text-center">Loan not found</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Link href="/loans">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{loan.borrower_name}</h1>
            <Badge className={`
              ${loan.risk_status === 'Critical' ? 'bg-red-100 text-red-700' : 
                loan.risk_status === 'Watchlist' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'}
            `}>
              {loan.risk_status === 'Critical' && <ShieldAlert className="w-3 h-3 mr-1" />} 
              {loan.risk_status}
            </Badge>
          </div>
          <p className="text-zinc-500 text-sm">Loan ID: #{loan.id} • {loan.loan_amount} • Effective: {loan.effective_date}</p>
        </div>
        
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Audit Log
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleContact}>
            <Mail className="mr-2 h-4 w-4" /> Contact Borrower
          </Button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Next Review Date</p>
                <h3 className="text-2xl font-bold mt-1">Dec 31, 2025</h3>
              </div>
              <Calendar className="h-8 w-8 text-zinc-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Active Covenants</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">{covenants.length} Rules</h3>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Pending Obligations</p>
                <h3 className="text-2xl font-bold mt-1">2 Items</h3>
              </div>
              <FileText className="h-8 w-8 text-zinc-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN TABS */}
      <Tabs defaultValue="covenants" className="w-full">
        <TabsList className="bg-zinc-100 p-1">
          <TabsTrigger value="covenants">Financial Covenants</TabsTrigger>
          <TabsTrigger value="performance">Performance Chart</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="covenants" className="mt-6 space-y-4">
            {covenants.map((cov, index) => (
                <Card key={index} className="border-l-4 border-l-red-600">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-zinc-900">{cov.name}</p>
                            <p className="text-sm text-zinc-500">Must be {cov.operator} {cov.threshold}</p>
                        </div>
                        <Badge variant="outline">{cov.confidence} Confidence</Badge>
                    </CardContent>
                </Card>
            ))}
        </TabsContent>

        <TabsContent value="performance" className="mt-6 space-y-6">
          <Card className="border-red-200 shadow-sm">
            <CardHeader>
              <CardTitle>Covenant Trend Analysis</CardTitle>
              <CardDescription>Simulated quarterly performance vs thresholds.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-87.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                    <XAxis dataKey="quarter" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
                    <ReferenceLine y={chartData[0].limit} stroke="#DC2626" strokeDasharray="5 5" label="Limit" />
                    <Line type="monotone" dataKey="actual" stroke="#18181b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="h-64 flex items-center justify-center border-dashed">
            <p className="text-zinc-500">Document Vault for Loan #{loan.id}</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}