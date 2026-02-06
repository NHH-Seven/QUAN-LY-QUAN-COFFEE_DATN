--
-- PostgreSQL database dump
--

\restrict ookKnOhsydgK8I5KEw2M4MQXeqrc8FbJbFc61BpVm89I7y0au7pehVj00MnAJOl

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.wishlist DROP CONSTRAINT IF EXISTS wishlist_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_area_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_table_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_staff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.table_order_items DROP CONSTRAINT IF EXISTS table_order_items_table_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_staff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_shift_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.shift_swap_requests DROP CONSTRAINT IF EXISTS shift_swap_requests_target_shift_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shift_swap_requests DROP CONSTRAINT IF EXISTS shift_swap_requests_target_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shift_swap_requests DROP CONSTRAINT IF EXISTS shift_swap_requests_responded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.shift_swap_requests DROP CONSTRAINT IF EXISTS shift_swap_requests_requester_shift_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shift_swap_requests DROP CONSTRAINT IF EXISTS shift_swap_requests_requester_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review_images DROP CONSTRAINT IF EXISTS review_images_review_id_fkey;
ALTER TABLE IF EXISTS ONLY public.return_items DROP CONSTRAINT IF EXISTS return_items_return_id_fkey;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promotion_usage DROP CONSTRAINT IF EXISTS promotion_usage_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promotion_usage DROP CONSTRAINT IF EXISTS promotion_usage_promotion_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promotion_usage DROP CONSTRAINT IF EXISTS promotion_usage_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_promotion_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS fk_tables_current_order;
ALTER TABLE IF EXISTS ONLY public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_staff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
DROP INDEX IF EXISTS public.wishlist_user_id_product_id_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.push_subscriptions_endpoint_key;
DROP INDEX IF EXISTS public.promotions_code_key;
DROP INDEX IF EXISTS public.products_slug_key;
DROP INDEX IF EXISTS public.product_suppliers_product_id_supplier_id_key;
DROP INDEX IF EXISTS public.product_questions_product_id_idx;
DROP INDEX IF EXISTS public.points_history_user_id_idx;
DROP INDEX IF EXISTS public.points_history_created_at_idx;
DROP INDEX IF EXISTS public.pending_registrations_email_key;
DROP INDEX IF EXISTS public.password_resets_email_key;
DROP INDEX IF EXISTS public.idx_wishlist_user;
DROP INDEX IF EXISTS public.idx_users_tier;
DROP INDEX IF EXISTS public.idx_users_points;
DROP INDEX IF EXISTS public.idx_tables_status;
DROP INDEX IF EXISTS public.idx_tables_area;
DROP INDEX IF EXISTS public.idx_table_orders_table;
DROP INDEX IF EXISTS public.idx_table_orders_status;
DROP INDEX IF EXISTS public.idx_table_order_items_order;
DROP INDEX IF EXISTS public.idx_swap_requests_status;
DROP INDEX IF EXISTS public.idx_swap_requests_requester;
DROP INDEX IF EXISTS public.idx_stock_user;
DROP INDEX IF EXISTS public.idx_stock_product;
DROP INDEX IF EXISTS public.idx_stock_created;
DROP INDEX IF EXISTS public.idx_staff_shifts_staff;
DROP INDEX IF EXISTS public.idx_staff_shifts_shift;
DROP INDEX IF EXISTS public.idx_staff_shifts_date;
DROP INDEX IF EXISTS public.idx_reviews_user_id;
DROP INDEX IF EXISTS public.idx_reviews_product_rating;
DROP INDEX IF EXISTS public.idx_reviews_product_id;
DROP INDEX IF EXISTS public.idx_reviews_product;
DROP INDEX IF EXISTS public.idx_review_images_review;
DROP INDEX IF EXISTS public.idx_push_subscriptions_user;
DROP INDEX IF EXISTS public.idx_promotions_code;
DROP INDEX IF EXISTS public.idx_promotions_active;
DROP INDEX IF EXISTS public.idx_promotion_usage_promotion;
DROP INDEX IF EXISTS public.idx_products_slug;
DROP INDEX IF EXISTS public.idx_products_is_new;
DROP INDEX IF EXISTS public.idx_products_is_featured;
DROP INDEX IF EXISTS public.idx_products_is_active;
DROP INDEX IF EXISTS public.idx_products_discount;
DROP INDEX IF EXISTS public.idx_products_category_id;
DROP INDEX IF EXISTS public.idx_products_category;
DROP INDEX IF EXISTS public.idx_products_brand;
DROP INDEX IF EXISTS public.idx_orders_user_status;
DROP INDEX IF EXISTS public.idx_orders_user_id;
DROP INDEX IF EXISTS public.idx_orders_user;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_payment_method;
DROP INDEX IF EXISTS public.idx_orders_created_status;
DROP INDEX IF EXISTS public.idx_orders_created_at;
DROP INDEX IF EXISTS public.idx_order_items_product_id;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_notifications_user_read;
DROP INDEX IF EXISTS public.idx_chatbot_knowledge_is_active;
DROP INDEX IF EXISTS public.idx_chatbot_knowledge_category;
DROP INDEX IF EXISTS public.idx_chatbot_feedback_session_id;
DROP INDEX IF EXISTS public.idx_chat_sessions_user;
DROP INDEX IF EXISTS public.idx_chat_sessions_status;
DROP INDEX IF EXISTS public.idx_chat_sessions_staff;
DROP INDEX IF EXISTS public.idx_chat_sessions_guest_id;
DROP INDEX IF EXISTS public.idx_chat_messages_session;
DROP INDEX IF EXISTS public.idx_chat_messages_sender;
DROP INDEX IF EXISTS public.idx_categories_slug;
DROP INDEX IF EXISTS public.idx_cart_user;
DROP INDEX IF EXISTS public.categories_slug_key;
DROP INDEX IF EXISTS public.cart_items_user_id_product_id_key;
ALTER TABLE IF EXISTS ONLY public.wishlist DROP CONSTRAINT IF EXISTS wishlist_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_addresses DROP CONSTRAINT IF EXISTS user_addresses_pkey;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_table_number_key;
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS tables_pkey;
ALTER TABLE IF EXISTS ONLY public.table_orders DROP CONSTRAINT IF EXISTS table_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.table_order_items DROP CONSTRAINT IF EXISTS table_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_staff_id_shift_id_work_date_key;
ALTER TABLE IF EXISTS ONLY public.staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_pkey;
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS shifts_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_swap_requests DROP CONSTRAINT IF EXISTS shift_swap_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.review_images DROP CONSTRAINT IF EXISTS review_images_pkey;
ALTER TABLE IF EXISTS ONLY public.return_items DROP CONSTRAINT IF EXISTS return_items_pkey;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.promotions DROP CONSTRAINT IF EXISTS promotions_pkey;
ALTER TABLE IF EXISTS ONLY public.promotion_usage DROP CONSTRAINT IF EXISTS promotion_usage_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.product_questions DROP CONSTRAINT IF EXISTS product_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.points_history DROP CONSTRAINT IF EXISTS points_history_pkey;
ALTER TABLE IF EXISTS ONLY public.pending_registrations DROP CONSTRAINT IF EXISTS pending_registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.password_resets DROP CONSTRAINT IF EXISTS password_resets_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_returns DROP CONSTRAINT IF EXISTS order_returns_pkey;
ALTER TABLE IF EXISTS ONLY public.order_notes DROP CONSTRAINT IF EXISTS order_notes_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.chatbot_knowledge DROP CONSTRAINT IF EXISTS chatbot_knowledge_pkey;
ALTER TABLE IF EXISTS ONLY public.chatbot_feedback DROP CONSTRAINT IF EXISTS chatbot_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_pkey;
ALTER TABLE IF EXISTS ONLY public.areas DROP CONSTRAINT IF EXISTS areas_pkey;
DROP TABLE IF EXISTS public.wishlist;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_addresses;
DROP TABLE IF EXISTS public.tables;
DROP TABLE IF EXISTS public.table_orders;
DROP TABLE IF EXISTS public.table_order_items;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.stock_transactions;
DROP TABLE IF EXISTS public.staff_shifts;
DROP TABLE IF EXISTS public.shifts;
DROP TABLE IF EXISTS public.shift_swap_requests;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.review_images;
DROP TABLE IF EXISTS public.return_items;
DROP TABLE IF EXISTS public.push_subscriptions;
DROP TABLE IF EXISTS public.promotions;
DROP TABLE IF EXISTS public.promotion_usage;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_suppliers;
DROP TABLE IF EXISTS public.product_questions;
DROP TABLE IF EXISTS public.points_history;
DROP TABLE IF EXISTS public.pending_registrations;
DROP TABLE IF EXISTS public.password_resets;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.order_returns;
DROP TABLE IF EXISTS public.order_notes;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.chatbot_knowledge;
DROP TABLE IF EXISTS public.chatbot_feedback;
DROP TABLE IF EXISTS public.chat_sessions;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.cart_items;
DROP TABLE IF EXISTS public.areas;
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."StockTransactionType";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."ChatSessionStatus";
--
-- Name: ChatSessionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChatSessionStatus" AS ENUM (
    'waiting',
    'active',
    'closed'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'pending',
    'awaiting_payment',
    'confirmed',
    'shipping',
    'delivered',
    'cancelled'
);


