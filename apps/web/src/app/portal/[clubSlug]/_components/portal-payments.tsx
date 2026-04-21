"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Check, ChevronRight, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@zenzo/utils";
import { type PortalClubProps, getDaysUntilDue } from "./portal-shared";

// ─── Razorpay window types ────────────────────────────────────────────────────

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.head.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = Pick<PortalClubProps, "membership" | "feePlan" | "payments"> & { clubSlug: string };

type PayState = "idle" | "loading" | "processing" | "success" | "error";

export function PortalPayments({ membership, feePlan, payments, clubSlug }: Props) {
  const daysUntilDue = getDaysUntilDue(membership.next_due_date);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 5;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  const [payState, setPayState] = useState<PayState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canPay =
    feePlan &&
    (membership.status === "active" || membership.status === "overdue" || membership.status === "expired");

  const handlePayNow = useCallback(async () => {
    setPayState("loading");
    setErrorMsg(null);

    try {
      // 1. Load Razorpay script
      await loadRazorpayScript();

      // 2. Create order on server
      const orderRes = await fetch(`/api/portal/${clubSlug}/create-order`, { method: "POST" });
      if (!orderRes.ok) {
        const { error } = await orderRes.json() as { error?: string };
        throw new Error(error ?? "Could not create order");
      }
      const orderData = await orderRes.json() as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        clubName: string;
        planName: string;
        membershipId: string;
      };

      setPayState("processing");

      // 3. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: orderData.clubName,
          description: orderData.planName,
          order_id: orderData.orderId,
          theme: { color: "hsl(var(--color-brand))" },
          modal: {
            ondismiss: () => reject(new Error("dismissed")),
          },
          handler: async (response) => {
            try {
              // 4. Verify payment on server
              const verifyRes = await fetch(`/api/portal/${clubSlug}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  membershipId: orderData.membershipId,
                }),
              });
              if (!verifyRes.ok) throw new Error("Payment verification failed");
              setPayState("success");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        rzp.open();
      });
    } catch (err) {
      if (err instanceof Error && err.message === "dismissed") {
        setPayState("idle");
      } else {
        setPayState("error");
        setErrorMsg(err instanceof Error ? err.message : "Payment failed. Please try again.");
      }
    }
  }, [clubSlug]);

  return (
    <div className="space-y-4">
      {/* Due card */}
      <div
        className={`rounded-2xl p-6 border ${
          isOverdue
            ? "bg-error border-error-accent"
            : isUrgent
              ? "bg-warning border-warning-accent"
              : "bg-surface-raised border-border"
        }`}
      >
        <p className="text-muted font-bold uppercase tracking-widest mb-3" style={{ fontSize: "10px" }}>
          Next payment
        </p>
        {feePlan ? (
          <p className="text-3xl font-bold text-heading">{formatCurrency(feePlan.amount_paise)}</p>
        ) : (
          <p className="text-xl font-bold text-heading">—</p>
        )}
        {membership.next_due_date && (
          <p className={`text-sm mt-2 font-medium ${isOverdue ? "text-error-foreground" : isUrgent ? "text-warning-foreground" : "text-muted"}`}>
            {isOverdue
              ? `${Math.abs(daysUntilDue!)} days overdue`
              : daysUntilDue === 0
                ? "Due today"
                : `Due in ${daysUntilDue} days · ${formatDate(membership.next_due_date)}`}
          </p>
        )}
        {feePlan && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-subtle text-brand">
            {feePlan.name} · {feePlan.billing_cycle}
          </div>
        )}

        {/* Pay Now CTA */}
        {payState === "success" ? (
          <div className="mt-5 flex items-center gap-2 text-success-foreground font-semibold text-sm">
            <CheckCircle2 className="size-5" />
            Payment successful! Your membership is now active.
          </div>
        ) : canPay ? (
          <div className="mt-5 space-y-2">
            <button
              onClick={handlePayNow}
              disabled={payState === "loading" || payState === "processing"}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {payState === "loading" || payState === "processing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {payState === "loading" ? "Preparing…" : "Processing…"}
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  Pay {feePlan ? formatCurrency(feePlan.amount_paise) : ""} now
                </>
              )}
            </button>
            {payState === "error" && errorMsg && (
              <p className="text-xs text-error-foreground text-center">{errorMsg}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-placeholder mt-3">Pay your coach directly</p>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-heading font-semibold">Payment history</p>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted text-sm">
            No payments recorded yet
          </div>
        ) : (
          <div>
            {payments.map((p, i) => (
              <Link
                key={p.id}
                href={`/portal/${clubSlug}/payments/${p.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-surface-subtle transition-colors ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-success flex items-center justify-center">
                    <Check className="size-4 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-heading font-semibold">
                      {formatCurrency(p.amount_paise)}
                    </p>
                    <p className="text-muted text-xs">
                      {formatDate(p.payment_date)} · {p.method.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-placeholder" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
