"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { parseTripsCSV, parseTripsFile, type TripsParseResult } from "@/lib/parsers/trips-parser";
import { importTrips } from "@/actions/forecasting";
import { getUserSettings } from "@/actions/settings";
import { toast } from "sonner";

interface TripsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "importing";

export function TripsImportModal({ open, onOpenChange, onSuccess }: TripsImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<TripsParseResult | null>(null);
  const [pasteData, setPasteData] = useState("");
  const [excludedAddresses, setExcludedAddresses] = useState<string[]>(["MSP7", "MSP8", "MSP9"]);

  // Load user's excluded addresses
  useEffect(() => {
    async function loadSettings() {
      const result = await getUserSettings();
      if (result.success && result.data) {
        setExcludedAddresses(result.data.excludedAddresses);
      }
    }
    if (open) {
      loadSettings();
    }
  }, [open]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    const result = await parseTripsFile(file, excludedAddresses);
    setParseResult(result);

    if (result.success && result.trips.length > 0) {
      setStep("preview");
    } else {
      toast.error(result.errors[0] || "Failed to parse file");
    }
  }, [excludedAddresses]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handlePaste = async () => {
    if (!pasteData.trim()) {
      toast.error("Please paste trip data");
      return;
    }

    const result = parseTripsCSV(pasteData, excludedAddresses);
    setParseResult(result);

    if (result.success && result.trips.length > 0) {
      setStep("preview");
    } else {
      toast.error(result.errors[0] || "Failed to parse data");
    }
  };

  const handleImport = async () => {
    if (!parseResult?.trips.length) return;

    setStep("importing");

    try {
      const result = await importTrips(parseResult.trips);

      if (result.success) {
        const { imported, updated } = result.data!;
        toast.success(`Imported ${imported} trips, updated ${updated} existing trips`);
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || "Failed to import trips");
        setStep("preview");
      }
    } catch {
      toast.error("Failed to import trips");
      setStep("preview");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setParseResult(null);
    setPasteData("");
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Trips</DialogTitle>
          <DialogDescription>
            Upload an Amazon Scheduler CSV file or paste trip data
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="paste">Paste Data</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: .csv, .tsv (tab-delimited)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <Textarea
                placeholder="Paste your trip data here (tab-delimited from Amazon Scheduler)..."
                className="min-h-[200px] font-mono text-xs"
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
              />
              <Button onClick={handlePaste} className="w-full" disabled={!pasteData.trim()}>
                <Upload className="mr-2 h-4 w-4" />
                Parse Data
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {step === "preview" && parseResult && (
          <div className="space-y-4">
            <Alert variant="default" className="border-emerald-200 bg-emerald-50/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">Data Parsed Successfully</AlertTitle>
              <AlertDescription className="text-emerald-700">
                Found {parseResult.stats.totalTrips} trips with {parseResult.stats.totalLoads} loads
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold">{parseResult.stats.totalTrips}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Projected Loads</p>
                <p className="text-2xl font-bold">
                  {parseResult.trips.reduce((sum, t) => sum + t.projectedLoads, 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{parseResult.stats.totalLoads}</p>
                <p className="text-muted-foreground">Total Loads</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{parseResult.stats.bobtailLoads}</p>
                <p className="text-muted-foreground">Bobtail Loads</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{parseResult.stats.canceledTrips}</p>
                <p className="text-muted-foreground">Canceled</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">Projected Revenue: </span>
                {formatCurrency(parseResult.trips.reduce((sum, t) => sum + (t.projectedRevenue || 0), 0))}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Based on $452 DTR + estimated accessorials
              </p>
            </div>

            {parseResult.warnings.length > 0 && (
              <Alert variant="default" className="border-amber-200 bg-amber-50/50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Warnings</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <ul className="list-disc list-inside text-xs mt-1">
                    {parseResult.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parseResult.warnings.length > 3 && (
                      <li>...and {parseResult.warnings.length - 3} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport}>
                <Truck className="mr-2 h-4 w-4" />
                Import {parseResult.stats.totalTrips} Trips
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Importing trips...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