--
-- Name: StockTransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StockTransactionType" AS ENUM (
    'import',
    'export',
    'adjust',
    'order',
    'return'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'admin',
    'sales',
    'warehouse'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    user_id text NOT NULL,
    product_id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    icon character varying(100),
    description text,
    product_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    session_id text NOT NULL,
    sender_id text,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sender_type character varying(20) DEFAULT 'user'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_sessions (
    id text NOT NULL,
    user_id text,
    staff_id text,
    status public."ChatSessionStatus" DEFAULT 'waiting'::public."ChatSessionStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp(3) without time zone,
    guest_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: chatbot_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_feedback (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    message_id text,
    session_id text,
    rating integer,
    feedback text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chatbot_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: chatbot_knowledge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_knowledge (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    category character varying(100),
    tags text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text,
    quantity integer NOT NULL,
    price numeric(15,2) NOT NULL
);


--
-- Name: order_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_notes (
    id text NOT NULL,
    order_id text NOT NULL,
    staff_id text NOT NULL,
    note text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: order_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_returns (
    id text NOT NULL,
    order_id text NOT NULL,
    user_id text NOT NULL,
    reason text NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    refund_amount numeric(15,2),
    staff_note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    user_id text,
    total numeric(15,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'pending'::public."OrderStatus" NOT NULL,
    shipping_address text NOT NULL,
    payment_method character varying(100) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note text,
    phone character varying(20) NOT NULL,
    recipient_name character varying(255) NOT NULL,
    discount_amount numeric(15,2) DEFAULT 0,
    promotion_id uuid,
    subtotal numeric(12,2),
    tracking_code character varying(100),
    shipping_carrier character varying(100),
    shipping_fee numeric(12,2) DEFAULT 0
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id text NOT NULL,
    email character varying(255) NOT NULL,
    otp_hash character varying(255) NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pending_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_registrations (
    id text NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    otp_hash character varying(255) NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: points_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_history (
    id text NOT NULL,
    user_id text NOT NULL,
    points integer NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    order_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_questions (
    id text NOT NULL,
    product_id text NOT NULL,
    user_id text NOT NULL,
    question text NOT NULL,
    answer text,
    answered_by text,
    answered_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_suppliers (
    id text NOT NULL,
    product_id text NOT NULL,
    supplier_id text NOT NULL,
    cost_price numeric(15,2),
    lead_time_days integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    price numeric(15,2) NOT NULL,
    original_price numeric(15,2),
    images text[] DEFAULT ARRAY[]::text[],
    category_id text,
    brand character varying(255),
    specs jsonb DEFAULT '{}'::jsonb NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    rating numeric(2,1) DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    is_new boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    discount integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    low_stock_threshold integer DEFAULT 10 NOT NULL
);


--
-- Name: promotion_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    promotion_id uuid NOT NULL,
    user_id text,
    order_id text,
    discount_amount numeric(12,2) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(20) NOT NULL,
    value numeric(12,2) NOT NULL,
    min_order_value numeric(12,2) DEFAULT 0,
    max_discount numeric(12,2),
    usage_limit integer,
    used_count integer DEFAULT 0,
    start_date timestamp(6) with time zone,
    end_date timestamp(6) with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id text NOT NULL,
    user_id text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_items (
    id text NOT NULL,
    return_id text NOT NULL,
    order_item_id text,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    reason text
);


--
-- Name: review_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_images (
    id text NOT NULL,
    review_id text NOT NULL,
    url text NOT NULL,
    public_id character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    user_id text,
    product_id text NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: shift_swap_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_swap_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id text,
    requester_shift_id uuid,
    target_id text,
    target_shift_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying,
    reason text,
    response_note text,
    responded_by text,
    responded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shift_swap_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    description text,
    color character varying(20) DEFAULT '#3b82f6'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: staff_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id text,
    shift_id uuid,
    work_date date NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    check_in_time timestamp without time zone,
    check_out_time timestamp without time zone,
    notes text,
    created_by text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staff_shifts_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'checked_in'::character varying, 'checked_out'::character varying, 'absent'::character varying, 'swapped'::character varying])::text[])))
);


--
-- Name: stock_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transactions (
    id text NOT NULL,
    product_id text NOT NULL,
    user_id text NOT NULL,
    type public."StockTransactionType" NOT NULL,
    quantity integer NOT NULL,
    reason character varying(500),
    reference character varying(255),
    stock_before integer NOT NULL,
    stock_after integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    contact_name character varying(255),
    email character varying(255),
    phone character varying(50),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: table_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.table_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_order_id uuid,
    product_id text,
    product_name character varying(255) NOT NULL,
    product_image text,
    quantity integer DEFAULT 1 NOT NULL,
    price numeric(12,2) NOT NULL,
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT table_order_items_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'preparing'::character varying, 'ready'::character varying, 'served'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: table_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.table_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(20) NOT NULL,
    table_id uuid,
    staff_id text,
    guests_count integer DEFAULT 1,
    subtotal numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    discount_reason character varying(100),
    total numeric(12,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    payment_method character varying(20),
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT table_orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT table_orders_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_number character varying(20) NOT NULL,
    area_id uuid,
    capacity integer DEFAULT 4,
    status character varying(20) DEFAULT 'available'::character varying,
    current_order_id uuid,
    current_guests integer DEFAULT 0,
    occupied_at timestamp without time zone,
    reserved_at timestamp without time zone,
    reserved_for character varying(100),
    reserved_phone character varying(20),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tables_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'occupied'::character varying, 'reserved'::character varying, 'cleaning'::character varying])::text[])))
);


