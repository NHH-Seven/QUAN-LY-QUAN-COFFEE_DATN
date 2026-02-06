--
-- PostgreSQL database dump
--

\restrict ce9gToc9k2YXdhf7sb0Gb8xUqn4DAAhvMNKHZDa5Yq4VbAi2UGSlM1VHYkqOpZS

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

\unrestrict ce9gToc9k2YXdhf7sb0Gb8xUqn4DAAhvMNKHZDa5Yq4VbAi2UGSlM1VHYkqOpZS

