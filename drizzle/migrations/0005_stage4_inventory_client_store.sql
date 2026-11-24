-- Inventory & client store
CREATE SEQUENCE public.order_ref_seq; GRANT USAGE ON SEQUENCE public.order_ref_seq TO service_role;

CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, name text NOT NULL, sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE, name text NOT NULL, category_id uuid REFERENCES public.product_categories(id),
  description text, image_urls text[] NOT NULL DEFAULT '{}', unit text NOT NULL DEFAULT 'each',
  cost_price numeric(14,2) CHECK (cost_price >= 0), selling_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  currency text NOT NULL DEFAULT 'ZMW' CHECK (currency ~ '^[A-Z]{3}$'),
  quantity_on_hand integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  is_active boolean NOT NULL DEFAULT true, is_published boolean NOT NULL DEFAULT false,
  supplier_reference text, internal_notes text,
  created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity_reserved <= quantity_on_hand));
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('SO-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.order_ref_seq')::text, 5, '0')),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  delivery_location_id uuid REFERENCES public.locations(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','dispatched','delivered','completed','cancelled','rejected')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','invoiced','partially_paid','paid','waived')),
  currency text NOT NULL, subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  delivery_instructions text, purchase_order_reference text, quotation_reference text, invoice_reference text,
  status_reason text, client_request_key text, placed_by uuid NOT NULL,
  placed_at timestamptz NOT NULL DEFAULT now(), confirmed_at timestamptz, dispatched_at timestamptz, delivered_at timestamptz,
  completed_at timestamptz, cancelled_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX store_orders_request_key_uq ON public.store_orders(organization_id, client_request_key) WHERE client_request_key IS NOT NULL;
CREATE INDEX store_orders_org_idx ON public.store_orders(organization_id, placed_at DESC);
GRANT ALL ON public.store_orders TO service_role;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.store_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.store_orders(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL, sku text NOT NULL, unit text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0), unit_price numeric(14,2) NOT NULL, currency text NOT NULL, line_total numeric(14,2) NOT NULL,
  UNIQUE (order_id, product_id));
GRANT ALL ON public.store_order_lines TO service_role;
ALTER TABLE public.store_order_lines ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  movement_type text NOT NULL CHECK (movement_type IN ('receipt','dispatch','adjustment','reservation','release','order_dispatch')),
  quantity integer NOT NULL, on_hand_after integer NOT NULL, reserved_after integer NOT NULL,
  order_id uuid REFERENCES public.store_orders(id), supplier_reference text, reference text, reason text,
  actor_user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX stock_movements_product_idx ON public.stock_movements(product_id, created_at DESC);
CREATE UNIQUE INDEX stock_movements_order_dispatch_uq ON public.stock_movements(order_id, product_id) WHERE movement_type = 'order_dispatch';
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.prevent_stock_movement_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION 'Stock movements are append-only' USING ERRCODE = '42501'; END $$;
CREATE TRIGGER stock_movements_immutable BEFORE UPDATE OR DELETE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.prevent_stock_movement_mutation();

INSERT INTO public.product_categories(code, name, sort_order) VALUES
 ('scales','Weighing scales',1),('spare_parts','Spare parts',2),('accessories','Accessories',3),('consumables','Consumables',4),('label_rolls','Label rolls',5)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.save_product_category(p_code text, p_name text, p_sort_order integer DEFAULT 0, p_status text DEFAULT 'active')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.product_categories%ROWTYPE;
BEGIN
  IF NOT public.is_stgl('inventory.manage') THEN RAISE EXCEPTION 'Inventory management denied' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.product_categories(code, name, sort_order, status) VALUES (lower(btrim(p_code)), btrim(p_name), coalesce(p_sort_order,0), coalesce(p_status,'active'))
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, status = EXCLUDED.status RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END $$;

