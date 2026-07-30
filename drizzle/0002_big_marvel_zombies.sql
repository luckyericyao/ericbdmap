CREATE TABLE `structure_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`from_node_id` text NOT NULL,
	`to_node_id` text NOT NULL,
	`relationship` text NOT NULL,
	`line_style` text DEFAULT 'Solid' NOT NULL,
	`arrow_direction` text DEFAULT 'Forward' NOT NULL,
	`evidence` text DEFAULT 'C' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `structure_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_node_id`) REFERENCES `structure_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_node_id`) REFERENCES `structure_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `structure_edges_version_idx` ON `structure_edges` (`version_id`);--> statement-breakpoint
CREATE INDEX `structure_edges_from_idx` ON `structure_edges` (`from_node_id`);--> statement-breakpoint
CREATE INDEX `structure_edges_to_idx` ON `structure_edges` (`to_node_id`);--> statement-breakpoint
CREATE TABLE `structure_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`node_type` text NOT NULL,
	`label` text NOT NULL,
	`role` text,
	`person_name` text,
	`region` text,
	`position_x` integer NOT NULL,
	`position_y` integer NOT NULL,
	`width` integer DEFAULT 220 NOT NULL,
	`height` integer DEFAULT 96 NOT NULL,
	`evidence` text DEFAULT 'C' NOT NULL,
	`verification_status` text DEFAULT 'Unverified' NOT NULL,
	`source_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `structure_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `structure_nodes_version_idx` ON `structure_nodes` (`version_id`);--> statement-breakpoint
CREATE INDEX `structure_nodes_person_idx` ON `structure_nodes` (`person_name`);--> statement-breakpoint
CREATE TABLE `structure_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`version_label` text NOT NULL,
	`source_title` text NOT NULL,
	`source_url` text,
	`article_date` text,
	`original_image_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`original_mime_type` text NOT NULL,
	`status` text DEFAULT 'Original captured' NOT NULL,
	`evidence` text DEFAULT 'C' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`verified_at` integer
);
--> statement-breakpoint
CREATE INDEX `structure_versions_company_idx` ON `structure_versions` (`company_id`);--> statement-breakpoint
CREATE INDEX `structure_versions_created_idx` ON `structure_versions` (`created_at`);
