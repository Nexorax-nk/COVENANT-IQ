"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;
  
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch the Loan Data
  useEffect(() => {
    if (!loanId) return;
    
    fetch(`http://localhost:8000/api/loans/${loanId}`)
      .then(res => {
        if (!res.ok) throw new Error("Loan not found");
        return res.json();
      })
      .then(data => {
        setLoan(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [loanId]);

  // 2. Handle the "Approve" Action
  const handleApprove = async () => {
    setSubmitting(true);
    
    try {
      const res = await fetch(`http://localhost:8000/api/loans/${loanId}/review`, { 
        method: 'POST' 
      });
      
      if (res.ok) {
        // Success! Wait a moment then go back to Dashboard
        setTimeout(() => {
            router.push('/'); 
        }, 1000);
      } else {
        alert("Error reviewing loan.");
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  );

  if (!loan) return <div className="p-10 text-center">Loan not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-10 px-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Credit Review: {loan.borrower_name}</h1>
          <p className="text-zinc-500">Case ID: #{loan.id} • Current Status: <span className="text-yellow-600 font-medium">{loan.risk_status}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT COLUMN: RISK ANALYSIS */}
        <div className="md:col-span-2 space-y-6">
          
          {/* AI Insight Card */}
          <Card className="border-l-4 border-l-yellow-500 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-yellow-600" /> Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-900 leading-relaxed border border-yellow-100">
                <strong>AI Assessment:</strong> This borrower has drifted into the <strong>"Watchlist"</strong> category. 
                Our automated scan detected potential volatility in their projected EBITDA coverage ratios. 
                Immediate review of their latest quarterly financials is recommended before clearing this flag.
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-zinc-700">Key Metrics Snapshot</h4>
                <div className="flex justify-between text-sm py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Loan Amount</span>
                  <span className="font-medium text-zinc-900">{loan.loan_amount}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Effective Date</span>
                  <span className="font-medium text-zinc-900">{loan.effective_date}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Covenant Status</span>
                  <span className="font-bold text-yellow-600">Warning (Trending High)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Officer Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credit Officer Notes</CardTitle>
              <CardDescription>Document your findings before making a decision.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="e.g., Spoke with CFO, confirmed Q3 numbers are delayed due to audit. Liquidity remains strong..." 
                className="h-32 resize-none" 
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: DECISION PANEL */}
        <div className="md:col-span-1 space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Decision</CardTitle>
              <CardDescription>Action required to resolve alert.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleApprove} 
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Clear Risk</>
                )}
              </Button>
              
              <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-white">
                <AlertTriangle className="mr-2 h-4 w-4" /> Escalate to Committee
              </Button>
              
              <p className="text-xs text-zinc-400 text-center pt-2">
                Action will be logged in Audit Trail.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}