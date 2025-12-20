"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, FileText, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");

  // SIMULATE AI ANALYSIS (The "Fake It" Engine)
  useEffect(() => {
    if (step === "processing") {
      const stages = [
        { p: 10, text: "Uploading Document..." },
        { p: 30, text: "OCR Scanning PDF..." },
        { p: 55, text: "Identifying Borrower Obligations..." },
        { p: 80, text: "Extracting Financial Ratios..." },
        { p: 100, text: "Analysis Complete." },
      ];

      let currentStage = 0;
      const interval = setInterval(() => {
        if (currentStage >= stages.length) {
          clearInterval(interval);
          setTimeout(() => setStep("review"), 500); // Wait a bit then show results
          return;
        }
        setProgress(stages[currentStage].p);
        setLoadingText(stages[currentStage].text);
        currentStage++;
      }, 800); // Change text every 800ms
    }
  }, [step]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">New Agreement Analysis</h1>
        <p className="text-zinc-500 mt-1">Upload a loan agreement (PDF) to automatically extract covenants.</p>
      </div>

      {/* STEP 1: UPLOAD BOX */}
      {step === "upload" && (
        <Card className="border-dashed border-2 border-zinc-300 shadow-none hover:bg-zinc-50/50 transition-all cursor-pointer h-96 flex flex-col items-center justify-center text-center"
          onClick={() => setStep("processing")}
        >
          <div className="p-4 bg-zinc-100 rounded-full mb-4">
            <UploadCloud className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">Click to Upload Loan Agreement</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            Drag and drop your PDF here, or click to browse. Supports LMA standard formats up to 50MB.
          </p>
        </Card>
      )}

      {/* STEP 2: FAKE AI LOADING SCREEN */}
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
              <h3 className="text-xl font-semibold text-zinc-900 animate-pulse">{loadingText}</h3>
              <Progress value={progress} className="h-2 w-full bg-zinc-100" />
              <p className="text-xs text-zinc-400 font-mono">AI_MODEL_V2.1 :: PROCESSING_CHUNKS</p>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: RESULTS & REVIEW (Split Screen) */}
      {step === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* LEFT: PDF PREVIEW (Placeholder) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Document Preview
              </h3>
              <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500">term_sheet_final_v3.pdf</span>
            </div>
            <div className="h-150 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
              {/* Fake PDF Lines */}
              <div className="absolute inset-0 p-8 space-y-4 opacity-30 select-none">
                <div className="w-3/4 h-4 bg-white/20 rounded"></div>
                <div className="w-full h-2 bg-white/10 rounded"></div>
                <div className="w-full h-2 bg-white/10 rounded"></div>
                <div className="w-5/6 h-2 bg-white/10 rounded"></div>
                <div className="w-full h-2 bg-white/10 rounded"></div>
                <div className="mt-8 w-1/2 h-4 bg-white/20 rounded"></div>
                <div className="w-full h-2 bg-white/10 rounded"></div>
                <div className="w-full h-2 bg-white/10 rounded"></div>
              </div>
              <div className="z-10 text-center">
                <FileText className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">PDF Viewer Active</p>
              </div>
            </div>
          </div>

          {/* RIGHT: EXTRACTED DATA FORM */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" /> AI Extraction Confidence: 98%
              </h3>
            </div>

            <Card className="border-red-100 bg-red-50/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-red-900">Extracted Covenants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label>Borrower Entity</Label>
                  <Input defaultValue="Nexus Energy Solutions Ltd." className="bg-white border-zinc-200 font-medium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>Loan Amount</Label>
                    <Input defaultValue="$45,000,000" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Input defaultValue="2025-10-01" className="bg-white" />
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <Label className="text-zinc-900 font-semibold">Financial Covenants Identified (2)</Label>
                  
                  <div className="p-3 bg-white border border-zinc-200 rounded-md shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-zinc-800">Leverage Ratio</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">High Confidence</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <span className="text-xs text-zinc-500">Operator</span>
                        <Input defaultValue="<" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-zinc-500">Threshold Value</span>
                        <Input defaultValue="4.00x" className="h-8 text-sm font-bold text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-zinc-200 rounded-md shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-zinc-800">Interest Coverage</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">High Confidence</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <span className="text-xs text-zinc-500">Operator</span>
                        <Input defaultValue=">" className="h-8 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-zinc-500">Threshold Value</span>
                        <Input defaultValue="3.50x" className="h-8 text-sm font-bold text-red-600" />
                      </div>
                    </div>
                  </div>
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