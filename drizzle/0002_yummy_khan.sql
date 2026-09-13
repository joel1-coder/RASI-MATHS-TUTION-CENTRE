CREATE TABLE `colleges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(100) NOT NULL,
	`cutoff` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colleges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `government_exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupName` varchar(120) NOT NULL,
	`name` varchar(160) NOT NULL,
	`qualification` text NOT NULL,
	`maxMarks` varchar(120) NOT NULL,
	`benchmark` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `government_exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mark_statements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentEmail` varchar(320) NOT NULL,
	`assessmentType` enum('weekly','monthly') NOT NULL,
	`periodLabel` varchar(80) NOT NULL,
	`subject` varchar(120) NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mark_statements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentEmail` varchar(320) NOT NULL,
	`title` varchar(160) NOT NULL,
	`subject` varchar(120) NOT NULL,
	`dueDate` varchar(40) NOT NULL,
	`status` varchar(40) NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_projects_id` PRIMARY KEY(`id`)
);
