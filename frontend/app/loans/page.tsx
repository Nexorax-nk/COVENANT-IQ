"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Download, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LOANS, Loan } from "@/lib/data";

export default function LoanPortfolioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filter Logic
  const filteredLoans = LOANS.filter((loan) => {
    const matchesSearch = loan.borrower.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Loan Portfolio</h1>
          <p className="text-zinc-500 mt-1">Manage and monitor all active credit agreements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
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

            {/* Status Tabs (Visual) */}
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
      <Card className="border-zinc-200 shadow-sm">
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
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <TableRow key={loan.id} className="group hover:bg-zinc-50/50">
                    <TableCell className="font-mono text-xs text-zinc-500">#{loan.id}</TableCell>
                    <TableCell className="font-medium text-zinc-900">{loan.borrower}</TableCell>
                    <TableCell>{loan.amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          loan.riskScore > 80 ? 'bg-red-600' : 
                          loan.riskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm font-medium">{loan.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${loan.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                          loan.status === 'Watchlist' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          'bg-green-50 text-green-700 border-green-200'}
                      `}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">{loan.nextReview}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/loan/${loan.id}`}>
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
                    No loans found matching your filters.
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