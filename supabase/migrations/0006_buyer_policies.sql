-- Buyers read own orders/items/payments
create policy "buyers own orders" on orders for select using (buyer_id = auth.uid());
create policy "buyers own items" on order_items for select using (
  order_id in (select id from orders where buyer_id = auth.uid())
);
create policy "buyers own payments" on payments for select using (
  order_id in (select id from orders where buyer_id = auth.uid())
);
