CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`description` text NOT NULL,
	`timestamp` integer NOT NULL,
	`related_id` integer,
	`related_type` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`due_date` integer NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`assigned_to` integer,
	`completed_date` integer,
	`notes` text,
	`parts_used` text,
	`cost` real,
	`bill` text,
	`bill_image_url` text,
	`is_unscheduled` integer DEFAULT false,
	`approval_status` text,
	`approved_by` integer,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`related_id` integer,
	`related_type` text,
	`link` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`status` text NOT NULL,
	`created_date` integer NOT NULL,
	`ordered_date` integer,
	`received_date` integer,
	`created_by` integer NOT NULL,
	`supplier` text,
	`total_amount` real,
	`notes` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`is_standard` integer DEFAULT true,
	`price` real NOT NULL,
	`quantity` integer DEFAULT 0,
	`minimum_stock` integer DEFAULT 10,
	`supplier` text,
	`location` text,
	`image_url` text,
	`maintenance_interval` integer,
	`last_restocked` integer,
	`compatible_vehicles` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parts_sku_unique` ON `parts` (`sku`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`email` text,
	`phone` text,
	`profile_image` text,
	`notification_enabled` integer DEFAULT true,
	`fcm_token` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `vehicle_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`is_custom` integer DEFAULT false,
	`maintenance_interval` integer,
	`last_maintenance_date` integer,
	`last_maintenance_mileage` integer,
	`next_maintenance_date` integer,
	`next_maintenance_mileage` integer,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`vin` text NOT NULL,
	`license_plate` text,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`mileage` integer NOT NULL,
	`assigned_to` integer,
	`status` text NOT NULL,
	`next_maintenance_date` integer,
	`next_maintenance_mileage` integer,
	`qr_code` text,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_vin_unique` ON `vehicles` (`vin`);