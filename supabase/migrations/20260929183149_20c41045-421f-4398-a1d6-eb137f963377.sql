CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid UNIQUE,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  instagram_url text,
  whatsapp_number text,
  email text,
  phone text,
  address text,
  maps_url text,
  accent_color text DEFAULT '#B5654A',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stores are public" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Owners update store" ON public.stores FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  image_url text,
  mrp numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  is_listed boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  popularity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_store_idx ON public.products(store_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listed products are public" ON public.products FOR SELECT USING (is_listed = true);
CREATE POLICY "Owners read own products" ON public.products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owners insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owners update products" ON public.products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owners delete products" ON public.products FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('VR' || to_char(now(),'YYMMDD') || '-' || upper(substr(md5(random()::text),1,5))),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'COD',
  status text NOT NULL DEFAULT 'Order Received',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_store_idx ON public.orders(store_id);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read orders" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owners update orders" ON public.orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  image_url text,
  mrp numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- Place order (public, validates stock + prices)
CREATE OR REPLACE FUNCTION public.place_order(_store_id uuid, _customer jsonb, _items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _order_id uuid; _num text; _item jsonb; _p public.products%ROWTYPE; _qty int;
  _sub numeric := 0; _tot numeric := 0;
BEGIN
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
  IF coalesce(trim(_customer->>'name'),'') = '' OR coalesce(trim(_customer->>'phone'),'') = ''
     OR coalesce(trim(_customer->>'address'),'') = '' OR coalesce(trim(_customer->>'city'),'') = ''
     OR coalesce(trim(_customer->>'state'),'') = '' OR coalesce(trim(_customer->>'pincode'),'') = '' THEN
    RAISE EXCEPTION 'Missing customer details';
  END IF;
  INSERT INTO public.orders(store_id, customer_name, customer_phone, customer_email, address, city, state, pincode)
  VALUES (_store_id, left(_customer->>'name',120), left(_customer->>'phone',20), nullif(left(_customer->>'email',200),''),
          left(_customer->>'address',500), left(_customer->>'city',100), left(_customer->>'state',100), left(_customer->>'pincode',10))
  RETURNING id, order_number INTO _order_id, _num;
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 20 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT * INTO _p FROM public.products WHERE id = (_item->>'product_id')::uuid AND store_id = _store_id AND is_listed FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    IF _p.stock < _qty THEN RAISE EXCEPTION '% is out of stock', _p.name; END IF;
    UPDATE public.products SET stock = stock - _qty, popularity = popularity + _qty WHERE id = _p.id;
    INSERT INTO public.order_items(order_id, store_id, product_id, product_name, image_url, mrp, unit_price, quantity)
    VALUES (_order_id, _store_id, _p.id, _p.name, _p.image_url, _p.mrp, _p.sale_price, _qty);
    _sub := _sub + _p.mrp * _qty; _tot := _tot + _p.sale_price * _qty;
  END LOOP;
  UPDATE public.orders SET subtotal = _sub, discount = _sub - _tot, total = _tot WHERE id = _order_id;
  RETURN jsonb_build_object('id', _order_id, 'order_number', _num);
END; $$;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, jsonb, jsonb) TO anon, authenticated;

-- Public order lookup by unguessable id
CREATE OR REPLACE FUNCTION public.get_order(_order_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status, 'created_at', o.created_at,
    'customer_name', o.customer_name, 'customer_phone', o.customer_phone, 'address', o.address,
    'city', o.city, 'state', o.state, 'pincode', o.pincode, 'subtotal', o.subtotal,
    'discount', o.discount, 'total', o.total, 'payment_method', o.payment_method,
    'items', coalesce((SELECT jsonb_agg(jsonb_build_object('product_name', i.product_name, 'image_url', i.image_url,
       'unit_price', i.unit_price, 'mrp', i.mrp, 'quantity', i.quantity)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb))
  FROM public.orders o WHERE o.id = _order_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_order(uuid) TO anon, authenticated;

-- Seller: get or claim a store
CREATE OR REPLACE FUNCTION public.ensure_my_store()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO _id FROM public.stores WHERE owner_id = _uid;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  UPDATE public.stores SET owner_id = _uid WHERE slug = 'vira' AND owner_id IS NULL RETURNING id INTO _id;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  INSERT INTO public.stores(owner_id, slug, name) VALUES (_uid, 'store-' || substr(replace(_uid::text,'-',''),1,8), 'My Store') RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.ensure_my_store() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ensure_my_store() TO authenticated;

-- Seed VIRA
INSERT INTO public.stores(id, slug, name, tagline, description, instagram_url, whatsapp_number, email, phone, address, maps_url)
VALUES ('11111111-1111-1111-1111-111111111111','vira','VIRA','Everyday pieces, beautifully made.',
 'VIRA is a women''s fashion label for effortless everyday dressing — soft fabrics, clean silhouettes and accessories you''ll reach for daily.',
 'https://instagram.com/vira.store','919876543210','hello@vira.store','+91 98765 43210','12 Linking Road, Bandra West, Mumbai 400050','https://maps.google.com/?q=Linking+Road+Bandra');

INSERT INTO public.products(store_id, name, description, category, image_url, mrp, sale_price, stock, is_featured, is_best_seller, popularity) VALUES
('11111111-1111-1111-1111-111111111111','Oversized T-Shirt','Relaxed-fit cotton tee with dropped shoulders. Soft, breathable, and made for all-day wear.','Tops','/products/oversized-tee.jpg',999,499,24,true,true,86),
('11111111-1111-1111-1111-111111111111','Ribbed Top','Fitted ribbed knit top with a square neckline. Pairs with everything from denims to skirts.','Tops','/products/ribbed-top.jpg',899,549,15,true,false,54),
('11111111-1111-1111-1111-111111111111','Classic Tote Bag','Roomy structured tote in vegan leather with an inner zip pocket. Fits a laptop and your day.','Bags','/products/tote-bag.jpg',1999,1199,8,true,true,72),
('11111111-1111-1111-1111-111111111111','Everyday Hoodie','Brushed fleece hoodie in a cropped relaxed fit. Your cosiest layer for cool evenings.','Outerwear','/products/hoodie.jpg',1799,999,0,false,true,65),
('11111111-1111-1111-1111-111111111111','Minimal Pendant','Delicate gold-plated pendant on a fine chain. Tarnish-resistant and made to layer.','Accessories','/products/pendant.jpg',799,399,30,true,false,41);