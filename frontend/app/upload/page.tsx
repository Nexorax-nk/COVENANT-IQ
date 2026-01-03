"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, FileText, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

// Define the shape of data we expect from our Python Backend
interface ExtractedData {
  borrower_name: string;
  loan_amount: string;
  effective_date: string;
  covenants: {
    name: string;
    operator: string;
    threshold: string;
    confidence: string;
  }[];
}

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ExtractedData | null>(null);

  // REAL BACKEND INTEGRATION
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setStep("processing");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call your FastAPI Backend
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const result = await response.json();
      setData(result); // Save the real AI data
      setStep("review");
      
    } catch (error) {
      console.error(error);
      alert("Error analyzing file. Please ensure the backend is running.");
      setStep("upload");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">New Agreement Analysis</h1>
        <p className="text-zinc-500 mt-1">Upload a loan agreement (PDF) to extract covenants using OpenAI.</p>
      </div>

      {/* STEP 1: UPLOAD BOX */}
      {step === "upload" && (
        <Card className="border-dashed border-2 border-zinc-300 shadow-none hover:bg-zinc-50/50 transition-all cursor-pointer h-96 flex flex-col items-center justify-center text-center relative">
          {/* Invisible File Input covering the card */}
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="p-4 bg-zinc-100 rounded-full mb-4">
            <UploadCloud className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">Click to Upload Loan Agreement</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            Drag and drop your PDF here, or click to browse. Max 50MB.
          </p>
        </Card>
      )}

      {/* STEP 2: REAL LOADING STATE */}
      {step === "processing" && (
        <Card className="h-96 flex flex-col items-center justify-center text-center border-zinc-200">
          <div className="w-full max-w-md space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-16 w-16 text-red-600 animate-spin relative z-10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 animate-pulse">Analyzing with OpenAI...</h3>
              <p className="text-zinc-500 text-sm">Extracting covenants and financial definitions.</p>
              <Progress value={66} className="h-2 w-full bg-zinc-100 animate-pulse" />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: RESULTS & REVIEW (Populated with REAL Data) */}
      {step === "review" && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* LEFT: PDF PREVIEW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Document Source
              </h3>
              <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500">Processed via GPT-4o</span>
            </div>
            <div className="h-150 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center relative overflow-hidden">
               <div className="text-center">
                <FileText className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">PDF Content Analyzed</p>
              </div>
            </div>
          </div>

          {/* RIGHT: EXTRACTED DATA FORM */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" /> Extraction Complete
              </h3>
            </div>

            <Card className="border-red-100 bg-red-50/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-red-900">Extracted Covenants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label>Borrower Entity</Label>
                  <Input defaultValue={data.borrower_name} className="bg-white border-zinc-200 font-medium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>Loan Amount</Label>
                    <Input defaultValue={data.loan_amount} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Input defaultValue={data.effective_date} className="bg-white" />
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <Label className="text-zinc-900 font-semibold">Financial Covenants Found ({data.covenants.length})</Label>
                  
                  {data.covenants.map((cov, index) => (
                    <div key={index} className="p-3 bg-white border border-zinc-200 rounded-md shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-zinc-800">{cov.name}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{cov.confidence} Conf.</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <span className="text-xs text-zinc-500">Operator</span>
                          <Input defaultValue={cov.operator} className="h-8 text-sm" />
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-zinc-500">Threshold</span>
                          <Input defaultValue={cov.threshold} className="h-8 text-sm font-bold text-red-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {data.covenants.length === 0 && (
                    <div className="p-4 text-center text-sm text-zinc-500 bg-zinc-50 rounded border border-dashed">
                      No specific financial covenants found in this document section.
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
                  onClick={() => router.push('/')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Add to Portfolio
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}