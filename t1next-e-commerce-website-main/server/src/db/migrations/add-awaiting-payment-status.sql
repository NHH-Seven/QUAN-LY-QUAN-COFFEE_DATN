-- Add awaiting_payment status to OrderStatus enum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'awaiting_payment' BEFORE 'confirmed';
