"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Download, ArrowUpRight, Loader2, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 1. Define Types matching your Backend Response
interface Loan {
  id: number;
  borrower_name: string;
  loan_amount: string;
  effective_date: string;
  risk_status: "Healthy" | "Watchlist" | "Critical";
  covenants_json: string;
}

// Extended type for UI display (adding simulated fields)
interface DisplayLoan extends Loan {
  riskScore: number;
  nextReview: string;
}

export default function LoanPortfolioPage() {
  const [loans, setLoans] = useState<DisplayLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 2. Fetch Data from Real Backend
  async function fetchLoans() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/loans");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Loan[] = await res.json();

      // Transform data for UI (Simulate Risk Score & Review Date for realism)
      const enrichedData = data.map(loan => ({
        ...loan,
        riskScore: getRiskScore(loan.risk_status),
        nextReview: getNextReviewDate(loan.effective_date)
      }));

      // Sort by Risk Score (Critical first)
      enrichedData.sort((a, b) => b.riskScore - a.riskScore);

      setLoans(enrichedData);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoans();
  }, []);

  // Helper: Simulate Risk Score based on Status
  const getRiskScore = (status: string) => {
    if (status === 'Critical') return Math.floor(Math.random() * (99 - 85) + 85);
    if (status === 'Watchlist') return Math.floor(Math.random() * (75 - 55) + 55);
    return Math.floor(Math.random() * (30 - 10) + 10);
  };

  // Helper: Simulate Next Review Date (1 year after effective)
  const getNextReviewDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  // 3. Export CSV Functionality (Working Button)
  const handleExportCSV = () => {
    if (filteredLoans.length === 0) return;

    const headers = ["Loan ID", "Borrower", "Amount", "Status", "Risk Score", "Next Review"];
    const rows = filteredLoans.map(l => [
      l.id,
      `"${l.borrower_name}"`, // Quote names to handle commas
      `"${l.loan_amount}"`,
      l.risk_status,
      l.riskScore,
      l.nextReview
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Portfolio_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = loan.borrower_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || loan.risk_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Loan Portfolio</h1>
          <p className="text-zinc-500 mt-1">Manage and monitor {loans.length} active credit agreements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLoans} title="Refresh Data">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Link href="/upload">
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md">
              + Add New Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by borrower name..."
                className="pl-9 bg-zinc-50 border-zinc-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg">
              {["All", "Critical", "Watchlist", "Healthy"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    statusFilter === status
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Main Table */}
      <Card className="border-zinc-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="w-25">Loan ID</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Total Commitment</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Review</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                      <p>Loading Portfolio Data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <TableRow key={loan.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-mono text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" /> #{loan.id}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900">{loan.borrower_name}</TableCell>
                    <TableCell>{loan.loan_amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              loan.riskScore > 80 ? 'bg-red-600' : 
                              loan.riskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`} 
                            style={{ width: `${loan.riskScore}%` }} 
                          />
                        </div>
                        <span className="text-sm font-medium text-zinc-600">{loan.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${loan.risk_status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                          loan.risk_status === 'Watchlist' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          'bg-green-50 text-green-700 border-green-200'}
                      `}>
                        {loan.risk_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">{loan.nextReview}</TableCell>
                    <TableCell className="text-right">
                      {/* Points to the dynamic details page we built */}
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-red-600" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                    No loans found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}