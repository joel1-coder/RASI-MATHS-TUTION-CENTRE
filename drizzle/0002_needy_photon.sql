CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`code` varchar(30) NOT NULL,
	`summary` text NOT NULL,
	`paperLabel` varchar(80) NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 60,
	`questionCount` int NOT NULL DEFAULT 20,
	`accentColor` varchar(20) NOT NULL DEFAULT '#5968a9',
	`isFeatured` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_code_unique` UNIQUE(`code`)
);
