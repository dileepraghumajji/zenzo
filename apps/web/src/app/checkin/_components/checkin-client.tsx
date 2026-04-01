"use client";

// ─── CheckInClient ─────────────────────────────────────────────────────────────
//
// Phone entry form shown after QR scan. Submits to POST /api/checkin.
// Shows success or error state after submission.

import * as React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface Props {
  batchId:   string;
  batchName: string;
  token:     string;
  date:      string;
}

type State =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; name: string; alreadyMarked: boolean; isDropIn: boolean }
  | { type: "error"; message: string };

export function CheckInClient({ batchId, batchName, token, date }: Props) {
  const [phone, setPhone] = React.useState("");
  const [state, setState] = React.useState<State>({ type: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      setState({ type: "error", message: "Enter a valid 10-digit mobile number." });
      return;
    }

    setState({ type: "loading" });

    try {
      const res = await fetch("/api/checkin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, phone: clean }),
      });

      const data = await res.json() as {
        success?: boolean;
        name?: string;
        alreadyMarked?: boolean;
        isDropIn?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setState({ type: "error", message: data.error ?? "Something went wrong." });
        return;
      }

      setState({
        type:          "success",
        name:          data.name ?? "You",
        alreadyMarked: data.alreadyMarked ?? false,
        isDropIn:      data.isDropIn ?? false,
      });
    } catch {
      setState({ type: "error", message: "Network error. Please try again." });
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (state.type === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto size-20 rounded-full bg-success flex items-center justify-center">
          <Check className="size-10 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-foreground">
            {state.alreadyMarked ? "Already checked in!" : "Attendance marked!"}
          </h2>
          <p className="text-[15px] text-muted mt-1">
            Welcome, <span className="font-semibold text-foreground">{state.name}</span>
          </p>
          {state.isDropIn && (
            <p className="text-[13px] text-muted mt-2 bg-info-subtle px-3 py-1.5 rounded-lg inline-block">
              Marked as drop-in
            </p>
          )}
        </div>
        <p className="text-[13px] text-muted">
          {batchName} · {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "short", day: "numeric", month: "short",
          })}
        </p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-foreground">{batchName}</h1>
        <p className="text-[13px] text-muted mt-1">
          {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
      </div>

      <p className="text-[14px] text-muted">
        Enter your registered mobile number to mark your attendance.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="text-[13px] font-medium text-foreground"
          >
            Mobile Number
          </label>
          <div className="flex items-center border border-border rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring">
            <span className="px-3 py-3 text-[14px] text-muted border-r border-border bg-surface-subtle select-none">
              +91
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ""));
                if (state.type === "error") setState({ type: "idle" });
              }}
              placeholder="10-digit number"
              className="flex-1 px-3 py-3 text-[15px] text-foreground bg-transparent outline-none placeholder:text-muted"
              autoFocus
              autoComplete="tel-national"
            />
          </div>
        </div>

        {state.type === "error" && (
          <div className="flex items-start gap-2 text-[13px] text-error-foreground bg-error-subtle px-3 py-2.5 rounded-lg">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={state.type === "loading" || phone.length !== 10}
          className="w-full py-3 rounded-xl text-[15px] font-semibold bg-primary text-primary-foreground
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-primary/90 transition-colors duration-150
            flex items-center justify-center gap-2"
        >
          {state.type === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Marking attendance…
            </>
          ) : (
            "Mark Attendance"
          )}
        </button>
      </form>
    </div>
  );
}
