"use client";

// ─── RecordPaymentModal ────────────────────────────────────────────────────────
//
// Form to record a payment for a member.
// Captures: amount, method, date, note.

import * as React from "react";
import {
  Button,
  FormField,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@zenzo/ui";
import { PaymentMethod } from "@zenzo/database/enums";

interface MemberDetail {
  membershipId: string;
  fullName: string;
  planAmountPaise: number | null;
}

interface RecordPaymentModalProps {
  clubSlug: string;
  member: MemberDetail;
  onClose: () => void;
  onSuccess: () => void;
}

const METHOD_OPTIONS = [
  { value: PaymentMethod.Cash,  label: "Cash" },
  { value: PaymentMethod.UPI,   label: "UPI" },
  { value: PaymentMethod.Bank,  label: "Bank Transfer" },
  { value: PaymentMethod.Other, label: "Other" },
];

export function RecordPaymentModal({
  clubSlug,
  member,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const [amountRupees, setAmountRupees] = React.useState(
    member.planAmountPaise ? (member.planAmountPaise / 100).toString() : ""
  );
  const [method, setMethod] = React.useState<PaymentMethod>(PaymentMethod.UPI);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const amount_paise = Math.round(parseFloat(amountRupees) * 100);

    try {
      const res = await fetch(`/api/members/${member.membershipId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubSlug,
          amount_paise,
          method,
          payment_date: date,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error ?? "Failed to record payment");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-[14px] text-muted mb-4">
            Record a payment for <strong>{member.fullName}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (₹)" required>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="0.00"
                required
              />
            </FormField>

            <FormField label="Method" required>
              <Select value={method} onValueChange={(val) => setMethod(val as PaymentMethod)}>
                <SelectTrigger />
                <SelectContent>
                  {METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Payment Date" required>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Note (Optional)">
            <Input
              placeholder="e.g. Month of June"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>

          {error && (
            <p className="text-[13px] text-error-foreground font-medium">
              {error}
            </p>
          )}

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
