"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Lock, BarChart3, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Navbar - Transparent & Clean */}
      <nav className="border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900">Covenant IQ</span>
          </div>
          <div>
            <Link href="/dashboard">
              <Button className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
                Launch Platform <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm font-medium border-zinc-200 bg-white shadow-sm text-zinc-600">
            🚀 Built for the Future of Banking
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tight mb-6 leading-tight">
            AI-Powered <br/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-amber-600">
              Credit Risk Intelligence
            </span>
          </h1>
          <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automate the extraction, monitoring, and reporting of complex loan covenants. 
            Turn static PDF agreements into live, actionable risk data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* THIS BUTTON LINKS TO THE DASHBOARD */}
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-base bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 text-white">
                Start Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<Zap className="h-6 w-6 text-amber-500"/>}
                title="Instant Extraction"
                desc="Upload PDF agreements and get structured JSON data in seconds via LLM analysis."
            />
            <FeatureCard 
                icon={<Lock className="h-6 w-6 text-green-500"/>}
                title="Risk Monitoring"
                desc="Real-time dashboard tracking financial ratios against covenant thresholds."
            />
            <FeatureCard 
                icon={<BarChart3 className="h-6 w-6 text-blue-500"/>}
                title="Automated Reports"
                desc="Generate compliance certificates and audit logs with one click."
            />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({icon, title, desc}: any) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="h-12 w-12 bg-white border border-zinc-200 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    {icon}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </CardContent>
        </Card>
    )
}