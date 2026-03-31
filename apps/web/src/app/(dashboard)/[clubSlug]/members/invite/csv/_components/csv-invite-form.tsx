"use client";

// ─── CsvInviteForm ────────────────────────────────────────────────────────────
//
// 1. User pastes CSV text or uploads a file.
// 2. We parse it into preview rows (name, phone, email).
// 3. User selects batch + plan, then clicks "Send Invites".
// 4. We POST each row to /api/members/invite sequentially and track results.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle } from "lucide-react";
import {
  Button,
  FormField,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  cn,
} from "@zenzo/ui";
import { formatCurrency } from "@zenzo/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Batch { id: string; name: string }
interface Plan  { id: string; name: string; amount_paise: number }

interface ParsedRow {
  name:  string;
  phone: string;
  email: string;
  error: string | null; // validation error
}

type InviteResultStatus = "pending" | "success" | "error" | "exists";

interface InviteResult {
  row:    ParsedRow;
  status: InviteResultStatus;
  detail: string;
}

interface CsvInviteFormProps {
  clubSlug: string;
  batches:  Batch[];
  plans:    Plan[];
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect if first row is a header
  const firstLower = lines[0].toLowerCase();
  const hasHeader  = firstLower.includes("name") || firstLower.includes("phone") || firstLower.includes("email");
  const dataLines  = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const [rawName = "", rawPhone = "", rawEmail = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));

    let error: string | null = null;
    if (!rawName)                                   error = "Name is required";
    else if (!/^\d{10}$/.test(rawPhone))            error = "Phone must be 10 digits";
    else if (rawEmail && !/\S+@\S+\.\S+/.test(rawEmail)) error = "Invalid email";

    return { name: rawName, phone: rawPhone, email: rawEmail, error };
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function CsvInviteForm({ clubSlug, batches, plans }: CsvInviteFormProps) {
  const router = useRouter();

  const [csvText,    setCsvText]    = React.useState("");
  const [rows,       setRows]       = React.useState<ParsedRow[]>([]);
  const [batchId,    setBatchId]    = React.useState(batches[0]?.id ?? "");
  const [planId,     setPlanId]     = React.useState(plans[0]?.id ?? "");
  const [startDate,  setStartDate]  = React.useState(new Date().toISOString().slice(0, 10));
  const [results,    setResults]    = React.useState<InviteResult[] | null>(null);
  const [isSending,  setIsSending]  = React.useState(false);

  const validRows   = rows.filter((r) => !r.error);
  const invalidRows = rows.filter((r) => r.error);
  const isPreviewing = rows.length > 0 && !results;

  const handleParse = () => {
    setResults(null);
    setRows(parseCsv(csvText));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setResults(null);
      setRows(parseCsv(text));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (validRows.length === 0) return;
    setIsSending(true);

    const resultList: InviteResult[] = [];

    for (const row of validRows) {
      try {
        const res = await fetch("/api/members/invite", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            clubSlug,
            phone:     row.phone,
            email:     row.email || undefined,
            fullName:  row.name,
            batchId:   batchId || undefined,
            planId:    planId  || undefined,
            startDate,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          resultList.push({ row, status: "error", detail: data.error ?? "Unknown error" });
        } else if (data.status === "not_on_zenzo" || data.status === "invite_sent") {
          resultList.push({ row, status: "success", detail: "Invite sent" });
        } else if (data.status === "already_member") {
          resultList.push({ row, status: "exists", detail: "Already a member" });
        } else {
          resultList.push({ row, status: "success", detail: "Added" });
        }
      } catch {
        resultList.push({ row, status: "error", detail: "Network error" });
      }
    }

    setResults(resultList);
    setIsSending(false);
  };

  const successCount = results?.filter((r) => r.status === "success").length ?? 0;
  const errorCount   = results?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Step 1: Paste or upload ──────────────────────────────────────────── */}
      {!isPreviewing && !results && (
        <div className="rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-foreground">Step 1 — Paste CSV</h2>
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.txt" className="sr-only" onChange={handleFileUpload} />
              <span className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline">
                <Upload className="size-3.5" />
                Upload file
              </span>
            </label>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"name,phone,email\nRahul Sharma,9876543210,rahul@example.com\nPriya Singh,9123456789,"}
            rows={8}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-3 py-2.5",
              "font-mono text-[12px] text-foreground placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "resize-y"
            )}
          />
          <Button
            variant="primary"
            disabled={!csvText.trim()}
            onClick={handleParse}
          >
            Preview
          </Button>
        </div>
      )}

      {/* ── Step 2: Preview + settings ──────────────────────────────────────── */}
      {isPreviewing && (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-surface-subtle border-b border-border flex items-center justify-between">
              <p className="text-[13px] font-medium text-foreground">
                {rows.length} row{rows.length !== 1 ? "s" : ""} parsed
                {invalidRows.length > 0 && (
                  <span className="ml-2 text-error-foreground">
                    · {invalidRows.length} invalid (will be skipped)
                  </span>
                )}
              </p>
              <button
                onClick={() => setRows([])}
                className="text-[12px] text-muted hover:text-foreground"
              >
                Edit CSV
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-[13px]",
                    r.error ? "bg-error-subtle/30" : ""
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{r.name || "—"}</span>
                    <span className="text-muted ml-3 font-mono">{r.phone}</span>
                    {r.email && <span className="text-muted ml-3">{r.email}</span>}
                  </div>
                  {r.error
                    ? <span className="text-[12px] text-error-foreground shrink-0">{r.error}</span>
                    : <CheckCircle2 className="size-4 text-success-foreground shrink-0" />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-foreground">Step 2 — Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Batch" htmlFor="batchId">
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger id="batchId" placeholder="No batch" />
                  <SelectContent>
                    <SelectItem value="">No batch</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Fee Plan" htmlFor="planId">
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="planId" placeholder="No plan" />
                  <SelectContent>
                    <SelectItem value="">No plan</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.amount_paise)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Start Date" htmlFor="startDate">
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={cn(
                    "w-full h-10 rounded-lg border border-border bg-background px-3",
                    "text-[14px] text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setRows([])}>Back</Button>
            <Button
              variant="primary"
              disabled={isSending || validRows.length === 0}
              onClick={handleSend}
            >
              {isSending
                ? "Sending invites…"
                : `Send ${validRows.length} Invite${validRows.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </>
      )}

      {/* ── Step 3: Results ─────────────────────────────────────────────────── */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-success-foreground text-[14px] font-medium">
              <CheckCircle2 className="size-4" />
              {successCount} sent
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 text-error-foreground text-[14px] font-medium">
                <XCircle className="size-4" />
                {errorCount} failed
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{r.row.name}</span>
                  <span className="text-muted ml-3 font-mono">{r.row.phone}</span>
                </div>
                <span className={cn(
                  "text-[12px] shrink-0",
                  r.status === "success" ? "text-success-foreground" :
                  r.status === "exists"  ? "text-muted" :
                  "text-error-foreground"
                )}>
                  {r.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push(`/${clubSlug}/members`)}>
              Back to Members
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setResults(null); setRows([]); setCsvText(""); }}
            >
              Import More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
