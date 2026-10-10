-- Admins can moderate via RLS (Edge Function still recommended for audit, but RLS enforces server-side)
create policy "admins moderate products" on products for update using (
  is_admin(auth.uid())
) with check (
  is_admin(auth.uid())
);
