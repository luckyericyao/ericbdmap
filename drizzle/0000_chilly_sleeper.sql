CREATE TABLE `intelligence_records` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`note` text NOT NULL,
	`evidence` text DEFAULT 'C' NOT NULL,
	`source` text DEFAULT 'Eric note' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `intelligence_records_company_idx` ON `intelligence_records` (`company_id`);--> statement-breakpoint
CREATE INDEX `intelligence_records_created_idx` ON `intelligence_records` (`created_at`);