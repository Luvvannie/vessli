-- Seller + product self-service policies (admin writes stay in Edge Function)
-- seller_profiles: user creates own, reads own
create policy "users own seller profile" on seller_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- products: sellers insert own as pending_review/draft only
create policy "sellers insert own" on products for insert with check (
  seller_id in (select id from seller_profiles where user_id = auth.uid())
  and status in ('draft','pending_review')
);

-- product_files: seller manages files for own products
create policy "sellers own files" on product_files for all using (
  product_id in (
    select p.id from products p
    join seller_profiles s on s.id = p.seller_id
    where s.user_id = auth.uid()
  )
);

-- profiles: user reads/updates own
create policy "users own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
