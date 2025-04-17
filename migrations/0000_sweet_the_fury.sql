CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"related_id" integer,
	"related_type" text
);
--> statement-breakpoint
CREATE TABLE "maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"due_date" timestamp NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"assigned_to" integer,
	"completed_date" timestamp,
	"notes" text,
	"parts_used" json,
	"cost" real,
	"bill" json,
	"bill_image_url" text,
	"is_unscheduled" boolean DEFAULT false,
	"approval_status" text,
	"approved_by" integer
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp NOT NULL,
	"related_id" integer,
	"related_type" text,
	"link" text
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"part_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"status" text NOT NULL,
	"created_date" timestamp NOT NULL,
	"ordered_date" timestamp,
	"received_date" timestamp,
	"created_by" integer NOT NULL,
	"supplier" text,
	"total_amount" real,
	"notes" text,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"is_standard" boolean DEFAULT true,
	"price" real NOT NULL,
	"quantity" integer DEFAULT 0,
	"minimum_stock" integer DEFAULT 10,
	"supplier" text,
	"location" text,
	"image_url" text,
	"maintenance_interval" integer,
	"last_restocked" timestamp,
	"compatible_vehicles" json,
	CONSTRAINT "parts_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"email" text,
	"phone" text,
	"profile_image" text,
	"notification_enabled" boolean DEFAULT true,
	"fcm_token" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicle_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"part_id" integer NOT NULL,
	"is_custom" boolean DEFAULT false,
	"maintenance_interval" integer,
	"last_maintenance_date" timestamp,
	"last_maintenance_mileage" integer,
	"next_maintenance_date" timestamp,
	"next_maintenance_mileage" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"vin" text NOT NULL,
	"license_plate" text,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"mileage" integer NOT NULL,
	"assigned_to" integer,
	"status" text NOT NULL,
	"next_maintenance_date" timestamp,
	"next_maintenance_mileage" integer,
	"qr_code" text,
	CONSTRAINT "vehicles_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_parts" ADD CONSTRAINT "vehicle_parts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_parts" ADD CONSTRAINT "vehicle_parts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;