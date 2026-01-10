"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, FileText, CheckCircle2, Loader2, ShieldCheck, PencilLine } from "lucide-react";

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

  // 1. UPLOAD & ANALYZE (The AI Step)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setStep("processing");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const result = await response.json();
      setData(result);
      setStep("review");
      
    } catch (error) {
      console.error(error);
      alert("Error analyzing file. Is the backend running?");
      setStep("upload");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. UPDATE HANDLERS (Fixes the "Edit not working" issue)
  const updateMainField = (field: keyof ExtractedData, value: string) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const updateCovenant = (index: number, field: string, value: string) => {
    if (!data) return;
    const updatedCovenants = [...data.covenants];
    // @ts-ignore
    updatedCovenants[index][field] = value;
    setData({ ...data, covenants: updatedCovenants });
  };

  // 3. SAVE TO DATABASE
  const handleConfirm = async () => {
    if (!data) return;

    try {
      // This sends the *edited* data to your SQLite database
      const response = await fetch("http://localhost:8000/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), 
      });

      if (response.ok) {
        router.push('/'); 
      } else {
        alert("Failed to save loan to database.");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Connection error. Ensure backend is running.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">New Agreement Analysis</h1>
        <p className="text-zinc-500 mt-1">Upload a loan agreement (PDF) to extract covenants using AI.</p>
      </div>

      {/* STEP 1: UPLOAD BOX */}
      {step === "upload" && (
        <Card className="border-dashed border-2 border-zinc-300 shadow-none hover:bg-zinc-50/50 transition-all cursor-pointer h-96 flex flex-col items-center justify-center text-center relative group">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="p-4 bg-zinc-100 rounded-full mb-4 group-hover:bg-red-50 group-hover:scale-110 transition-all duration-300">
            <UploadCloud className="h-10 w-10 text-zinc-400 group-hover:text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">Click to Upload Loan Agreement</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            Drag and drop your PDF here, or click to browse. Max 50MB.
          </p>
        </Card>
      )}

      {/* STEP 2: PROCESSING STATE */}
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
              <h3 className="text-xl font-semibold text-zinc-900 animate-pulse">Analyzing with AI...</h3>
              <p className="text-zinc-500 text-sm">Extracting covenants and financial definitions.</p>
              <Progress value={66} className="h-2 w-full bg-zinc-100 animate-pulse" />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: REVIEW & CONFIRM (EDITABLE) */}
      {step === "review" && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* LEFT: VISUAL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Document Source
              </h3>
              <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500">Processed via Llama-3.3</span>
            </div>
            <div className="h-150 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="text-center opacity-50">
                <FileText className="h-20 w-20 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400 text-sm font-mono tracking-widest uppercase">PDF Preview</p>
              </div>
            </div>
          </div>

          {/* RIGHT: DATA FORM */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Data Validation
              </h3>
              <span className="text-xs text-zinc-400 italic">Please review before confirming</span>
            </div>

            <Card className="border-red-100 bg-red-50/10 shadow-sm">
              <CardHeader className="pb-3 border-b border-red-100/50 bg-red-50/30">
                <CardTitle className="text-base font-bold text-red-900 flex items-center gap-2">
                  <PencilLine className="h-4 w-4" /> Edit Extracted Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                
                {/* Main Fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Borrower Entity</Label>
                    <Input 
                      value={data.borrower_name} 
                      onChange={(e) => updateMainField('borrower_name', e.target.value)}
                      className="bg-white border-zinc-200 font-medium text-zinc-900 focus-visible:ring-red-500" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                      <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Loan Amount</Label>
                      <Input 
                        value={data.loan_amount} 
                        onChange={(e) => updateMainField('loan_amount', e.target.value)}
                        className="bg-white border-zinc-200 focus-visible:ring-red-500" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Effective Date</Label>
                      <Input 
                        type="date"
                        value={data.effective_date} 
                        onChange={(e) => updateMainField('effective_date', e.target.value)}
                        className="bg-white border-zinc-200 focus-visible:ring-red-500" 
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-red-200/50" />

                {/* Covenants List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <Label className="text-zinc-900 font-bold">Financial Covenants ({data.covenants.length})</Label>
                     <span className="text-xs text-red-600 font-medium cursor-pointer hover:underline">+ Add Manual</span>
                  </div>
                  
                  {data.covenants.map((cov, index) => (
                    <div key={index} className="p-3 bg-white border border-zinc-200 rounded-md shadow-sm transition-all hover:border-red-300 hover:shadow-md group">
                      <div className="flex justify-between items-center mb-2">
                        <Input 
                           value={cov.name}
                           onChange={(e) => updateCovenant(index, 'name', e.target.value)}
                           className="h-7 text-sm font-bold text-zinc-800 border-none p-0 focus-visible:ring-0 w-full"
                        />
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {cov.confidence} Match
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <Label className="text-[10px] text-zinc-400 uppercase">Operator</Label>
                          <Input 
                            value={cov.operator} 
                            onChange={(e) => updateCovenant(index, 'operator', e.target.value)}
                            className="h-8 text-sm bg-zinc-50 border-zinc-100 focus-visible:ring-red-500" 
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[10px] text-zinc-400 uppercase">Threshold Value</Label>
                          <Input 
                            value={cov.threshold} 
                            onChange={(e) => updateCovenant(index, 'threshold', e.target.value)}
                            className="h-8 text-sm font-bold text-red-600 bg-zinc-50 border-zinc-100 focus-visible:ring-red-500" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white mt-4 h-12 text-base font-semibold shadow-lg shadow-red-200"
                  onClick={handleConfirm} 
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Confirm & Add to Portfolio
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}