-- Save product metadata/pricing/publication. Stock quantities are never set here.
CREATE OR REPLACE FUNCTION public.save_product(p_product_id uuid, p_sku text, p_name text, p_category_id uuid, p_selling_price numeric,
  p_currency text DEFAULT 'ZMW', p_unit text DEFAULT 'each', p_description text DEFAULT NULL, p_cost_price numeric DEFAULT NULL,
  p_low_stock_threshold integer DEFAULT 0, p_is_active boolean DEFAULT true, p_is_published boolean DEFAULT false,
  p_image_urls text[] DEFAULT '{}', p_supplier_reference text DEFAULT NULL, p_internal_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.products%ROWTYPE; v_old jsonb;
BEGIN
  IF NOT public.is_stgl('inventory.manage') THEN RAISE EXCEPTION 'Inventory management denied' USING ERRCODE = '42501'; END IF;
  IF nullif(btrim(p_sku),'') IS NULL OR nullif(btrim(p_name),'') IS NULL THEN RAISE EXCEPTION 'SKU and name required' USING ERRCODE = '22023'; END IF;
  IF p_selling_price IS NULL OR p_selling_price < 0 OR (p_cost_price IS NOT NULL AND p_cost_price < 0) THEN RAISE EXCEPTION 'Invalid price' USING ERRCODE = '22023'; END IF;
  IF p_product_id IS NULL THEN
    INSERT INTO public.products(sku, name, category_id, description, image_urls, unit, cost_price, selling_price, currency, low_stock_threshold, is_active, is_published, supplier_reference, internal_notes, created_by)
    VALUES (upper(btrim(p_sku)), btrim(p_name), p_category_id, p_description, coalesce(p_image_urls,'{}'), coalesce(p_unit,'each'), p_cost_price, p_selling_price,
      upper(coalesce(p_currency,'ZMW')), coalesce(p_low_stock_threshold,0), coalesce(p_is_active,true), coalesce(p_is_published,false) AND coalesce(p_is_active,true), p_supplier_reference, p_internal_notes, auth.uid())
    RETURNING * INTO v_row;
  ELSE
    SELECT to_jsonb(p) INTO v_old FROM public.products p WHERE id = p_product_id FOR UPDATE;
    IF v_old IS NULL THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = '22023'; END IF;
    UPDATE public.products SET sku = upper(btrim(p_sku)), name = btrim(p_name), category_id = p_category_id, description = p_description, image_urls = coalesce(p_image_urls,'{}'),
      unit = coalesce(p_unit,'each'), cost_price = p_cost_price, selling_price = p_selling_price, currency = upper(coalesce(p_currency,'ZMW')),
      low_stock_threshold = coalesce(p_low_stock_threshold,0), is_active = coalesce(p_is_active,true), is_published = coalesce(p_is_published,false) AND coalesce(p_is_active,true),
      supplier_reference = p_supplier_reference, internal_notes = p_internal_notes, updated_at = now() WHERE id = p_product_id RETURNING * INTO v_row;
  END IF;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (public.stgl_organization_id(), auth.uid(), CASE WHEN v_old IS NULL THEN 'product.created' ELSE 'product.updated' END, 'product', v_row.id, v_old, to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.record_stock_movement(p_product_id uuid, p_movement_type text, p_quantity integer, p_reason text DEFAULT NULL,
  p_reference text DEFAULT NULL, p_supplier_reference text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_p public.products%ROWTYPE; v_m public.stock_movements%ROWTYPE; v_delta integer;
BEGIN
  IF NOT public.is_stgl('inventory.manage') THEN RAISE EXCEPTION 'Inventory management denied' USING ERRCODE = '42501'; END IF;
  IF p_quantity IS NULL OR p_quantity = 0 THEN RAISE EXCEPTION 'Quantity required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_p FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = '22023'; END IF;
  IF p_movement_type = 'receipt' THEN
    IF p_quantity < 0 THEN RAISE EXCEPTION 'Receipt quantity must be positive' USING ERRCODE = '22023'; END IF; v_delta := p_quantity;
  ELSIF p_movement_type = 'dispatch' THEN
    IF p_quantity < 0 THEN RAISE EXCEPTION 'Dispatch quantity must be positive' USING ERRCODE = '22023'; END IF; v_delta := -p_quantity;
    IF nullif(btrim(p_reason),'') IS NULL AND nullif(btrim(p_reference),'') IS NULL THEN RAISE EXCEPTION 'Dispatch reason or reference required' USING ERRCODE = '22023'; END IF;
  ELSIF p_movement_type = 'adjustment' THEN
    IF length(btrim(coalesce(p_reason,''))) < 3 THEN RAISE EXCEPTION 'Adjustment reason required' USING ERRCODE = '22023'; END IF; v_delta := p_quantity;
  ELSE RAISE EXCEPTION 'Invalid movement type' USING ERRCODE = '22023'; END IF;
  IF v_p.quantity_on_hand + v_delta < v_p.quantity_reserved THEN RAISE EXCEPTION 'Insufficient available stock (reserved stock is protected)' USING ERRCODE = '22023'; END IF;
  UPDATE public.products SET quantity_on_hand = quantity_on_hand + v_delta, updated_at = now() WHERE id = p_product_id RETURNING * INTO v_p;
  INSERT INTO public.stock_movements(product_id, movement_type, quantity, on_hand_after, reserved_after, supplier_reference, reference, reason, actor_user_id)
  VALUES (p_product_id, p_movement_type, v_delta, v_p.quantity_on_hand, v_p.quantity_reserved, p_supplier_reference, p_reference, p_reason, auth.uid()) RETURNING * INTO v_m;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (public.stgl_organization_id(), auth.uid(), 'stock.' || p_movement_type, 'product', p_product_id, to_jsonb(v_m));
  RETURN to_jsonb(v_m);
END $$;

CREATE OR REPLACE FUNCTION public.list_inventory(p_search text DEFAULT NULL, p_low_stock_only boolean DEFAULT false, p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_cost boolean := public.is_stgl('inventory.cost.view');
BEGIN
  IF NOT public.is_stgl('inventory.view') THEN RAISE EXCEPTION 'Inventory access denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(x.j ORDER BY x.name) FROM (
    SELECT p.name, (CASE WHEN v_cost THEN to_jsonb(p) ELSE to_jsonb(p) - 'cost_price' - 'supplier_reference' END) || jsonb_build_object(
      'quantity_available', p.quantity_on_hand - p.quantity_reserved, 'is_low_stock', p.quantity_on_hand - p.quantity_reserved <= p.low_stock_threshold,
      'category_name', c.name) j
    FROM public.products p LEFT JOIN public.product_categories c ON c.id = p.category_id
    WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.sku ILIKE '%' || p_search || '%')
      AND (NOT p_low_stock_only OR p.quantity_on_hand - p.quantity_reserved <= p.low_stock_threshold)
    ORDER BY p.name LIMIT least(greatest(p_limit,1),500) OFFSET greatest(p_offset,0)) x), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.list_stock_movements(p_product_id uuid, p_limit integer DEFAULT 100) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_stgl('inventory.view') THEN RAISE EXCEPTION 'Inventory access denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.created_at DESC) FROM (SELECT * FROM public.stock_movements WHERE product_id = p_product_id ORDER BY created_at DESC LIMIT least(greatest(p_limit,1),500)) m), '[]'::jsonb);
END $$;

-- Client-safe store catalogue: never cost, supplier or internal notes
CREATE OR REPLACE FUNCTION public.list_store_products(p_organization_id uuid, p_search text DEFAULT NULL, p_category_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT (public.has_org_permission(p_organization_id, 'store.browse') AND EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id AND organization_type = 'client')) THEN
    RAISE EXCEPTION 'Store access denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'sku', p.sku, 'name', p.name, 'description', p.description, 'image_urls', p.image_urls,
      'category_id', p.category_id, 'category_name', c.name, 'unit', p.unit, 'selling_price', p.selling_price, 'currency', p.currency,
      'availability', CASE WHEN p.quantity_on_hand - p.quantity_reserved <= 0 THEN 'out_of_stock' WHEN p.quantity_on_hand - p.quantity_reserved <= p.low_stock_threshold THEN 'low_stock' ELSE 'in_stock' END,
      'quantity_available', p.quantity_on_hand - p.quantity_reserved) ORDER BY c.sort_order, p.name)
    FROM public.products p LEFT JOIN public.product_categories c ON c.id = p.category_id
    WHERE p.is_active AND p.is_published AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.sku ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.place_store_order(p_organization_id uuid, p_lines jsonb, p_delivery_location_id uuid DEFAULT NULL,
  p_delivery_instructions text DEFAULT NULL, p_purchase_order_reference text DEFAULT NULL, p_client_request_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_o public.store_orders%ROWTYPE; v_line jsonb; v_p public.products%ROWTYPE; v_qty integer; v_currency text; v_total numeric := 0;
BEGIN
  IF NOT public.has_org_permission(p_organization_id, 'store.order.place') OR NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id AND organization_type = 'client') THEN
    RAISE EXCEPTION 'Order placement denied' USING ERRCODE = '42501'; END IF;
  IF p_client_request_key IS NOT NULL THEN
    SELECT * INTO v_o FROM public.store_orders WHERE organization_id = p_organization_id AND client_request_key = p_client_request_key;
    IF FOUND THEN RETURN to_jsonb(v_o) || jsonb_build_object('duplicate', true); END IF;
  END IF;
  IF p_delivery_location_id IS NOT NULL AND NOT (EXISTS (SELECT 1 FROM public.locations WHERE id = p_delivery_location_id AND organization_id = p_organization_id)
       AND public.user_can_see_location(auth.uid(), p_organization_id, p_delivery_location_id)) THEN
    RAISE EXCEPTION 'Delivery location not permitted' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 OR jsonb_array_length(p_lines) > 100 THEN RAISE EXCEPTION 'Order lines required' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.store_orders(organization_id, delivery_location_id, currency, subtotal, delivery_instructions, purchase_order_reference, client_request_key, placed_by)
  VALUES (p_organization_id, p_delivery_location_id, 'ZMW', 0, nullif(btrim(p_delivery_instructions),''), nullif(btrim(p_purchase_order_reference),''), p_client_request_key, auth.uid())
  RETURNING * INTO v_o;
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_qty := (v_line->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 100000 THEN RAISE EXCEPTION 'Invalid quantity' USING ERRCODE = '22023'; END IF;
    SELECT * INTO v_p FROM public.products WHERE id = (v_line->>'product_id')::uuid AND is_active AND is_published;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product not available in store' USING ERRCODE = '22023'; END IF;
    IF v_currency IS NOT NULL AND v_currency <> v_p.currency THEN RAISE EXCEPTION 'All products in an order must share a currency' USING ERRCODE = '22023'; END IF;
    v_currency := v_p.currency;
    INSERT INTO public.store_order_lines(order_id, product_id, product_name, sku, unit, quantity, unit_price, currency, line_total)
    VALUES (v_o.id, v_p.id, v_p.name, v_p.sku, v_p.unit, v_qty, v_p.selling_price, v_p.currency, round(v_p.selling_price * v_qty, 2));
    v_total := v_total + round(v_p.selling_price * v_qty, 2);
  END LOOP;
  UPDATE public.store_orders SET subtotal = v_total, currency = v_currency WHERE id = v_o.id RETURNING * INTO v_o;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (p_organization_id, auth.uid(), 'order.placed', 'store_order', v_o.id, to_jsonb(v_o));
  PERFORM public.notify_members(public.stgl_organization_id(), 'order.manage', NULL, false, 'order.placed', 'New store order ' || v_o.reference,
    (SELECT name FROM public.organizations WHERE id = p_organization_id) || ' · ' || v_o.currency || ' ' || v_o.subtotal, 'store_order', v_o.id, '/orders/' || v_o.id, auth.uid());
  RETURN to_jsonb(v_o) - 'client_request_key' || jsonb_build_object('duplicate', false);
END $$;

CREATE OR REPLACE FUNCTION public.order_json(p_o public.store_orders) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT to_jsonb(p_o) - 'client_request_key' || jsonb_build_object('client_name', (SELECT name FROM public.organizations WHERE id = p_o.organization_id),
    'delivery_location_name', (SELECT name FROM public.locations WHERE id = p_o.delivery_location_id),
    'lines', coalesce((SELECT jsonb_agg(to_jsonb(l) - 'order_id' ORDER BY l.product_name) FROM public.store_order_lines l WHERE l.order_id = p_o.id), '[]'::jsonb)) $$;

CREATE OR REPLACE FUNCTION public.list_store_orders(p_organization_id uuid DEFAULT NULL, p_status text DEFAULT NULL, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_internal boolean := public.is_stgl('order.manage') OR public.is_stgl('inventory.view');
BEGIN
  IF NOT v_internal AND (p_organization_id IS NULL OR NOT public.has_org_permission(p_organization_id, 'store.order.view')) THEN
    RAISE EXCEPTION 'Order access denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(public.order_json(o) ORDER BY o.placed_at DESC) FROM (SELECT * FROM public.store_orders
    WHERE (p_organization_id IS NULL OR organization_id = p_organization_id) AND (p_status IS NULL OR status = p_status)
    ORDER BY placed_at DESC LIMIT least(greatest(p_limit,1),500) OFFSET greatest(p_offset,0)) o), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.get_store_order(p_order_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_o public.store_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_o FROM public.store_orders WHERE id = p_order_id;
  IF NOT FOUND OR NOT (public.is_stgl('order.manage') OR public.is_stgl('inventory.view') OR public.has_org_permission(v_o.organization_id, 'store.order.view')) THEN
    RAISE EXCEPTION 'Order access denied' USING ERRCODE = '42501'; END IF;
  RETURN public.order_json(v_o);
END $$;

-- Order fulfilment: confirm reserves, dispatch deducts + releases, cancel releases
CREATE OR REPLACE FUNCTION public.update_store_order(p_order_id uuid, p_action text, p_reason text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_o public.store_orders%ROWTYPE; v_from text; v_l public.store_order_lines%ROWTYPE; v_p public.products%ROWTYPE; v_client_cancel boolean := false;
BEGIN
  SELECT * INTO v_o FROM public.store_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found' USING ERRCODE = '22023'; END IF;
  IF NOT public.is_stgl('order.manage') THEN
    IF p_action = 'cancel' AND v_o.status = 'pending' AND public.has_org_permission(v_o.organization_id, 'store.order.place') THEN v_client_cancel := true;
    ELSE RAISE EXCEPTION 'Order management denied' USING ERRCODE = '42501'; END IF;
  END IF;
  v_from := v_o.status;
  IF p_action = 'confirm' AND v_from = 'pending' THEN
    FOR v_l IN SELECT * FROM public.store_order_lines WHERE order_id = p_order_id ORDER BY product_id LOOP
      SELECT * INTO v_p FROM public.products WHERE id = v_l.product_id FOR UPDATE;
      IF v_p.quantity_on_hand - v_p.quantity_reserved < v_l.quantity THEN RAISE EXCEPTION 'Insufficient stock for %', v_p.sku USING ERRCODE = '22023'; END IF;
      UPDATE public.products SET quantity_reserved = quantity_reserved + v_l.quantity, updated_at = now() WHERE id = v_p.id RETURNING * INTO v_p;
      INSERT INTO public.stock_movements(product_id, movement_type, quantity, on_hand_after, reserved_after, order_id, reference, actor_user_id)
      VALUES (v_p.id, 'reservation', v_l.quantity, v_p.quantity_on_hand, v_p.quantity_reserved, p_order_id, v_o.reference, auth.uid());
    END LOOP;
    UPDATE public.store_orders SET status = 'confirmed', confirmed_at = now(), updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSIF p_action = 'reject' AND v_from = 'pending' THEN
    IF nullif(btrim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Reason required' USING ERRCODE = '22023'; END IF;
    UPDATE public.store_orders SET status = 'rejected', status_reason = btrim(p_reason), updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSIF p_action = 'process' AND v_from = 'confirmed' THEN
    UPDATE public.store_orders SET status = 'processing', updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSIF p_action = 'dispatch' AND v_from IN ('confirmed','processing') THEN
    FOR v_l IN SELECT * FROM public.store_order_lines WHERE order_id = p_order_id ORDER BY product_id LOOP
      SELECT * INTO v_p FROM public.products WHERE id = v_l.product_id FOR UPDATE;
      UPDATE public.products SET quantity_on_hand = quantity_on_hand - v_l.quantity, quantity_reserved = quantity_reserved - v_l.quantity, updated_at = now()
        WHERE id = v_p.id RETURNING * INTO v_p;
      INSERT INTO public.stock_movements(product_id, movement_type, quantity, on_hand_after, reserved_after, order_id, reference, actor_user_id)
      VALUES (v_p.id, 'order_dispatch', -v_l.quantity, v_p.quantity_on_hand, v_p.quantity_reserved, p_order_id, v_o.reference, auth.uid());
    END LOOP;
    UPDATE public.store_orders SET status = 'dispatched', dispatched_at = now(), updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSIF p_action = 'deliver' AND v_from = 'dispatched' THEN
    UPDATE public.store_orders SET status = 'delivered', delivered_at = now(), updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSIF p_action = 'complete' AND v_from IN ('dispatched','delivered') THEN
    UPDATE public.store_orders SET status = 'completed', completed_at = now(), delivered_at = coalesce(delivered_at, now()), updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSIF p_action = 'cancel' AND v_from IN ('pending','confirmed','processing') THEN
    IF nullif(btrim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Reason required' USING ERRCODE = '22023'; END IF;
    IF v_from IN ('confirmed','processing') THEN
      FOR v_l IN SELECT * FROM public.store_order_lines WHERE order_id = p_order_id ORDER BY product_id LOOP
        UPDATE public.products SET quantity_reserved = quantity_reserved - v_l.quantity, updated_at = now() WHERE id = v_l.product_id RETURNING * INTO v_p;
        INSERT INTO public.stock_movements(product_id, movement_type, quantity, on_hand_after, reserved_after, order_id, reference, actor_user_id)
        VALUES (v_p.id, 'release', -v_l.quantity, v_p.quantity_on_hand, v_p.quantity_reserved, p_order_id, v_o.reference, auth.uid());
      END LOOP;
    END IF;
    UPDATE public.store_orders SET status = 'cancelled', cancelled_at = now(), status_reason = btrim(p_reason), updated_at = now() WHERE id = p_order_id RETURNING * INTO v_o;
  ELSE RAISE EXCEPTION 'Invalid order transition % from %', p_action, v_from USING ERRCODE = '22023'; END IF;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, old_values, new_values, metadata)
  VALUES (v_o.organization_id, auth.uid(), 'order.' || p_action, 'store_order', v_o.id, jsonb_build_object('status', v_from), jsonb_build_object('status', v_o.status), jsonb_build_object('reason', p_reason));
  IF NOT v_client_cancel THEN
    PERFORM public.notify_members(v_o.organization_id, 'store.order.view', NULL, false, 'order.status_changed', 'Order ' || v_o.reference || ' ' || v_o.status, p_reason, 'store_order', v_o.id, '/client/app/orders/' || v_o.id, auth.uid());
  ELSE
    PERFORM public.notify_members(public.stgl_organization_id(), 'order.manage', NULL, false, 'order.status_changed', 'Order ' || v_o.reference || ' cancelled by client', p_reason, 'store_order', v_o.id, '/orders/' || v_o.id, auth.uid());
  END IF;
  RETURN public.order_json(v_o);
END $$;

CREATE OR REPLACE FUNCTION public.set_store_order_commercial(p_order_id uuid, p_payment_status text DEFAULT NULL, p_quotation_reference text DEFAULT NULL,
  p_invoice_reference text DEFAULT NULL, p_purchase_order_reference text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_o public.store_orders%ROWTYPE; v_old jsonb;
BEGIN
  IF NOT public.is_stgl('order.manage') THEN RAISE EXCEPTION 'Order management denied' USING ERRCODE = '42501'; END IF;
  SELECT to_jsonb(o) INTO v_old FROM public.store_orders o WHERE id = p_order_id FOR UPDATE;
  IF v_old IS NULL THEN RAISE EXCEPTION 'Order not found' USING ERRCODE = '22023'; END IF;
  IF p_payment_status IS NOT NULL AND p_payment_status NOT IN ('unpaid','invoiced','partially_paid','paid','waived') THEN RAISE EXCEPTION 'Invalid payment status' USING ERRCODE = '22023'; END IF;
  UPDATE public.store_orders SET payment_status = coalesce(p_payment_status, payment_status), quotation_reference = coalesce(p_quotation_reference, quotation_reference),
    invoice_reference = coalesce(p_invoice_reference, invoice_reference), purchase_order_reference = coalesce(p_purchase_order_reference, purchase_order_reference), updated_at = now()
  WHERE id = p_order_id RETURNING * INTO v_o;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (v_o.organization_id, auth.uid(), 'order.commercial_updated', 'store_order', v_o.id, v_old, to_jsonb(v_o));
  RETURN public.order_json(v_o);
END $$;
-- Function privileges: internal helpers locked; RPCs signed-in only
DO $$ DECLARE f record; BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
     'stgl_organization_id','user_has_org_permission','user_can_see_location','can_view_client_service_record','notify_members','notify_user',
     'list_my_notifications','mark_notification_read','mark_all_notifications_read','save_notification_setting','list_notification_settings',
     'prevent_job_card_mutation','is_stgl','log_job_event','job_public_json','breakdown_derived_status','notify_job_parties','report_breakdown',
     'get_breakdown_email_draft','list_breakdowns','update_breakdown','assert_eligible_technician','create_job','assign_job','pickup_job','transition_job',
     'build_job_card_snapshot','complete_job','manage_job','list_jobs','get_job','get_job_card','correct_job_card','job_dashboard_summary','technician_home',
     'set_technician_availability','get_company_branding','save_company_branding','prevent_stock_movement_mutation','save_product_category','save_product',
     'record_stock_movement','list_inventory','list_stock_movements','list_store_products','place_store_order','order_json','list_store_orders',
     'get_store_order','update_store_order','set_store_order_commercial')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    IF f.proname IN ('stgl_organization_id','user_has_org_permission','user_can_see_location','notify_members','notify_user','prevent_job_card_mutation',
      'log_job_event','job_public_json','breakdown_derived_status','notify_job_parties','assert_eligible_technician','build_job_card_snapshot',
      'prevent_stock_movement_mutation','order_json','is_stgl','can_view_client_service_record') THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;