--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_addresses (
    id text NOT NULL,
    user_id text NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    address text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    avatar text,
    phone character varying(20),
    address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    role public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    tier character varying(20) DEFAULT 'bronze'::character varying NOT NULL,
    total_spent numeric(15,2) DEFAULT 0 NOT NULL,
    order_count integer DEFAULT 0 NOT NULL,
    note text
);


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist (
    id text NOT NULL,
    user_id text NOT NULL,
    product_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.areas (id, name, description, sort_order, is_active, created_at, updated_at) FROM stdin;
ebfcbe5f-4956-472f-985d-24b1275d1d2c	Trong nha (Tang 1)	Khu vuc trong nha tang 1, co dieu hoa	1	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
38f5dfd6-d605-44d8-aa9c-68469e8a0029	San vuon	Khu vuc san vuon ngoai troi	2	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
01256af6-bf0b-4a80-bb00-a7d45922470d	Tang 2	Khu vuc tang 2, view dep	3	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, user_id, product_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, icon, description, product_count, created_at) FROM stdin;
1	Cà phê	ca-phe	coffee	\N	15	2026-01-08 02:08:47.514
2	Trà	tra	leaf	\N	12	2026-01-08 02:08:47.518
3	Đá xay	da-xay	snowflake	\N	8	2026-01-08 02:08:47.518
4	Nước ép & Sinh tố	nuoc-ep-sinh-to	citrus	\N	10	2026-01-08 02:08:47.519
5	Bánh ngọt	banh-ngot	cake	\N	12	2026-01-08 02:08:47.519
6	Snack & Đồ ăn nhẹ	snack-do-an-nhe	cookie	\N	8	2026-01-08 02:08:47.519
7	Combo	combo	package	\N	6	2026-01-08 02:08:47.52
8	Cà phê hạt	ca-phe-hat	bean	\N	10	2026-01-08 02:08:47.521
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, session_id, sender_id, content, created_at, sender_type, metadata) FROM stdin;
6f40a249-0c9f-4a0d-9f02-b4e2de5acdae	46d62003-0939-4af8-8ae1-2eada404ab70	\N	Xin chào	2026-01-25 23:03:30.41	user	{}
c5d1d7e0-a130-4edf-ade5-4458c3886938	e770ce0e-dd93-45d1-b96f-34e68b0d59bd	\N	Xin chào	2026-01-25 23:04:04.811	user	{}
9aeaf482-b94e-48ae-8510-4e46a1e18668	bd5407f1-90cd-4825-9cde-471cc335b790	\N	Xin chào	2026-01-25 23:04:28.642	user	{}
e17035b8-b387-4d29-b77a-40aace17214b	745c24ee-b8f8-4078-aa8f-95d71877f905	\N	Xin chào	2026-01-25 23:04:58.253	user	{}
60c3d93a-b7cf-4e79-9ef2-9525b5d32c8d	fa217a1a-cb46-4e00-a8a4-1f31fcceb7ff	\N	Xin chào	2026-01-25 23:05:21.405	user	{}
a1f0e059-5540-4cc5-8219-5e7c7d638729	35ffef5f-b492-47ad-93a9-d2360f466e6f	\N	Xin chào	2026-01-25 23:06:16.374	user	{}
2a2fe7b6-fd92-4dae-898b-00ffecc8bc36	f40bb82c-7469-45c0-b789-8a4f7091c31b	\N	Xin chào	2026-01-25 23:06:51.609	user	{}
75296eaa-e62b-429b-9c9f-40c4d9fbfaca	9178bce0-149f-4449-aa1a-fb3414ac71b3	\N	Xin chào	2026-01-25 23:07:31.407	user	{}
0f48ba64-fdf4-4039-9409-e4c2b3a90641	9ec46457-6465-4453-8f2c-7efb7f815bd6	\N	Xin chào	2026-01-25 23:07:53.757	user	{}
0cab29b6-f170-48f2-9344-ad139e9d0bed	44b39289-94a4-472b-b6d6-88235fc5d201	\N	Xin chào	2026-01-25 23:10:34.638	user	{}
0cf5e12b-8de7-47d8-9038-60a68edc1406	44b39289-94a4-472b-b6d6-88235fc5d201	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee. Mình có thể giúp gì cho bạn hôm nay ạ? 😊	2026-01-25 23:10:39.207	assistant	{"intent": "general_question", "confidence": 1}
00eb44ab-812f-4909-9904-0058572fb52b	772560cf-044c-434f-b3d3-331139ca4129	\N	Sản phẩm nào đang khuyến mãi?	2026-01-25 23:10:39.229	user	{}
7932bbd2-d256-4743-88ba-d8dc7c59cf45	772560cf-044c-434f-b3d3-331139ca4129	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee. Rất vui được hỗ trợ bạn hôm nay! 😊\n\nHiện tại, mình không có thông tin chi tiết về các chương trình khuyến mãi đang diễn ra trong thời gian thực. Để cập nhật nhanh nhất và chính xác nhất các sản phẩm đang có ưu đãi, bạn có thể:\n\n*   Truy cập website của NHH Coffee (nếu có).\n*   Ghé thăm cửa hàng của chúng mình tại địa chỉ [Địa chỉ cửa hàng, nếu có].\n*   Hoặc bạn có muốn mình kết nối với nhân viên tư vấn để nhận thông tin khuyến mãi chi tiết hơn không?\n\nBạn quan tâm đến sản phẩm cà phê, đồ uống hay thiết bị điện tử vậy ạ? Biết đâu mình có thể gợi ý được vài món hay ho cho bạn! 😉	2026-01-25 23:10:48.556	assistant	{"intent": "product_inquiry", "confidence": 1}
267a7d02-ccc4-4913-89e8-bb949c3bb8c5	11ee6412-4202-49ef-b149-1e9ed5298e0f	\N	Chính sách đổi trả	2026-01-25 23:11:55.943	user	{}
1d3f04b1-7a84-4cf9-9ace-2ecd14ab7040	11ee6412-4202-49ef-b149-1e9ed5298e0f	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee. 😊\n\nVề chính sách đổi trả tại NHH Coffee, bạn có thể đổi trả sản phẩm trong vòng **7 ngày** kể từ ngày mua hàng nhé.\n\nBạn có cần mình hỗ trợ thêm thông tin gì khác không?	2026-01-25 23:12:00.439	assistant	{"intent": "general_question", "confidence": 0.95}
7d9091e8-9767-4e0a-b8ab-b20bf4a4585c	ec5e994e-5cbd-4cc7-b693-043d6be1b2b1	\N	tôi muốn chat với nhân viên	2026-01-25 23:12:17.317	user	{}
84fef09b-0454-46e5-a583-0e678d1a6cfd	ec5e994e-5cbd-4cc7-b693-043d6be1b2b1	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee. Hiện tại mình đang hỗ trợ bạn đây ạ 😊\n\nBạn muốn được kết nối trực tiếp với nhân viên tư vấn để trao đổi phải không ạ? Mình sẽ giúp bạn chuyển tiếp yêu cầu này ngay nhé!\n\nBạn có thể cho mình biết bạn cần hỗ trợ về vấn đề gì để mình thông báo trước với nhân viên không ạ? Ví dụ như: tư vấn sản phẩm, đơn hàng, hay khiếu nại...?	2026-01-25 23:12:23.274	assistant	{"intent": "general_question", "confidence": 0.95}
4e72af44-1aa7-41d1-bd5a-3409be0b30a2	58e0236f-3f3b-40c0-8b33-eac97ff37c0d	\N	Sản phẩm nào đang khuyến mãi?	2026-01-25 23:24:09.459	user	{}
7e1c9375-572a-4f7c-84ca-0558a3c9234c	58e0236f-3f3b-40c0-8b33-eac97ff37c0d	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee đây ạ! 😊\n\nHiện tại, các chương trình khuyến mãi thường xuyên được cập nhật trên website và fanpage chính thức của NHH Coffee đó ạ. Bạn có muốn mình gửi link để bạn tiện theo dõi không? Hoặc bạn đang quan tâm đến dòng sản phẩm nào cụ thể để mình kiểm tra xem có ưu đãi gì đặc biệt không nhé!	2026-01-25 23:24:17.162	assistant	{"intent": "product_inquiry", "confidence": 0.98}
bca5d1d8-4220-4f32-9499-3ba855bbe47a	24e64e8f-72d4-4bef-99e9-14f4d55fd22e	\N	cà phê nào ngon	2026-01-25 23:24:30.768	user	{}
cd610243-703e-47d5-84c0-b7f9c689b7c7	24e64e8f-72d4-4bef-99e9-14f4d55fd22e	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee đây 😊.\n\nĐể mình tư vấn loại cà phê ưng ý nhất cho bạn nhé! Bạn thích vị cà phê như thế nào ạ? (Ví dụ: đắng đậm, chua nhẹ, ngọt thanh, nhiều sữa hay ít sữa...)\n\nHoặc bạn có thể cho mình biết bạn hay uống cà phê gì để mình gợi ý thêm nhé!	2026-01-25 23:24:36.842	assistant	{"intent": "product_inquiry", "confidence": 0.95}
bcfa9691-64ae-49bf-95ff-042377cbe0a0	df9ce26b-c4d7-43a4-a62a-af5b3980200a	\N	ngọt thanh	2026-01-25 23:24:55.998	user	{}
713a1b24-77e3-41fe-8594-86049a023f69	df9ce26b-c4d7-43a4-a62a-af5b3980200a	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee. Mình có thể giúp gì cho bạn hôm nay? 😊\n\nBạn đang tìm kiếm một loại đồ uống có hương vị ngọt thanh phải không ạ? Hay bạn có đang quan tâm đến sản phẩm cụ thể nào có đặc điểm này không ạ? Hãy cho mình biết thêm nhé!	2026-01-25 23:25:06.435	assistant	{"intent": "product_inquiry", "confidence": 0.9}
baf63b5e-f9c8-493d-a88a-9995762aa3b2	37a4d324-7290-4dae-9c81-c59d112ab8d0	\N	Có cà phê gì ngon không?	2026-01-25 23:36:11.626	user	{}
f5be587a-2893-4f77-9874-8333663795c9	37a4d324-7290-4dae-9c81-c59d112ab8d0	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee ☕ Mình rất vui được tư vấn cho bạn món cà phê ngon nhất! 😊\n\nNHH Coffee có nhiều loại cà phê đặc trưng, mỗi loại mang một hương vị riêng đấy:\n\n1.  **Cà phê đen đá** (25.000đ): Nếu bạn thích vị cà phê truyền thống, đậm đà, đắng đặc trưng và có hậu ngọt thanh thì đây là lựa chọn tuyệt vời.\n2.  **Cà phê sữa đá** (29.000đ): Đây là "thức uống quốc dân" với sự kết hợp hoàn hảo giữa cà phê đậm đà và sữa đặc béo ngậy, tạo nên hương vị khó quên.\n3.  **Bạc xỉu** (32.000đ): Nếu bạn muốn một ly cà phê nhẹ nhàng hơn, nhiều sữa và ngọt béo, ít đắng thì bạc xỉu là lựa chọn lý tưởng.\n4.  **Americano** (39.000đ): Dành cho những ai yêu thích hương vị cà phê thuần túy nhưng muốn một ly nhẹ nhàng hơn espresso gốc.\n\nĐể mình có thể gợi ý chuẩn xác hơn, bạn thích cà phê vị **đắng đậm** hay **ngọt béo**, và bạn muốn uống **nóng** hay **lạnh** nhỉ? 😊	2026-01-25 23:36:18.714	assistant	{"intent": "product_inquiry", "confidence": 0.98}
7e7a562b-7dc6-46e9-af4e-aeb348d56181	0d7f3894-6b69-4aa9-b6fd-e9485ce0e3c0	3	xin chào	2026-01-25 16:41:18.421	user	{}
aa6fcd8a-5379-4487-9825-6488d0a9f26d	eb6d1917-e788-43f2-bf4a-4021fbcf9217	1	xin chào	2026-01-25 16:42:40.094	user	{}
7059d357-4529-4aa8-a104-1c83b4e89eec	eb6d1917-e788-43f2-bf4a-4021fbcf9217	1	xin chào	2026-01-25 16:49:34.961	user	{}
217d80db-4d76-43ba-9e7a-600b4e75c7a2	eb6d1917-e788-43f2-bf4a-4021fbcf9217	1	alo	2026-01-25 16:52:51.806	user	{}
e26f494c-71c8-43b8-b7d2-58af7fd30cb6	eb6d1917-e788-43f2-bf4a-4021fbcf9217	1	lô	2026-01-25 16:54:36.421	user	{}
1743c638-afa9-40a3-ad4f-a7d164849aff	0db28529-7df6-4877-8364-3ccffa5ce30c	1	lo	2026-01-25 16:58:15.997	user	{}
bc45df86-3348-4477-b236-74eda96d59e2	0db28529-7df6-4877-8364-3ccffa5ce30c	2	hi	2026-01-25 16:58:29.002	user	{}
52fbf130-4e6d-4815-b409-93d76b0e971b	0db28529-7df6-4877-8364-3ccffa5ce30c	1	hi	2026-01-25 16:58:35.052	user	{}
6a86381e-9082-4701-a92e-b523fc605110	0922625d-73be-4f48-a140-e93ada14c6fd	\N	Sản phẩm nào đang khuyến mãi?	2026-01-25 23:58:40.36	user	{}
21eaac97-9a53-44fe-bdab-2f43ef4ba23f	0922625d-73be-4f48-a140-e93ada14c6fd	\N	Chào bạn! Mình là trợ lý AI của NHH Coffee ☕ Rất vui được hỗ trợ bạn hôm nay! 😊\n\nNHH Coffee đang có một số ưu đãi cực hấp dẫn dành cho bạn đây:\n\n*   **Combo nhóm** siêu tiết kiệm chỉ còn **189.000đ** (giảm 22%) - Rất phù hợp cho nhóm bạn hoặc gia đình đó ạ!\n*   Các loại **cà phê hạt** cao cấp cũng đang được giảm giá mạnh để bạn mang hương vị NHH Coffee về nhà:\n    *   **Espresso Blend:** Chỉ còn **195.000đ** (giảm 19%)\n    *   **Arabica Đà Lạt:** Chỉ còn **180.000đ** (giảm 18%)\n    *   **Blend House:** Chỉ còn **165.000đ** (giảm 18%)\n*   Và đặc biệt, **Combo đôi** ngọt ngào chỉ còn **119.000đ** (giảm 21%), lý tưởng cho buổi hẹn hò hoặc thư giãn cùng người thân yêu.\n\nBạn có muốn mình tư vấn thêm về combo nào không ạ? Các ưu đãi này đang rất được yêu thích đấy! 😉	2026-01-25 23:58:48.193	assistant	{"intent": "product_inquiry", "confidence": 0.98}
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_sessions (id, user_id, staff_id, status, created_at, closed_at, guest_id, metadata) FROM stdin;
46d62003-0939-4af8-8ae1-2eada404ab70	\N	\N	active	2026-01-25 23:03:30.407	\N	\N	{}
e770ce0e-dd93-45d1-b96f-34e68b0d59bd	\N	\N	active	2026-01-25 23:04:04.807	\N	\N	{}
bd5407f1-90cd-4825-9cde-471cc335b790	\N	\N	active	2026-01-25 23:04:28.638	\N	\N	{}
745c24ee-b8f8-4078-aa8f-95d71877f905	\N	\N	active	2026-01-25 23:04:58.248	\N	\N	{}
fa217a1a-cb46-4e00-a8a4-1f31fcceb7ff	\N	\N	active	2026-01-25 23:05:21.397	\N	\N	{}
35ffef5f-b492-47ad-93a9-d2360f466e6f	\N	\N	active	2026-01-25 23:06:16.37	\N	\N	{}
f40bb82c-7469-45c0-b789-8a4f7091c31b	\N	\N	active	2026-01-25 23:06:51.605	\N	\N	{}
9178bce0-149f-4449-aa1a-fb3414ac71b3	\N	\N	active	2026-01-25 23:07:31.401	\N	\N	{}
9ec46457-6465-4453-8f2c-7efb7f815bd6	\N	\N	active	2026-01-25 23:07:53.752	\N	\N	{}
44b39289-94a4-472b-b6d6-88235fc5d201	\N	\N	active	2026-01-25 23:10:34.634	\N	\N	{}
772560cf-044c-434f-b3d3-331139ca4129	\N	\N	active	2026-01-25 23:10:39.227	\N	\N	{}
11ee6412-4202-49ef-b149-1e9ed5298e0f	\N	\N	active	2026-01-25 23:11:55.941	\N	\N	{}
ec5e994e-5cbd-4cc7-b693-043d6be1b2b1	\N	\N	active	2026-01-25 23:12:17.313	\N	\N	{}
58e0236f-3f3b-40c0-8b33-eac97ff37c0d	\N	\N	active	2026-01-25 23:24:09.451	\N	\N	{}
24e64e8f-72d4-4bef-99e9-14f4d55fd22e	\N	\N	active	2026-01-25 23:24:30.764	\N	\N	{}
df9ce26b-c4d7-43a4-a62a-af5b3980200a	\N	\N	active	2026-01-25 23:24:55.994	\N	\N	{}
37a4d324-7290-4dae-9c81-c59d112ab8d0	\N	\N	active	2026-01-25 23:36:11.614	\N	\N	{}
0d7f3894-6b69-4aa9-b6fd-e9485ce0e3c0	3	\N	waiting	2026-01-25 16:41:18.398	\N	\N	{}
eb6d1917-e788-43f2-bf4a-4021fbcf9217	1	\N	closed	2026-01-25 16:42:40.089	2026-01-25 16:58:13.179	\N	{}
0db28529-7df6-4877-8364-3ccffa5ce30c	1	2	active	2026-01-25 16:58:15.992	\N	\N	{}
0922625d-73be-4f48-a140-e93ada14c6fd	\N	\N	active	2026-01-25 23:58:40.353	\N	\N	{}
\.


--
-- Data for Name: chatbot_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chatbot_feedback (id, message_id, session_id, rating, feedback, created_at) FROM stdin;
\.


