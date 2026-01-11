"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, Activity, Loader2, 
  FileText, TrendingUp, ShieldAlert, Download, XCircle,
  Mail, Building, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [covenants, setCovenants] = useState<Covenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "escalate" | null>(null);

  // State for Recommended Actions
  const [actionsTaken, setActionsTaken] = useState({
    notify: false,
    requestCert: false,
    escalateAgent: false
  });

  // 1. Fetch Loan Data
  useEffect(() => {
    if (!loanId) return;
    fetch(`http://localhost:8000/api/loans/${loanId}`)
      .then(res => res.json())
      .then(data => {
        setLoan(data);
        try {
          setCovenants(JSON.parse(data.covenants_json));
        } catch (e) { console.error(e); }
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [loanId]);

  // 2. Handle Action Button Clicks
  const performAction = (action: 'notify' | 'requestCert' | 'escalateAgent') => {
    setActionsTaken(prev => ({ ...prev, [action]: true }));
    // Just a visual cue for the demo
    // alert(`Action logged: ${action}`); 
  };

  // 3. Handle Final Submit (FIXED REDIRECT)
  const handleSubmit = async () => {
    if (!reviewAction) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`http://localhost:8000/api/loans/${loanId}/review`, { method: 'POST' });
      if (res.ok) {
        // FIXED: Redirect to dashboard, not landing page
        setTimeout(() => { router.push('/dashboard'); }, 1500);
      } else {
        alert("System Error: Could not submit review.");
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-zinc-50">
      <Loader2 className="h-10 w-10 animate-spin text-red-600" />
    </div>
  );

  if (!loan) return <div className="p-10 text-center">Case File Not Found</div>;

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      
      {/* TOP NAVIGATION BAR */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900">Credit Review</span>
              <Badge variant="outline" className="font-mono text-zinc-500">CASE-{loan.id}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-zinc-400">Last updated: Just now</span>
             <Button variant="outline" size="sm">
               <Download className="h-4 w-4 mr-2" /> Download Report
             </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MAIN CASE FILE */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-l-4 border-l-yellow-500 shadow-sm overflow-hidden">
            <div className="bg-yellow-50/50 px-6 py-4 border-b border-yellow-100 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{loan.borrower_name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-600">
                  <span className="flex items-center"><FileText className="h-3.5 w-3.5 mr-1" /> Term Loan B</span>
                  <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                  <span className="font-medium text-zinc-900">{loan.loan_amount}</span>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1 text-sm font-medium shadow-none">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Needs Review
              </Badge>
            </div>
            
            <CardContent className="pt-6">
              <Alert className="bg-white border-zinc-200 shadow-sm mb-6">
                <Activity className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-900">Risk Trigger Detected</AlertTitle>
                <AlertDescription className="text-zinc-600 mt-1">
                  AI analysis indicates a potential breach in <strong>Debt-to-EBITDA</strong> based on projected financials. 
                  The borrower's status has been automatically downgraded to <strong>Watchlist</strong>.
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="financials" className="w-full">
                <TabsList className="bg-zinc-100 w-full justify-start h-10 p-1 mb-4">
                  <TabsTrigger value="financials">Financial Covenants</TabsTrigger>
                  <TabsTrigger value="documents">Source Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="financials" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {covenants.map((cov, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-zinc-50/50 flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-500 mb-1">{cov.name}</p>
                          <div className="flex items-baseline gap-2">
                             <span className="text-lg font-bold text-zinc-900">{cov.operator} {cov.threshold}</span>
                             <span className="text-xs text-zinc-400">Limit</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-200 flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-600">Current Status</span>
                          {idx === 0 ? (
                            <span className="text-xs font-bold text-red-600 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> Trending High</span>
                          ) : (
                            <span className="text-xs font-bold text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Stable</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="documents">
                  <div className="border border-dashed border-zinc-300 rounded-lg p-8 text-center bg-zinc-50">
                    <FileText className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-900">Facility Agreement.pdf</p>
                    <Button variant="outline" size="sm" className="mt-4">Preview Document</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Credit Officer Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Enter your analysis here..." 
                className="min-h-37.5 resize-none focus-visible:ring-red-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTION CENTER */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* RECOMMENDED ACTIONS CARD */}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              
              <Button 
                variant="outline" 
                className={`w-full justify-start ${actionsTaken.notify ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                onClick={() => performAction('notify')}
              >
                {actionsTaken.notify ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4 text-zinc-500" />}
                {actionsTaken.notify ? "Borrower Notified" : "Notify Borrower of Breach"}
              </Button>

              <Button 
                variant="outline" 
                className={`w-full justify-start ${actionsTaken.requestCert ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                onClick={() => performAction('requestCert')}
              >
                {actionsTaken.requestCert ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <FileCheck className="mr-2 h-4 w-4 text-zinc-500" />}
                {actionsTaken.requestCert ? "Certificate Requested" : "Request Compliance Cert"}
              </Button>

              <Button 
                variant="outline" 
                className={`w-full justify-start ${actionsTaken.escalateAgent ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                onClick={() => performAction('escalateAgent')}
              >
                {actionsTaken.escalateAgent ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Building className="mr-2 h-4 w-4 text-zinc-500" />}
                {actionsTaken.escalateAgent ? "Agent Bank Contacted" : "Escalate to Agent Bank"}
              </Button>

            </CardContent>
          </Card>

          {/* DECISION CARD */}
          <Card className="sticky top-24 shadow-md border-zinc-200">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
              <CardTitle className="text-lg font-semibold">Final Decision</CardTitle>
              <CardDescription>Select action to resolve alert.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div 
                onClick={() => setReviewAction("approve")}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  reviewAction === "approve" 
                    ? "border-green-600 bg-green-50" 
                    : "border-zinc-200 hover:border-green-200 hover:bg-green-50/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    reviewAction === "approve" ? "border-green-600 bg-green-600" : "border-zinc-300"
                  }`}>
                    {reviewAction === "approve" && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">Clear Risk & Approve</p>
                    <p className="text-xs text-zinc-500">Mark loan as Healthy.</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setReviewAction("escalate")}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  reviewAction === "escalate" 
                    ? "border-red-600 bg-red-50" 
                    : "border-zinc-200 hover:border-red-200 hover:bg-red-50/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    reviewAction === "escalate" ? "border-red-600 bg-red-600" : "border-zinc-300"
                  }`}>
                    {reviewAction === "escalate" && <XCircle className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">Escalate to Committee</p>
                    <p className="text-xs text-zinc-500">Keep on Watchlist/Critical.</p>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />
              
              <Button 
                className={`w-full font-medium ${
                  reviewAction === "escalate" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-zinc-800"
                }`}
                disabled={!reviewAction || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "Submit Decision"
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}