CREATE TABLE `schedule_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentEmail` varchar(320) NOT NULL,
	`sessionDate` varchar(10) NOT NULL,
	`subject` varchar(120) NOT NULL,
	`exercise` text NOT NULL,
	`sessionTime` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentEmail` varchar(320) NOT NULL,
	`attendanceDate` varchar(10) NOT NULL,
	`status` enum('present','late','absent') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_attendance_id` PRIMARY KEY(`id`)
);