--
-- Data for Name: chatbot_knowledge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chatbot_knowledge (id, title, content, category, tags, is_active, created_at, updated_at) FROM stdin;
13a3cef6-a810-46bf-81d5-ec28008248f1	Giờ mở cửa	NHH Coffee mở cửa từ 7h sáng đến 10h tối hàng ngày, kể cả cuối tuần và ngày lễ.	thông tin quán	{giờ,"mở cửa","thời gian"}	t	2026-01-26 10:03:20.858374	2026-01-26 10:03:20.858374
74ba4249-3f28-4161-9659-4a2acd95e52f	Wifi miễn phí	Quán có wifi miễn phí cho khách. Mật khẩu: NHHCoffee2024	tiện ích	{wifi,internet,"mật khẩu"}	t	2026-01-26 10:03:20.860818	2026-01-26 10:03:20.860818
259bb860-3e7d-4d3c-a778-6606f3472511	Bãi đậu xe	Quán có bãi đậu xe miễn phí cho khách ở phía sau quán, sức chứa khoảng 20 xe máy và 5 ô tô.	tiện ích	{"đậu xe","bãi xe",parking}	t	2026-01-26 10:03:20.86175	2026-01-26 10:03:20.86175
702d3ba1-3c00-4b7e-a5c2-0f1a13d8a8b2	Đặt bàn trước	Quý khách có thể đặt bàn trước qua hotline 1900-xxxx hoặc trực tiếp tại quán. Đặt bàn từ 2 người trở lên.	dịch vụ	{"đặt bàn",reservation,booking}	t	2026-01-26 10:03:20.862223	2026-01-26 10:03:20.862223
918b7423-fd2e-4890-9046-cf242f7e2b6e	Giao hàng tận nơi	NHH Coffee có dịch vụ giao hàng tận nơi trong bán kính 5km. Phí ship từ 15.000đ. Đơn hàng từ 200.000đ được miễn phí ship.	dịch vụ	{"giao hàng",ship,delivery}	t	2026-01-26 10:03:20.862537	2026-01-26 10:03:20.862537
6b9af9e1-d980-4e8b-826d-bca874415e10	Chương trình khách hàng thân thiết	Tích điểm mỗi lần mua hàng. 1.000đ = 1 điểm. Đổi điểm lấy voucher giảm giá và quà tặng hấp dẫn.	khuyến mãi	{"tích điểm",loyalty,"thành viên"}	t	2026-01-26 10:03:20.862919	2026-01-26 10:03:20.862919
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, created_at) FROM stdin;
90f18546-b909-4dee-8a27-85903831758c	1	order_status	Đơn hàng Đã xác nhận	Đơn hàng #4e5bbf21 đã được cập nhật trạng thái	{"status": "confirmed", "orderId": "4e5bbf21-6715-46c9-9639-07c8170aede4"}	t	2026-01-12 04:23:16.662
8d2fdfe4-d722-4602-a22b-d65758522339	1	order_status	Đơn hàng Đang giao hàng	Đơn hàng #4e5bbf21 đã được cập nhật trạng thái	{"status": "shipping", "orderId": "4e5bbf21-6715-46c9-9639-07c8170aede4"}	f	2026-01-12 04:24:43.598
239fc5de-8243-4f66-95e4-048b0109b1d4	1	order_status	Đơn hàng Đã giao hàng	Đơn hàng #4e5bbf21 đã được cập nhật trạng thái	{"status": "delivered", "orderId": "4e5bbf21-6715-46c9-9639-07c8170aede4"}	f	2026-01-12 04:24:50.076
790a6b84-8960-4429-b2e5-71af3d9a091a	1	order_status	Đơn hàng Đã xác nhận	Đơn hàng #277636f4 đã được cập nhật trạng thái	{"status": "confirmed", "orderId": "277636f4-705e-4091-89bb-b0dbcc39c866"}	f	2026-01-12 14:24:04.511
101db0da-ffdc-4b45-933f-d06580fd2702	3	order_status	Đơn hàng Đã xác nhận	Đơn hàng #89f2e56a đã được cập nhật trạng thái	{"status": "confirmed", "orderId": "89f2e56a-0484-4016-a0ad-4e25eafb3758"}	f	2026-01-24 10:50:18.94
38bc211b-8605-4a9c-bb7f-a71fe9b93521	3	order_status	Đơn hàng Đang giao hàng	Đơn hàng #89f2e56a đã được cập nhật trạng thái	{"status": "shipping", "orderId": "89f2e56a-0484-4016-a0ad-4e25eafb3758"}	f	2026-01-24 10:50:19.775
9c639609-2eb6-4686-93c0-7c44c14c6f2f	3	order_status	Đơn hàng Đã giao hàng	Đơn hàng #89f2e56a đã được cập nhật trạng thái	{"status": "delivered", "orderId": "89f2e56a-0484-4016-a0ad-4e25eafb3758"}	t	2026-01-24 10:50:20.614
40659c98-cc83-4aaa-b73f-fe2e813c8b31	3	order_status	Đơn hàng Đã xác nhận	Đơn hàng #0df8dfaa đã được cập nhật trạng thái	{"status": "confirmed", "orderId": "0df8dfaa-eeb8-457b-a337-5c1029a864a5"}	f	2026-01-26 08:32:10.059
66cf74a8-f4de-4ebf-a9a1-ccf1ba237571	3	order_status	Đơn hàng Đang giao hàng	Đơn hàng #0df8dfaa đã được cập nhật trạng thái	{"status": "shipping", "orderId": "0df8dfaa-eeb8-457b-a337-5c1029a864a5"}	f	2026-01-26 08:32:11.025
7bb04462-b60a-40af-928c-3d02f4316dd7	3	order_status	Đơn hàng Đã giao hàng	Đơn hàng #0df8dfaa đã được cập nhật trạng thái	{"status": "delivered", "orderId": "0df8dfaa-eeb8-457b-a337-5c1029a864a5"}	f	2026-01-26 08:32:12.573
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, quantity, price) FROM stdin;
63221860-ee9d-412d-aa70-04ae214c06af	4e5bbf21-6715-46c9-9639-07c8170aede4	39	1	165000.00
565abf11-9e73-49c4-b942-4795cbc89d13	00c7d566-e2dd-4ac3-8095-fa15081bd0bf	40	1	195000.00
72d680f7-851a-475d-9468-4dc9165ea8d9	0824a984-9c57-4936-8766-c7e6b2f56072	40	1	195000.00
de5b8e11-9d18-4a44-8731-b7d20192e4de	2cb7a0a1-eb2f-4bf2-a68d-156fe1e8e7e0	38	1	150000.00
3346b58b-293c-4831-99b7-d9570300b5e0	277636f4-705e-4091-89bb-b0dbcc39c866	38	1	150000.00
3f8d58c2-6aaf-476b-aa75-ee93e4638712	aa0805e4-5546-4a3b-8bbb-20af7efb3868	40	1	195000.00
111bcdf2-b37d-42e8-91d8-e4237ae0813f	8a67ec79-7116-45f5-91dd-38faff296eec	38	1	150000.00
c13c1d58-e5e4-4511-b52e-e435afeba0ba	c4629b8c-be30-49a2-955c-d3ebf3666ac9	40	1	195000.00
dfb1b966-0ac4-4dea-a40e-480c0d7b8a6b	f0087bda-46b9-431c-9987-77731dfeaebd	38	1	150000.00
9901c136-4903-49e9-950e-ad3c38dfe5f4	dba8a8f3-6f95-40e8-8ae9-651e63d509df	40	1	195000.00
a24aaaef-2d87-4900-b2b4-fb8103068e9d	c5c8b711-d795-4ec0-b726-5fddedbb0b47	40	1	195000.00
05e85597-fd54-468f-a1f2-8f0a8e82a713	ce06649d-3e2a-481c-8744-7554e3b08b97	40	1	195000.00
24037e89-2202-46fd-a7c4-7725cda83045	d09c35cb-337e-4e3a-b394-757a57bc39d2	4	2	35000.00
9c3eeb85-02b1-402a-a7e1-a91a691145a0	d09c35cb-337e-4e3a-b394-757a57bc39d2	38	1	150000.00
8929e74d-a05f-4d26-a613-75a52951872e	d09c35cb-337e-4e3a-b394-757a57bc39d2	38	1	150000.00
131e8295-87fb-4241-8cab-d720c75050ce	46f21362-c317-4bac-8593-ba6240cc5455	38	1	150000.00
e589387e-a268-47d7-9dfb-d09b9fef823d	89f2e56a-0484-4016-a0ad-4e25eafb3758	39	1	165000.00
9259e9bc-e27e-4e39-82d6-021e55ebbe0b	5b142a81-7ee5-4da9-9347-3564cd33cf21	5	1	39000.00
8666ef29-c975-4d59-91e4-ab0bd3b19ccf	5b142a81-7ee5-4da9-9347-3564cd33cf21	3	1	32000.00
319b019d-f090-4c02-ad31-0bf80d5ae33c	5b142a81-7ee5-4da9-9347-3564cd33cf21	38	1	150000.00
e5759c1b-f2ed-4622-98b7-e780ea1b68fa	ff821822-0a03-4da7-a174-313a2e54c2b9	4	2	35000.00
008ae88e-b7dc-47de-80ea-c617a2c1356a	ff821822-0a03-4da7-a174-313a2e54c2b9	3	2	32000.00
4eb1a5c4-4521-4e22-a23d-6583ee2af3fd	7d21a611-0b62-4314-b946-84c202ea1faa	39	1	165000.00
7fdff36d-b872-4c70-b2dd-9bfd7ba809a0	8afa0f1e-2831-49c2-8a6c-c39a036c1e6b	40	1	195000.00
d9f07059-0620-4e2e-85e8-61cf281c8f7e	0df8dfaa-eeb8-457b-a337-5c1029a864a5	40	1	195000.00
\.


