"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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

// MOCK DATA FOR THE CHART (The "Story" of a failing loan)
const CHART_DATA = [
  { quarter: "Q1 2024", actual: 2.1, limit: 4.0 },
  { quarter: "Q2 2024", actual: 2.4, limit: 4.0 },
  { quarter: "Q3 2024", actual: 2.9, limit: 4.0 },
  { quarter: "Q4 2024", actual: 3.5, limit: 4.0 }, // Getting close
  { quarter: "Q1 2025 (Proj)", actual: 3.9, limit: 4.0 }, // AI Prediction
  { quarter: "Q2 2025 (Proj)", actual: 4.2, limit: 4.0 }, // BREACH
];

export default function LoanDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, use params.id to fetch data. Here we hardcode the "Story".
  
  return (
    <div className="space-y-6">
      {/* 1. TOP NAVIGATION & HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">Oceanic Shipping Ltd.</h1>
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
              <ShieldAlert className="w-3 h-3 mr-1" /> At Risk
            </Badge>
          </div>
          <p className="text-zinc-500 text-sm">Loan ID: #{params.id || "2024-X99"} • Term Loan B • $45,000,000</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Audit Log
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            Contact Borrower
          </Button>
        </div>
      </div>

      {/* 2. KEY METRICS ROW */}
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
                <p className="text-sm font-medium text-zinc-500">Compliance Score</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">65/100</h3>
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
                <h3 className="text-2xl font-bold mt-1">3 Items</h3>
              </div>
              <FileText className="h-8 w-8 text-zinc-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. MAIN CONTENT TABS */}
      <Tabs defaultValue="financials" className="w-full">
        <TabsList className="bg-zinc-100 p-1">
          <TabsTrigger value="financials">Financial Covenants</TabsTrigger>
          <TabsTrigger value="obligations">Reporting & Obligations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* TAB 1: FINANCIAL COVENANTS (THE CHART) */}
        <TabsContent value="financials" className="mt-6 space-y-6">
          <Card className="border-red-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Net Leverage Ratio (Debt / EBITDA)</span>
                <Badge variant="outline" className="text-zinc-500 font-normal">
                  Limit: &lt; 4.00x
                </Badge>
              </CardTitle>
              <CardDescription>
                Monitoring quarterly performance against covenant threshold.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-87.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={CHART_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                    <XAxis 
                      dataKey="quarter" 
                      stroke="#71717A" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#71717A" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[0, 6]}
                      tickFormatter={(value) => `${value}x`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px' }}
                      itemStyle={{ color: '#18181b' }}
                    />
                    {/* The Covenant Limit Line (Red Dashed) */}
                    <ReferenceLine y={4.0} stroke="#DC2626" strokeDasharray="5 5" label={{ value: 'Covenant Limit (4.0x)', position: 'insideTopRight', fill: '#DC2626', fontSize: 12 }} />
                    
                    {/* The Actual Data Line */}
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#18181b" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#18181b" }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* AI INSIGHT BOX */}
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">AI Predictive Alert</h4>
                  <p className="text-sm text-red-800 mt-1">
                    Based on the current declining EBITDA trend, Covenant IQ projects a <strong>breach in Q2 2025</strong> (Ratio: 4.2x). Recommended action: Request early waiver or equity cure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: OBLIGATIONS CHECKLIST */}
        <TabsContent value="obligations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Non-Financial Obligations</CardTitle>
              <CardDescription>Track reporting deadlines and operational covenants.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ObligationItem 
                  title="Annual Audited Financials" 
                  due="Due: Dec 31, 2025" 
                  status="pending" 
                />
                <Separator />
                <ObligationItem 
                  title="Quarterly Compliance Certificate" 
                  due="Due: Oct 15, 2025" 
                  status="overdue" 
                />
                <Separator />
                <ObligationItem 
                  title="Insurance Policy Renewal" 
                  due="Submitted: Aug 20, 2025" 
                  status="complete" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DOCUMENTS (Placeholder) */}
        <TabsContent value="documents">
          <Card className="h-64 flex items-center justify-center border-dashed">
            <p className="text-zinc-500">Document Vault Integration (Coming Soon)</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple helper component for the list items
function ObligationItem({ title, due, status }: { title: string, due: string, status: 'pending' | 'complete' | 'overdue' }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {status === 'complete' ? (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        ) : status === 'overdue' ? (
           <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-zinc-400" />
          </div>
        )}
        <div>
          <p className="font-medium text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500">{due}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="text-zinc-500">
        {status === 'complete' ? 'View' : 'Upload'}
      </Button>
    </div>
  )
}