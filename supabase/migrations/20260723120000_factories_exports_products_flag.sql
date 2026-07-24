-- SAQEEL Design System correction backlog · O-13 / IPAD-FIGMA-DELTA §2B.
-- "هل يتم تصدير منتجات؟" — export-products yes/no flag on the establishment
-- profile, requested on Field Establishment File. Nullable: no source feed
-- populates this today, so existing rows stay "unknown" rather than a
-- fabricated false.
alter table factories add column if not exists exports_products boolean;
