-- Add 'razorpay' to the payments.method check constraint.
-- The existing constraint (if any) is dropped and recreated to include the new value.

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (method IN ('cash', 'upi', 'bank', 'razorpay', 'other'));
