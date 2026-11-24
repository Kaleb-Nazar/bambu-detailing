CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."service_item_kind" AS ENUM('package', 'extra');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('waiting', 'washing', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "extra_prices" (
	"extra_id" integer NOT NULL,
	"vehicle_type_id" integer NOT NULL,
	"price_cents" integer NOT NULL,
	CONSTRAINT "extra_prices_extra_id_vehicle_type_id_pk" PRIMARY KEY("extra_id","vehicle_type_id")
);
--> statement-breakpoint
CREATE TABLE "extra_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "extra_services_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "package_prices" (
	"package_id" integer NOT NULL,
	"vehicle_type_id" integer NOT NULL,
	"price_cents" integer NOT NULL,
	CONSTRAINT "package_prices_package_id_vehicle_type_id_pk" PRIMARY KEY("package_id","vehicle_type_id")
);
--> statement-breakpoint
CREATE TABLE "service_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"kind" "service_item_kind" NOT NULL,
	"ref_id" integer NOT NULL,
	"name_snapshot" text NOT NULL,
	"price_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer,
	"vehicle_type_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"status" "service_status" DEFAULT 'waiting' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash' NOT NULL,
	"total_cents" integer NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "supplies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"default_unit" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "supplies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "supply_purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"supply_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"total_cents" integer NOT NULL,
	CONSTRAINT "supply_purchase_items_purchase_id_supply_id_unique" UNIQUE("purchase_id","supply_id")
);
--> statement-breakpoint
CREATE TABLE "supply_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"purchased_on" date DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "vehicle_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate" text NOT NULL,
	"vehicle_type_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
CREATE TABLE "wash_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"includes" text[] DEFAULT '{}' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "wash_packages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "extra_prices" ADD CONSTRAINT "extra_prices_extra_id_extra_services_id_fk" FOREIGN KEY ("extra_id") REFERENCES "public"."extra_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_prices" ADD CONSTRAINT "extra_prices_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_prices" ADD CONSTRAINT "package_prices_package_id_wash_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."wash_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_prices" ADD CONSTRAINT "package_prices_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_package_id_wash_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."wash_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_purchase_items" ADD CONSTRAINT "supply_purchase_items_purchase_id_supply_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."supply_purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_purchase_items" ADD CONSTRAINT "supply_purchase_items_supply_id_supplies_id_fk" FOREIGN KEY ("supply_id") REFERENCES "public"."supplies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_purchases" ADD CONSTRAINT "supply_purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "services_performed_at_idx" ON "services" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "supply_purchases_purchased_on_idx" ON "supply_purchases" USING btree ("purchased_on");