--
-- Data for Name: order_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_notes (id, order_id, staff_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: order_returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_returns (id, order_id, user_id, reason, status, refund_amount, staff_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, user_id, total, status, shipping_address, payment_method, created_at, note, phone, recipient_name, discount_amount, promotion_id, subtotal, tracking_code, shipping_carrier, shipping_fee) FROM stdin;
4e5bbf21-6715-46c9-9639-07c8170aede4	1	165000.00	delivered	123 Đường ABC, Quận 1, TP.HCM	bank_transfer	2026-01-12 04:19:20.666	\N	0901234567	Nguyễn Văn A	0.00	\N	\N	\N	\N	0.00
00c7d566-e2dd-4ac3-8095-fa15081bd0bf	\N	195000.00	delivered	Mua tại cửa hàng	card	2026-01-12 04:28:10.577	POS - Nhân viên: admin@nhh-coffee.com	0329610134	hieu	0.00	\N	\N	\N	\N	0.00
0824a984-9c57-4936-8766-c7e6b2f56072	\N	195000.00	delivered	Mua tại cửa hàng	card	2026-01-12 14:16:09.4	POS - Nhân viên: admin@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
2cb7a0a1-eb2f-4bf2-a68d-156fe1e8e7e0	\N	150000.00	confirmed	Mua tại cửa hàng	card	2026-01-12 14:22:36.699	POS - Nhân viên: admin@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
277636f4-705e-4091-89bb-b0dbcc39c866	1	150000.00	confirmed	123 Đường ABC, Quận 1, TP.HCM	cod	2026-01-12 14:23:21.168	\N	0901234567	Nguyễn Văn A	0.00	\N	\N	\N	\N	0.00
aa0805e4-5546-4a3b-8bbb-20af7efb3868	\N	195000.00	confirmed	Mua tại cửa hàng	cash	2026-01-23 12:50:24.276	POS - Nhân viên: admin@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
8a67ec79-7116-45f5-91dd-38faff296eec	\N	150000.00	delivered	Mua tại cửa hàng	cash	2026-01-23 12:50:53.717	POS - Nhân viên: admin@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
c4629b8c-be30-49a2-955c-d3ebf3666ac9	\N	195000.00	confirmed	Mua tại cửa hàng	cash	2026-01-23 12:57:39.806	POS - Nhân viên: staff@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
f0087bda-46b9-431c-9987-77731dfeaebd	\N	150000.00	confirmed	Mua tại cửa hàng	cash	2026-01-23 13:38:36.822	POS - Nhân viên: staff@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
dba8a8f3-6f95-40e8-8ae9-651e63d509df	\N	195000.00	confirmed	Mua tại cửa hàng	cash	2026-01-23 13:46:39.07	POS - Nhân viên: staff@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
c5c8b711-d795-4ec0-b726-5fddedbb0b47	\N	195000.00	confirmed	Mua tại cửa hàng	cash	2026-01-23 13:56:04.97	POS - Nhân viên: staff@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
46f21362-c317-4bac-8593-ba6240cc5455	3	150000.00	pending	Mang đi	cash	2026-01-23 19:01:05.612	Đơn mang đi	032836226	Khách mang đi	0.00	\N	\N	\N	\N	0.00
89f2e56a-0484-4016-a0ad-4e25eafb3758	3	205000.00	delivered	NHH-Coffee Store	cod	2026-01-24 10:49:54.349	\N	0908888888	Nhân viên Bán hàng	0.00	\N	\N	\N	\N	0.00
ce06649d-3e2a-481c-8744-7554e3b08b97	\N	195000.00	delivered	Mua tại cửa hàng	cash	2026-01-23 14:01:21.404	POS - Nhân viên: staff@nhh-coffee.com		Khách lẻ	0.00	\N	\N	\N	\N	0.00
8afa0f1e-2831-49c2-8a6c-c39a036c1e6b	\N	195000.00	delivered	Bàn T-02	cash	2026-01-26 08:31:35.454	Đơn tại bàn T-02. 	N/A	Khách	0.00	\N	195000.00	\N	\N	0.00
0df8dfaa-eeb8-457b-a337-5c1029a864a5	3	195000.00	delivered	Mang đi	cash	2026-01-26 08:31:58.106	Đơn mang đi	096543354	Khách mang đi	0.00	\N	\N	\N	\N	0.00
d09c35cb-337e-4e3a-b394-757a57bc39d2	\N	370000.00	delivered	Bàn T-01	cash	2026-01-23 15:45:23.976	Đơn tại bàn T-01. 	N/A	Khách	0.00	\N	370000.00	\N	\N	0.00
5b142a81-7ee5-4da9-9347-3564cd33cf21	\N	221000.00	delivered	Bàn T-03	cash	2026-01-26 08:18:44.704	Đơn tại bàn T-03. 	N/A	Khách	0.00	\N	221000.00	\N	\N	0.00
ff821822-0a03-4da7-a174-313a2e54c2b9	\N	134000.00	delivered	Bàn G-01	cash	2026-01-26 08:18:53.244	Đơn tại bàn G-01. 	N/A	Khách	0.00	\N	134000.00	\N	\N	0.00
7d21a611-0b62-4314-b946-84c202ea1faa	\N	165000.00	delivered	Bàn T-03	cash	2026-01-26 08:21:55.592	Đơn tại bàn T-03. 	N/A	Khách	0.00	\N	165000.00	\N	\N	0.00
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_resets (id, email, otp_hash, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: pending_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_registrations (id, email, password, name, otp, otp_hash, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: points_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_history (id, user_id, points, type, description, order_id, created_at) FROM stdin;
\.


--
-- Data for Name: product_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_questions (id, product_id, user_id, question, answer, answered_by, answered_at, created_at) FROM stdin;
\.


--
-- Data for Name: product_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_suppliers (id, product_id, supplier_id, cost_price, lead_time_days, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, slug, description, price, original_price, images, category_id, brand, specs, stock, rating, review_count, is_new, is_featured, discount, created_at, low_stock_threshold) FROM stdin;
1	Cà phê đen đá	ca-phe-den-da	Cà phê đen truyền thống pha phin, đậm đà hương vị Việt Nam. Hạt cà phê Robusta được rang xay tươi mỗi ngày, mang đến vị đắng đặc trưng và hậu ngọt thanh.	25000.00	30000.00	{https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500}	1	NHH-Coffee	{"Đá": "Có thể điều chỉnh", "_sizes": ["M", "L"], "Caffeine": "Cao", "_toppings": ["Thêm shot espresso", "Sữa đặc"], "Đường": "Có thể điều chỉnh", "Kích cỡ": "M/L"}	999	4.8	156	f	t	17	2026-01-08 02:08:47.522	10
2	Cà phê sữa đá	ca-phe-sua-da	Cà phê sữa đá - thức uống quốc dân của người Việt. Sự kết hợp hoàn hảo giữa cà phê đậm đà và sữa đặc béo ngậy, tạo nên hương vị khó quên.	29000.00	35000.00	{https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500}	1	NHH-Coffee	{"Đá": "Có thể điều chỉnh", "_sizes": ["M", "L"], "Đường": "Có thể điều chỉnh", "Kích cỡ": "M/L"}	999	4.9	234	f	t	17	2026-01-08 02:08:47.528	10
3	Bạc xỉu	bac-xiu	Bạc xỉu - cà phê sữa phiên bản nhẹ nhàng hơn, nhiều sữa hơn, phù hợp cho những ai thích vị ngọt béo và ít đắng.	32000.00	38000.00	{https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.7	189	f	t	16	2026-01-08 02:08:47.529	10
4	Espresso	espresso	Espresso nguyên chất, chiết xuất từ hạt Arabica cao cấp. Đậm đặc, thơm nồng với lớp crema vàng óng hoàn hảo.	35000.00	40000.00	{https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500}	1	NHH-Coffee	{"Loại": "Single/Double shot", "_sizes": ["Single", "Double"]}	999	4.8	98	f	f	12	2026-01-08 02:08:47.529	10
5	Americano	americano	Americano - espresso pha loãng với nước nóng, giữ nguyên hương vị cà phê nhưng nhẹ nhàng hơn. Thích hợp cho những ai yêu thích vị cà phê thuần túy.	39000.00	45000.00	{https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L", "Nhiệt độ": "Nóng/Đá"}	999	4.6	87	f	f	13	2026-01-08 02:08:47.53	10
6	Cappuccino	cappuccino	Cappuccino chuẩn Ý với tỷ lệ hoàn hảo 1:1:1 giữa espresso, sữa nóng và bọt sữa mịn. Rắc bột cacao lên trên tạo điểm nhấn.	45000.00	52000.00	{https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	145	f	t	13	2026-01-08 02:08:47.53	10
7	Latte	latte	Latte mềm mại với espresso và sữa tươi đánh bông. Vị cà phê nhẹ nhàng, béo ngậy, thích hợp cho buổi sáng thư thái.	45000.00	52000.00	{https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.7	167	f	f	13	2026-01-08 02:08:47.53	10
8	Mocha	mocha	Mocha - sự kết hợp tuyệt vời giữa espresso, chocolate và sữa tươi. Vị đắng nhẹ của cà phê hòa quyện với vị ngọt của chocolate.	49000.00	55000.00	{https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	134	f	f	11	2026-01-08 02:08:47.531	10
9	Caramel Macchiato	caramel-macchiato	Caramel Macchiato với lớp sữa tươi mịn màng, espresso đậm đà và sốt caramel thơm ngọt. Thức uống hoàn hảo cho những ai yêu thích vị ngọt.	52000.00	59000.00	{https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.9	198	t	t	12	2026-01-08 02:08:47.531	10
10	Cold Brew	cold-brew	Cold Brew - cà phê ủ lạnh 18 tiếng, chiết xuất chậm để giữ trọn hương vị. Vị mượt mà, ít acid, thơm ngọt tự nhiên.	45000.00	52000.00	{https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500}	1	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	112	t	t	13	2026-01-08 02:08:47.532	10
11	Trà đào cam sả	tra-dao-cam-sa	Trà đào cam sả thanh mát với đào ngâm thơm ngọt, cam tươi và sả thơm. Thức uống giải khát hoàn hảo cho mùa hè.	39000.00	45000.00	{https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500}	2	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.9	267	f	t	13	2026-01-08 02:08:47.532	10
12	Trà vải	tra-vai	Trà vải thơm ngọt với vải tươi ngâm, vị thanh mát dễ uống. Thức uống được yêu thích nhất mùa hè.	39000.00	45000.00	{https://images.unsplash.com/photo-1558857563-b371033873b8?w=500}	2	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	189	f	t	13	2026-01-08 02:08:47.533	10
13	Trà sen vàng	tra-sen-vang	Trà sen vàng với hương sen thanh tao, vị trà xanh nhẹ nhàng. Thức uống mang đậm hương vị Việt Nam.	35000.00	42000.00	{https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500}	2	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.7	145	f	f	17	2026-01-08 02:08:47.533	10
14	Trà oolong sữa	tra-oolong-sua	Trà oolong sữa béo ngậy với trà oolong thượng hạng và sữa tươi. Vị trà đậm đà hòa quyện với sữa béo.	42000.00	49000.00	{https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500}	2	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	156	f	f	14	2026-01-08 02:08:47.533	10
15	Trà matcha đá xay	tra-matcha-da-xay	Trà matcha Nhật Bản xay đá mịn, vị trà xanh đậm đà, thơm ngon. Topping kem whip béo ngậy.	49000.00	55000.00	{https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500}	2	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.9	178	t	t	11	2026-01-08 02:08:47.534	10
16	Hồng trà	hong-tra	Hồng trà Ceylon thượng hạng, vị trà đậm đà, hương thơm đặc trưng. Có thể thêm sữa hoặc chanh.	29000.00	35000.00	{https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=500}	2	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.6	98	f	f	17	2026-01-08 02:08:47.535	10
17	Chocolate đá xay	chocolate-da-xay	Chocolate đá xay béo ngậy với bột cacao nguyên chất, sữa tươi và kem whip. Thức uống yêu thích của các bạn trẻ.	49000.00	55000.00	{https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500}	3	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	167	f	t	11	2026-01-08 02:08:47.535	10
18	Cookies & Cream	cookies-cream	Đá xay Cookies & Cream với bánh Oreo nghiền, kem vanilla và kem whip. Vị ngọt béo, giòn tan.	52000.00	59000.00	{https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500}	3	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.9	145	t	t	12	2026-01-08 02:08:47.535	10
19	Dâu đá xay	dau-da-xay	Dâu đá xay tươi mát với dâu tây tươi, sữa chua và đá xay. Vị chua ngọt hài hòa.	45000.00	52000.00	{https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500}	3	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.7	123	f	f	13	2026-01-08 02:08:47.536	10
20	Caramel đá xay	caramel-da-xay	Caramel đá xay thơm ngọt với sốt caramel, sữa tươi và kem whip. Vị ngọt béo quyến rũ.	49000.00	55000.00	{https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500}	3	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	134	f	f	11	2026-01-08 02:08:47.537	10
21	Nước ép cam	nuoc-ep-cam	Nước ép cam tươi 100% nguyên chất, không đường, giàu vitamin C. Tươi mát, bổ dưỡng.	35000.00	42000.00	{https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500}	4	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.7	89	f	f	17	2026-01-08 02:08:47.537	10
22	Nước ép dưa hấu	nuoc-ep-dua-hau	Nước ép dưa hấu tươi mát, ngọt tự nhiên. Giải khát tuyệt vời cho mùa hè.	32000.00	38000.00	{https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500}	4	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.6	76	f	f	16	2026-01-08 02:08:47.537	10
23	Sinh tố bơ	sinh-to-bo	Sinh tố bơ béo ngậy với bơ sáp chín, sữa đặc và đá xay. Thức uống bổ dưỡng, thơm ngon.	45000.00	52000.00	{https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500}	4	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.9	156	f	t	13	2026-01-08 02:08:47.538	10
24	Sinh tố xoài	sinh-to-xoai	Sinh tố xoài thơm ngọt với xoài chín, sữa tươi và đá xay. Vị ngọt tự nhiên, mát lạnh.	42000.00	49000.00	{https://images.unsplash.com/photo-1546173159-315724a31696?w=500}	4	NHH-Coffee	{"_sizes": ["M", "L"], "Kích cỡ": "M/L"}	999	4.8	134	f	f	14	2026-01-08 02:08:47.538	10
25	Bánh tiramisu	banh-tiramisu	Bánh tiramisu Ý chuẩn vị với lớp kem mascarpone mịn màng, bánh lady finger thấm cà phê espresso và rắc bột cacao.	55000.00	65000.00	{https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500}	5	NHH-Coffee	{"Bảo quản": "Ngăn mát tủ lạnh", "Khẩu phần": "1 miếng"}	50	4.9	189	f	t	15	2026-01-08 02:08:47.538	10
26	Bánh cheesecake	banh-cheesecake	Bánh cheesecake New York style với lớp phô mai cream cheese béo ngậy, đế bánh quy giòn tan.	52000.00	60000.00	{https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=500}	5	NHH-Coffee	{"Bảo quản": "Ngăn mát tủ lạnh", "Khẩu phần": "1 miếng"}	40	4.8	145	f	t	13	2026-01-08 02:08:47.539	10
27	Croissant bơ	croissant-bo	Croissant bơ Pháp với lớp vỏ giòn xốp, bên trong mềm mịn, thơm mùi bơ. Nướng tươi mỗi ngày.	35000.00	42000.00	{https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500}	5	NHH-Coffee	{"Bảo quản": "Nhiệt độ phòng", "Khẩu phần": "1 cái"}	60	4.7	167	f	f	17	2026-01-08 02:08:47.539	10
28	Bánh mì que pate	banh-mi-que-pate	Bánh mì que giòn rụm với pate gan thơm béo, bơ và chút tiêu. Món ăn nhẹ hoàn hảo kèm cà phê.	18000.00	22000.00	{https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500}	5	NHH-Coffee	{"Khẩu phần": "1 cái"}	100	4.6	234	f	f	18	2026-01-08 02:08:47.539	10
29	Bánh mousse chocolate	banh-mousse-chocolate	Bánh mousse chocolate đậm đà với lớp mousse mịn như nhung, chocolate Bỉ cao cấp.	58000.00	68000.00	{https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500}	5	NHH-Coffee	{"Bảo quản": "Ngăn mát tủ lạnh", "Khẩu phần": "1 miếng"}	35	4.9	123	t	t	15	2026-01-08 02:08:47.54	10
30	Khoai tây chiên	khoai-tay-chien	Khoai tây chiên giòn rụm, vàng ươm. Ăn kèm sốt mayonnaise hoặc tương cà.	35000.00	42000.00	{https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500}	6	NHH-Coffee	{"Khẩu phần": "1 phần"}	80	4.5	98	f	f	17	2026-01-08 02:08:47.54	10
31	Gà viên chiên	ga-vien-chien	Gà viên chiên giòn với thịt gà xay mịn, vỏ ngoài giòn tan. Ăn kèm sốt chua ngọt.	42000.00	49000.00	{https://images.unsplash.com/photo-1562967914-608f82629710?w=500}	6	NHH-Coffee	{"Khẩu phần": "6 viên"}	70	4.6	87	f	f	14	2026-01-08 02:08:47.541	10
32	Sandwich gà	sandwich-ga	Sandwich gà với thịt gà xé, rau xà lách, cà chua và sốt mayonnaise. Bánh mì sandwich mềm mịn.	45000.00	52000.00	{https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500}	6	NHH-Coffee	{"Khẩu phần": "1 cái"}	50	4.7	112	f	f	13	2026-01-08 02:08:47.541	10
33	Combo sáng 1	combo-sang-1	Combo sáng tiết kiệm: 1 Cà phê sữa đá + 1 Croissant bơ. Bữa sáng hoàn hảo để bắt đầu ngày mới.	55000.00	71000.00	{https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500}	7	NHH-Coffee	{"Bao gồm": "Cà phê sữa đá + Croissant bơ"}	999	4.8	145	f	t	23	2026-01-08 02:08:47.541	10
34	Combo sáng 2	combo-sang-2	Combo sáng đầy đủ: 1 Cappuccino + 1 Bánh tiramisu. Thưởng thức buổi sáng sang trọng.	89000.00	117000.00	{https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500}	7	NHH-Coffee	{"Bao gồm": "Cappuccino + Bánh tiramisu"}	999	4.9	98	f	t	24	2026-01-08 02:08:47.542	10
35	Combo đôi	combo-doi	Combo cho 2 người: 2 Trà đào cam sả + 1 Bánh cheesecake. Thích hợp cho buổi hẹn hò.	119000.00	150000.00	{https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=500}	7	NHH-Coffee	{"Bao gồm": "2 Trà đào cam sả + 1 Bánh cheesecake"}	999	4.8	76	t	t	21	2026-01-08 02:08:47.542	10
36	Combo nhóm	combo-nhom	Combo cho nhóm 4 người: 4 đồ uống tự chọn (dưới 50k) + 1 Khoai tây chiên. Tiết kiệm khi đi nhóm.	189000.00	242000.00	{https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=500}	7	NHH-Coffee	{"Bao gồm": "4 đồ uống + 1 Khoai tây chiên"}	999	4.7	67	f	f	22	2026-01-08 02:08:47.543	10
37	Cà phê hạt Arabica Đà Lạt	ca-phe-hat-arabica-da-lat	Cà phê hạt Arabica Đà Lạt 100% nguyên chất. Hương thơm nhẹ nhàng, vị chua thanh đặc trưng, hậu ngọt dài. Rang medium roast.	180000.00	220000.00	{https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500}	8	NHH-Coffee	{"Rang": "Medium Roast", "Độ cao": "1500m", "Xuất xứ": "Đà Lạt, Lâm Đồng", "Trọng lượng": "250g"}	100	4.9	89	f	t	18	2026-01-08 02:08:47.543	10
38	Cà phê hạt Robusta Buôn Ma Thuột	ca-phe-hat-robusta-buon-ma-thuot	Cà phê hạt Robusta Buôn Ma Thuột đậm đà. Vị đắng mạnh, hương thơm nồng, caffeine cao. Rang dark roast truyền thống.	150000.00	180000.00	{https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500}	8	NHH-Coffee	{"Rang": "Dark Roast", "Xuất xứ": "Buôn Ma Thuột, Đắk Lắk", "Trọng lượng": "250g"}	115	4.8	156	f	t	17	2026-01-08 02:08:47.544	10
39	Cà phê hạt Blend House	ca-phe-hat-blend-house	Cà phê hạt Blend House đặc biệt của NHH-Coffee. Phối trộn Arabica và Robusta tỷ lệ vàng, cân bằng giữa hương thơm và vị đậm.	165000.00	200000.00	{https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500}	8	NHH-Coffee	{"Rang": "Medium-Dark Roast", "Thành phần": "60% Arabica + 40% Robusta", "Trọng lượng": "250g"}	78	4.9	134	t	t	18	2026-01-08 02:08:47.544	10
40	Cà phê hạt Espresso Blend	ca-phe-hat-espresso-blend	Cà phê hạt Espresso Blend chuyên dụng cho máy pha. Crema dày, vị đậm đà, hương thơm quyến rũ.	195000.00	240000.00	{https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500}	8	NHH-Coffee	{"Rang": "Dark Roast", "Phù hợp": "Máy pha espresso", "Thành phần": "70% Arabica + 30% Robusta", "Trọng lượng": "250g"}	52	4.8	78	f	f	19	2026-01-08 02:08:47.545	10
\.


--
-- Data for Name: promotion_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotion_usage (id, promotion_id, user_id, order_id, discount_amount, created_at) FROM stdin;
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotions (id, code, name, description, type, value, min_order_value, max_discount, usage_limit, used_count, start_date, end_date, is_active, created_at, updated_at) FROM stdin;
8006dcf1-d13f-4b0d-a50a-e6fc62ccdd60	SALE50	Giảm 50%	\N	percentage	50.00	1.00	\N	1	1	2026-01-07 23:45:00+07	2026-01-24 23:45:00+07	t	2026-01-07 23:45:31.694641+07	2026-01-07 23:45:31.694641+07
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) FROM stdin;
\.


--
-- Data for Name: return_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.return_items (id, return_id, order_item_id, product_id, quantity, reason) FROM stdin;
\.


--
-- Data for Name: review_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_images (id, review_id, url, public_id, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, user_id, product_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: shift_swap_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_swap_requests (id, requester_id, requester_shift_id, target_id, target_shift_id, status, reason, response_note, responded_by, responded_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shifts (id, name, start_time, end_time, description, color, is_active, created_at, updated_at) FROM stdin;
cb28a1aa-313f-4fbe-bbca-55c6421f17b1	Ca sang	06:00:00	14:00:00	Ca lam viec buoi sang	#22c55e	t	2026-01-13 04:36:28.453797	2026-01-13 04:36:28.453797
d72c2a8d-8120-401b-b173-1de8ffea513c	Ca chieu	14:00:00	22:00:00	Ca lam viec buoi chieu	#3b82f6	t	2026-01-13 04:36:28.453797	2026-01-13 04:36:28.453797
3a5e6e99-c366-4be1-8ae8-15485270ec11	Ca toi	18:00:00	23:00:00	Ca lam viec buoi toi	#8b5cf6	t	2026-01-13 04:36:28.453797	2026-01-13 04:36:28.453797
c78046e6-3575-4ec2-87cb-9e305174617e	Ca hanh chinh	08:00:00	17:00:00	Ca hanh chinh van phong	#f59e0b	t	2026-01-13 04:36:28.453797	2026-01-13 04:36:28.453797
\.


--
-- Data for Name: staff_shifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_shifts (id, staff_id, shift_id, work_date, status, check_in_time, check_out_time, notes, created_by, created_at, updated_at) FROM stdin;
dfc5e42a-ab47-4b46-a772-854b8d209462	3	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-23	scheduled	\N	\N	\N	\N	2026-01-23 20:25:03.753768	2026-01-23 20:25:03.753768
718f577b-2bb1-4940-a377-f25cf494c03c	4	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-22	scheduled	\N	\N	\N	\N	2026-01-23 20:48:16.781711	2026-01-23 20:48:16.781711
dce7b4c7-d2ef-485a-987e-7ad92279ab09	4	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-23	scheduled	\N	\N	\N	\N	2026-01-23 20:48:16.781711	2026-01-23 20:48:16.781711
13b3dc92-7989-465b-929b-56608b3d906e	4	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-24	scheduled	\N	\N	\N	\N	2026-01-23 20:48:16.781711	2026-01-23 20:48:16.781711
5cd2845c-850a-4067-a528-17c748aad7d7	4	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-25	scheduled	\N	\N	\N	\N	2026-01-23 20:48:16.781711	2026-01-23 20:48:16.781711
8f1480bd-3926-4172-9b91-06c941ed30d5	3	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-26	scheduled	\N	\N	\N	2	2026-01-26 00:15:09.112215	2026-01-26 00:15:09.112215
3194f5a2-e2f0-4829-a2c0-c0cf5847aeff	3	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-27	scheduled	\N	\N	\N	2	2026-01-26 00:15:09.112215	2026-01-26 00:15:09.112215
514c5de5-bbec-4470-8ddf-e6a142af5fe0	3	c78046e6-3575-4ec2-87cb-9e305174617e	2026-01-28	scheduled	\N	\N	\N	2	2026-01-26 00:15:09.112215	2026-01-26 00:15:09.112215
\.


--
-- Data for Name: stock_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transactions (id, product_id, user_id, type, quantity, reason, reference, stock_before, stock_after, created_at) FROM stdin;
1dd85474-7f1e-4c4f-b32d-0598ccfa901a	40	2	order	-1	Bán hàng POS	00c7d566-e2dd-4ac3-8095-fa15081bd0bf	60	59	2026-01-12 04:28:10.577
dbf0530f-fd73-4abd-8ba9-228ca98097e6	40	2	order	-1	Bán hàng POS	0824a984-9c57-4936-8766-c7e6b2f56072	59	58	2026-01-12 14:16:09.4
7e366d6c-3946-49c5-b7df-fb20f111eb81	38	2	order	-1	Bán hàng POS	2cb7a0a1-eb2f-4bf2-a68d-156fe1e8e7e0	120	119	2026-01-12 14:22:36.699
1d94aa28-ee41-4e4b-bfa8-2b6fd2f653c7	40	2	order	-1	Bán hàng POS	aa0805e4-5546-4a3b-8bbb-20af7efb3868	58	57	2026-01-23 12:50:24.276
b535ce9a-a128-4fd5-8c8e-2c6dd26334aa	38	2	order	-1	Bán hàng POS	8a67ec79-7116-45f5-91dd-38faff296eec	118	117	2026-01-23 12:50:53.717
21c95425-18f5-44b4-a075-42eee1a1e5ed	40	3	order	-1	Bán hàng POS	c4629b8c-be30-49a2-955c-d3ebf3666ac9	57	56	2026-01-23 12:57:39.806
0b7b3974-61d7-4f9d-881f-ce5fe72f2d57	38	3	order	-1	Bán hàng POS	f0087bda-46b9-431c-9987-77731dfeaebd	117	116	2026-01-23 13:38:36.822
516bae55-6c93-4e02-8cb4-5c75cc88619b	40	3	order	-1	Bán hàng POS	dba8a8f3-6f95-40e8-8ae9-651e63d509df	56	55	2026-01-23 13:46:39.07
ff83eed0-6251-4d58-9f66-1be658090e75	40	3	order	-1	Bán hàng POS	c5c8b711-d795-4ec0-b726-5fddedbb0b47	55	54	2026-01-23 13:56:04.97
68a6cd6c-a8ee-4252-82fc-36d9010eb885	40	3	order	-1	Bán hàng POS	ce06649d-3e2a-481c-8744-7554e3b08b97	54	53	2026-01-23 14:01:21.404
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, contact_name, email, phone, address, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: table_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.table_order_items (id, table_order_id, product_id, product_name, product_image, quantity, price, notes, status, created_at, updated_at) FROM stdin;
90110343-9860-4ec3-acac-66ce671633c0	9c2fdbeb-bac2-4611-8537-5fe7ad5543b8	5	Americano	https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500	1	39000.00	\N	served	2026-01-23 13:30:24.353746	2026-01-23 13:30:24.353746
5a39e800-adb5-49c5-a3d9-bac8adc13a8c	4fa83403-7052-4b91-a398-30a9392c356e	1	Cà phê đen đá	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500	1	25000.00	\N	cancelled	2026-01-23 13:30:24.353746	2026-01-23 13:33:21.640445
d780da81-1773-4096-b171-cf17b402c90f	4fa83403-7052-4b91-a398-30a9392c356e	10	Cold Brew	https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500	2	45000.00	\N	cancelled	2026-01-23 13:30:24.353746	2026-01-23 13:33:22.460413
3344cab3-c776-4fe3-a15d-fce46b328f4c	4fa83403-7052-4b91-a398-30a9392c356e	4	Espresso	https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500	2	35000.00	\N	served	2026-01-23 13:30:24.353746	2026-01-23 13:33:57.84549
136e9873-3b55-42b2-82e9-32a58a4ec347	9c2fdbeb-bac2-4611-8537-5fe7ad5543b8	3	Bạc xỉu	https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500	1	32000.00	\N	served	2026-01-23 13:30:24.353746	2026-01-23 13:33:59.835888
af148f62-e959-4546-8985-2f65add3518b	e0be60e8-c2ac-4085-a220-90a9125869d2	3	Bạc xỉu	https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500	2	32000.00	\N	served	2026-01-23 13:30:24.353746	2026-01-23 13:34:00.598363
03ba9fb8-e2f1-45f7-bd64-9b8e169907ef	e0be60e8-c2ac-4085-a220-90a9125869d2	4	Espresso	https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500	2	35000.00	\N	served	2026-01-23 13:30:24.353746	2026-01-23 13:34:01.093719
5ec8c5b7-1f14-4d4b-85f2-c8c41b6353bd	4fa83403-7052-4b91-a398-30a9392c356e	38	Cà phê hạt Robusta Buôn Ma Thuột	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500	1	150000.00	\N	served	2026-01-23 13:33:13.422071	2026-01-23 13:34:01.520118
ba521d14-2362-4f14-bb69-0bf45621789b	4fa83403-7052-4b91-a398-30a9392c356e	38	Cà phê hạt Robusta Buôn Ma Thuột	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500	1	150000.00	\N	served	2026-01-23 13:34:09.751451	2026-01-23 15:09:15.347876
55d60462-7614-4963-adc1-64e77581aa07	9c2fdbeb-bac2-4611-8537-5fe7ad5543b8	38	Cà phê hạt Robusta Buôn Ma Thuột	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500	1	150000.00	\N	served	2026-01-23 15:07:16.236781	2026-01-23 15:09:15.974474
ef4fdea2-e4aa-46fc-8c0f-c0d494cf5b55	37530a6a-5592-4dd4-bd89-d48fa504c2ec	39	Cà phê hạt Blend House	https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500	1	165000.00	\N	served	2026-01-26 08:21:34.26936	2026-01-26 08:21:43.325801
b4ae7cff-5074-4a2f-a320-f44f382446e7	32b23885-38ae-4d39-96a1-20ef4f781305	40	Cà phê hạt Espresso Blend	https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500	1	195000.00	\N	served	2026-01-26 08:31:18.451723	2026-01-26 08:31:27.618768
\.


--
-- Data for Name: table_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.table_orders (id, order_number, table_id, staff_id, guests_count, subtotal, discount_amount, discount_reason, total, status, payment_method, payment_status, paid_at, notes, created_at, updated_at) FROM stdin;
4fa83403-7052-4b91-a398-30a9392c356e	TT01824363	6d1222a9-b532-4969-a65e-777f67598bb2	2	2	370000.00	0.00	\N	370000.00	completed	cash	paid	2026-01-23 15:45:23.975692	\N	2026-01-23 13:30:24.353746	2026-01-23 15:45:23.975692
9c2fdbeb-bac2-4611-8537-5fe7ad5543b8	TT03824370	b7fc4b25-3f7e-4147-8147-6c54d3193ea6	2	2	221000.00	0.00	\N	221000.00	completed	cash	paid	2026-01-26 08:18:44.704314	\N	2026-01-23 13:30:24.353746	2026-01-26 08:18:44.704314
e0be60e8-c2ac-4085-a220-90a9125869d2	TG01824374	b41640a3-7780-404a-93db-f2f411380a3c	2	4	134000.00	0.00	\N	134000.00	completed	cash	paid	2026-01-26 08:18:53.243515	\N	2026-01-23 13:30:24.353746	2026-01-26 08:18:53.243515
37530a6a-5592-4dd4-bd89-d48fa504c2ec	ORD-260126-1029	b7fc4b25-3f7e-4147-8147-6c54d3193ea6	\N	1	165000.00	0.00	\N	165000.00	completed	cash	paid	2026-01-26 08:21:55.592083	\N	2026-01-26 08:21:31.956298	2026-01-26 08:21:55.592083
32b23885-38ae-4d39-96a1-20ef4f781305	ORD-260126-1503	c5bc9b6e-27c3-4b7a-878f-8cf58f7b4663	\N	1	195000.00	0.00	\N	195000.00	completed	cash	paid	2026-01-26 08:31:35.453784	\N	2026-01-26 08:31:16.040669	2026-01-26 08:31:35.453784
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tables (id, table_number, area_id, capacity, status, current_order_id, current_guests, occupied_at, reserved_at, reserved_for, reserved_phone, notes, is_active, created_at, updated_at) FROM stdin;
66645cf1-e725-4885-a23f-f9cc0b9751f2	T-04	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	reserved	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
9b7ce243-7881-4fe4-bbc2-bb095d11b1b8	T-05	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
4c6ffaf8-52a5-4047-888c-c0492c5d3421	T-06	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
0472be67-641d-4fb0-a7bc-7a397fa710d2	T-07	ebfcbe5f-4956-472f-985d-24b1275d1d2c	6	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
808b5307-94a5-4f78-b8fe-add0af0ca6fb	T-08	ebfcbe5f-4956-472f-985d-24b1275d1d2c	6	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
d6e10753-ece3-42d6-b746-b0e645f1011a	T-09	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
8cd1745a-5037-47fd-894a-4e9c4e375601	T-10	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
cad5a53c-bbf2-4cc7-85c9-d303254ead85	T-11	ebfcbe5f-4956-472f-985d-24b1275d1d2c	2	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
c116d4bd-07d0-4592-aa19-39046d74b613	T-12	ebfcbe5f-4956-472f-985d-24b1275d1d2c	2	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
e05d58e5-f87e-42b5-809c-fb44c7d7b940	G-02	38f5dfd6-d605-44d8-aa9c-68469e8a0029	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
502d4cbd-cc35-49fb-bda9-2c9a694e73c7	G-03	38f5dfd6-d605-44d8-aa9c-68469e8a0029	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
56383f13-6f06-4584-a645-2411b7b947a0	G-04	38f5dfd6-d605-44d8-aa9c-68469e8a0029	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
dfe19773-0a4e-4fbf-a16c-fb7eb9939c93	G-05	38f5dfd6-d605-44d8-aa9c-68469e8a0029	8	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
14f9c0e4-1576-4c90-8c56-83d763554785	G-06	38f5dfd6-d605-44d8-aa9c-68469e8a0029	8	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
bd69a48b-b59e-4463-87ff-9bc7c44f6cd7	G-07	38f5dfd6-d605-44d8-aa9c-68469e8a0029	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
caf24b63-c4bb-4bc0-9edf-697c89ba3340	G-08	38f5dfd6-d605-44d8-aa9c-68469e8a0029	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
c1d1afe1-cc20-487a-8fce-ff114ec37a91	F-01	01256af6-bf0b-4a80-bb00-a7d45922470d	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
c67fb560-3e40-4040-8d51-42a2e55512de	F-02	01256af6-bf0b-4a80-bb00-a7d45922470d	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
7b6317a9-eee1-4082-99bc-9cf2b55c93ca	F-03	01256af6-bf0b-4a80-bb00-a7d45922470d	6	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
36bcfc9a-0cf4-45a4-9c57-84397b760787	F-04	01256af6-bf0b-4a80-bb00-a7d45922470d	6	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
a8d1fc52-d011-4c2d-a58b-740169ba57d9	F-05	01256af6-bf0b-4a80-bb00-a7d45922470d	8	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
72723db2-6296-4521-9d58-56d23f419819	F-06	01256af6-bf0b-4a80-bb00-a7d45922470d	8	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 13:28:49.177729
6d1222a9-b532-4969-a65e-777f67598bb2	T-01	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-23 15:45:23.975692
b41640a3-7780-404a-93db-f2f411380a3c	G-01	38f5dfd6-d605-44d8-aa9c-68469e8a0029	6	cleaning	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-26 08:18:53.243515
b7fc4b25-3f7e-4147-8147-6c54d3193ea6	T-03	ebfcbe5f-4956-472f-985d-24b1275d1d2c	2	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-26 08:21:55.592083
c5bc9b6e-27c3-4b7a-878f-8cf58f7b4663	T-02	ebfcbe5f-4956-472f-985d-24b1275d1d2c	4	available	\N	0	\N	\N	\N	\N	\N	t	2026-01-23 13:28:49.177729	2026-01-26 08:31:35.453784
\.


--
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_addresses (id, user_id, name, phone, address, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, avatar, phone, address, created_at, is_active, role, points, tier, total_spent, order_count, note) FROM stdin;
2	admin@nhh-coffee.com	$2a$10$e9f0HW9otYnkfSRyX16NMeCUggErzBYFfU4TjD8kF3/fQMME7L3/a	Admin NHH-Coffee	\N	0909999999	NHH-Coffee HQ	2026-01-08 02:08:47.692	t	admin	0	bronze	0.00	0	\N
3	staff@nhh-coffee.com	$2a$10$7OYlyWstYtA0inevcCacQ.2hbJxcwTP.IeEOjV.0bQ68gV6B4W3P2	Nhân viên Bán hàng	\N	0908888888	NHH-Coffee Store	2026-01-08 02:08:47.757	t	sales	0	bronze	0.00	0	\N
4	warehouse@nhh-coffee.com	$2a$10$H//wrnsbbXRMAy9asx3qQOk8PW62Uv3Rq9VWRgihMQ9oaRik5pd9G	Nhân viên Kho	\N	0907777777	NHH-Coffee Warehouse	2026-01-08 02:08:47.822	t	warehouse	0	bronze	0.00	0	\N
1	user@example.com	$2a$10$OULpRSN4cibGbAln/XBLB.z0Mn5q8gNpYPf2/CK4Qo2KiXujrpnk6	Nguyễn Văn A	\N	0901234567	123 Đường ABC, Quận 1, TP.HCM	2026-01-08 02:08:47.623	t	user	16	bronze	165000.00	1	\N
\.


--
-- Data for Name: wishlist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wishlist (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: chatbot_feedback chatbot_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_feedback
    ADD CONSTRAINT chatbot_feedback_pkey PRIMARY KEY (id);


--
-- Name: chatbot_knowledge chatbot_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_knowledge
    ADD CONSTRAINT chatbot_knowledge_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_notes order_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_notes
    ADD CONSTRAINT order_notes_pkey PRIMARY KEY (id);


--
-- Name: order_returns order_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: pending_registrations pending_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_registrations
    ADD CONSTRAINT pending_registrations_pkey PRIMARY KEY (id);


--
-- Name: points_history points_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_history
    ADD CONSTRAINT points_history_pkey PRIMARY KEY (id);


--
-- Name: product_questions product_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_questions
    ADD CONSTRAINT product_questions_pkey PRIMARY KEY (id);


--
-- Name: product_suppliers product_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promotion_usage promotion_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- Name: review_images review_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: shift_swap_requests shift_swap_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: staff_shifts staff_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT staff_shifts_pkey PRIMARY KEY (id);


--
-- Name: staff_shifts staff_shifts_staff_id_shift_id_work_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT staff_shifts_staff_id_shift_id_work_date_key UNIQUE (staff_id, shift_id, work_date);


--
-- Name: stock_transactions stock_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: table_order_items table_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_order_items
    ADD CONSTRAINT table_order_items_pkey PRIMARY KEY (id);


--
-- Name: table_orders table_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: tables tables_table_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);


--
-- Name: cart_items_user_id_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cart_items_user_id_product_id_key ON public.cart_items USING btree (user_id, product_id);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: idx_cart_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_user ON public.cart_items USING btree (user_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);


--
-- Name: idx_chat_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_sender ON public.chat_messages USING btree (sender_id);


--
-- Name: idx_chat_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id);


--
-- Name: idx_chat_sessions_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_guest_id ON public.chat_sessions USING btree (guest_id);


--
-- Name: idx_chat_sessions_staff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_staff ON public.chat_sessions USING btree (staff_id);


--
-- Name: idx_chat_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_status ON public.chat_sessions USING btree (status);


--
-- Name: idx_chat_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_user ON public.chat_sessions USING btree (user_id);


--
-- Name: idx_chatbot_feedback_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chatbot_feedback_session_id ON public.chatbot_feedback USING btree (session_id);


--
-- Name: idx_chatbot_knowledge_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chatbot_knowledge_category ON public.chatbot_knowledge USING btree (category);


--
-- Name: idx_chatbot_knowledge_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chatbot_knowledge_is_active ON public.chatbot_knowledge USING btree (is_active);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_created_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_status ON public.orders USING btree (created_at, status);


--
-- Name: idx_orders_payment_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_payment_method ON public.orders USING btree (payment_method);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_orders_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_status ON public.orders USING btree (user_id, status);


--
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_discount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_discount ON public.products USING btree (discount) WHERE (discount > 0);


--
-- Name: idx_products_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_active ON public.products USING btree (stock) WHERE (stock >= 0);


--
-- Name: idx_products_is_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_products_is_new; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_new ON public.products USING btree (is_new) WHERE (is_new = true);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: idx_promotion_usage_promotion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotion_usage_promotion ON public.promotion_usage USING btree (promotion_id);


--
-- Name: idx_promotions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_active ON public.promotions USING btree (is_active, start_date, end_date);


--
-- Name: idx_promotions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_code ON public.promotions USING btree (code);


--
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_review_images_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_images_review ON public.review_images USING btree (review_id);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- Name: idx_reviews_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product_id ON public.reviews USING btree (product_id);


--
-- Name: idx_reviews_product_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product_rating ON public.reviews USING btree (product_id, rating);


--
-- Name: idx_reviews_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);


--
-- Name: idx_staff_shifts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_shifts_date ON public.staff_shifts USING btree (work_date);


--
-- Name: idx_staff_shifts_shift; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_shifts_shift ON public.staff_shifts USING btree (shift_id);


--
-- Name: idx_staff_shifts_staff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_shifts_staff ON public.staff_shifts USING btree (staff_id);


--
-- Name: idx_stock_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_created ON public.stock_transactions USING btree (created_at);


--
-- Name: idx_stock_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_product ON public.stock_transactions USING btree (product_id);


--
-- Name: idx_stock_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_user ON public.stock_transactions USING btree (user_id);


--
-- Name: idx_swap_requests_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swap_requests_requester ON public.shift_swap_requests USING btree (requester_id);


--
-- Name: idx_swap_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swap_requests_status ON public.shift_swap_requests USING btree (status);


--
-- Name: idx_table_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_order_items_order ON public.table_order_items USING btree (table_order_id);


--
-- Name: idx_table_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_orders_status ON public.table_orders USING btree (status);


--
-- Name: idx_table_orders_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_table_orders_table ON public.table_orders USING btree (table_id);


--
-- Name: idx_tables_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tables_area ON public.tables USING btree (area_id);


--
-- Name: idx_tables_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tables_status ON public.tables USING btree (status);


--
-- Name: idx_users_points; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_points ON public.users USING btree (points);


--
-- Name: idx_users_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tier ON public.users USING btree (tier);


--
-- Name: idx_wishlist_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlist_user ON public.wishlist USING btree (user_id);


--
-- Name: password_resets_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_resets_email_key ON public.password_resets USING btree (email);


--
-- Name: pending_registrations_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pending_registrations_email_key ON public.pending_registrations USING btree (email);


--
-- Name: points_history_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX points_history_created_at_idx ON public.points_history USING btree (created_at DESC);


--
-- Name: points_history_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX points_history_user_id_idx ON public.points_history USING btree (user_id);


--
-- Name: product_questions_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_questions_product_id_idx ON public.product_questions USING btree (product_id);


--
-- Name: product_suppliers_product_id_supplier_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_suppliers_product_id_supplier_id_key ON public.product_suppliers USING btree (product_id, supplier_id);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: promotions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promotions_code_key ON public.promotions USING btree (code);


--
-- Name: push_subscriptions_endpoint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: wishlist_user_id_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX wishlist_user_id_product_id_key ON public.wishlist USING btree (user_id, product_id);


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_sessions chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tables fk_tables_current_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT fk_tables_current_order FOREIGN KEY (current_order_id) REFERENCES public.table_orders(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_suppliers product_suppliers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promotion_usage promotion_usage_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: promotion_usage promotion_usage_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: promotion_usage promotion_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_usage
    ADD CONSTRAINT promotion_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: return_items return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.order_returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: review_images review_images_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: shift_swap_requests shift_swap_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shift_swap_requests shift_swap_requests_requester_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_requester_shift_id_fkey FOREIGN KEY (requester_shift_id) REFERENCES public.staff_shifts(id) ON DELETE CASCADE;


--
-- Name: shift_swap_requests shift_swap_requests_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: shift_swap_requests shift_swap_requests_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: shift_swap_requests shift_swap_requests_target_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swap_requests
    ADD CONSTRAINT shift_swap_requests_target_shift_id_fkey FOREIGN KEY (target_shift_id) REFERENCES public.staff_shifts(id) ON DELETE SET NULL;


--
-- Name: staff_shifts staff_shifts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT staff_shifts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: staff_shifts staff_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT staff_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- Name: staff_shifts staff_shifts_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_shifts
    ADD CONSTRAINT staff_shifts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stock_transactions stock_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_transactions stock_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: table_order_items table_order_items_table_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_order_items
    ADD CONSTRAINT table_order_items_table_order_id_fkey FOREIGN KEY (table_order_id) REFERENCES public.table_orders(id) ON DELETE CASCADE;


--
-- Name: table_orders table_orders_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: table_orders table_orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.table_orders
    ADD CONSTRAINT table_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL;


--
-- Name: tables tables_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE SET NULL;


--
-- Name: wishlist wishlist_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ookKnOhsydgK8I5KEw2M4MQXeqrc8FbJbFc61BpVm89I7y0au7pehVj00MnAJOl

