"use client";

import Link from "next/link";
import { 
  ArrowRight, ShieldCheck, Zap, Lock, BarChart3, 
  CheckCircle2, XCircle, TrendingUp, Clock, Building2, BrainCircuit, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-red-900 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Covenant IQ</span>
          </div>
          <Link href="/dashboard">
            <Button className="bg-white hover:bg-zinc-200 text-zinc-900 font-semibold transition-transform hover:scale-105">
              Launch Platform <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Financial District" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-900/80 to-zinc-900/60" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-10">
          <Badge className="mb-8 py-2 px-4 text-sm font-medium border-red-500/50 bg-red-500/10 text-red-400 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Enterprise Risk Intelligence
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-white drop-shadow-2xl">
            Loan Covenant & Obligation <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-orange-500 to-amber-500">
              Monitoring Platform
            </span>
          </h1>
          
          <p className="text-xl text-zinc-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light drop-shadow-lg">
            A centralized platform for identifying, tracking, and validating borrower
            obligations across complex commercial loan agreements.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard">
              <Button size="lg" className="h-16 px-10 text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xl shadow-red-900/50 rounded-xl transition-all hover:-translate-y-1">
                Access Dashboard <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="text-white font-bold text-lg flex items-center gap-2"><Building2 className="h-6 w-6"/> GLOBAL BANK</div>
             <div className="text-white font-bold text-lg flex items-center gap-2"><ShieldCheck className="h-6 w-6"/> SECURE CAPITAL</div>
             <div className="text-white font-bold text-lg flex items-center gap-2"><TrendingUp className="h-6 w-6"/> PRIME CORP</div>
          </div>
        </div>
      </section>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-24 bg-zinc-50 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            
            {/* Problem */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-100 text-red-800 font-bold text-xs uppercase tracking-wider border border-red-200">
                <AlertTriangle className="h-4 w-4" /> Operational Risk
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">Manual Compliance Challenges</h2>
              <p className="text-lg text-zinc-600 leading-relaxed">
                Loan agreements define numerous borrower obligations, including financial
                covenants, reporting timelines, and notification requirements.
                These are typically monitored through manual processes.
              </p>
              <div className="space-y-4">
                <ProblemCard title="Fragmented Information" desc="Key obligations are buried across lengthy and unstructured PDF agreements." />
                <ProblemCard title="Manual Errors" desc="Spreadsheet-based tracking increases the risk of missed or incorrect compliance checks." />
                <ProblemCard title="Limited Oversight" desc="Compliance status and audit trails are not available in real time." />
              </div>
            </div>

            {/* Solution */}
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-black to-red-600 rounded-3xl -rotate-2 scale-105 z-0 border border-zinc-200" />
              <div className="relative z-10 bg-white p-10 rounded-3xl shadow-xl border border-zinc-100">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 text-green-800 font-bold text-xs uppercase tracking-wider mb-6 border border-green-200">
                  <BrainCircuit className="h-4 w-4" /> Automated Governance
                </div>
                <h3 className="text-3xl font-bold mb-6 text-zinc-900">Structured Compliance Monitoring</h3>
                <p className="text-zinc-600 mb-8 leading-relaxed">
                  Covenant IQ converts legal loan documentation into structured,
                  monitorable obligations, enabling continuous compliance oversight
                  across the loan portfolio.
                </p>
                <div className="space-y-6">
                  <SolutionItem icon={<Zap className="text-amber-500" />} title="Automated Extraction" text="Identifies financial covenants and obligations directly from loan agreements." />
                  <SolutionItem icon={<Lock className="text-blue-500" />} title="Continuous Monitoring" text="Tracks borrower performance against agreed covenant thresholds." />
                  <SolutionItem icon={<CheckCircle2 className="text-green-600" />} title="Compliance Reporting" text="Produces clear, audit-ready compliance records." />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- METRICS (UPDATED COLORS) --- */}
      <section className="py-24 bg-white border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Operational Impact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <MetricCard 
                number="90%" 
                label="Process Efficiency" 
                desc="Reduction in manual document review and tracking effort." 
                icon={<Clock className="h-6 w-6 text-red-800" />} 
                color="red"
            />
            <MetricCard 
                number="100%" 
                label="Data Consistency" 
                desc="Eliminates manual transcription and tracking errors." 
                icon={<ShieldCheck className="h-6 w-6 text-emerald-900" />} 
                color="green"
            />
            <MetricCard 
                number="24/7" 
                label="Compliance Visibility" 
                desc="Continuous oversight instead of periodic manual reviews." 
                icon={<BarChart3 className="h-6 w-6 text-blue-600" />} 
                color="blue"
            />
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-32 bg-zinc-900 text-center text-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 tracking-tight">Bring structure to loan compliance.</h2>
          <Link href="/dashboard">
            <Button size="lg" className="h-16 px-12 text-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-xl rounded-full transition-all hover:scale-105">
              Launch Dashboard <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-8 text-zinc-400 text-sm">Secure • Scalable • Audit-Ready</p>
        </div>
      </section>

    </div>
  );
}

/* --- COMPONENTS --- */

function ProblemCard({ title, desc }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 bg-white hover:shadow-md transition-all duration-300 hover:border-zinc-300">
      <div className="mt-1 bg-red-50 p-2 rounded-lg border border-red-100">
        <XCircle className="h-5 w-5 text-red-600" />
      </div>
      <div>
        <h4 className="font-bold text-lg text-zinc-900">{title}</h4>
        <p className="text-sm text-zinc-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function SolutionItem({ icon, title, text }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">{icon}</div>
      <div>
        <h4 className="font-bold text-lg text-zinc-900">{title}</h4>
        <p className="text-zinc-500 text-sm mt-1">{text}</p>
      </div>
    </div>
  );
}

function MetricCard({ number, label, desc, icon, color }: any) {
  // Color mapping for professional styling
  const colorStyles: any = {
    red: "border-t-red-500 hover:shadow-red-500/10",
    green: "border-t-emerald-500 hover:shadow-emerald-500/10",
    blue: "border-t-blue-500 hover:shadow-blue-500/10"
  };

  return (
    <div className={`flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-zinc-100 border-t-4 shadow-lg hover:-translate-y-1 transition-all duration-300 ${colorStyles[color] || ""}`}>
      <div className="mb-5 p-4 bg-zinc-50 rounded-full border border-zinc-100">{icon}</div>
      <div className="text-5xl font-extrabold mb-2 text-zinc-900">{number}</div>
      <div className="text-lg font-bold text-zinc-700">{label}</div>
      <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}