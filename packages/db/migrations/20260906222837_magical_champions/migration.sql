CREATE TABLE `assignment_schedules` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`assignment_id` int NOT NULL,
	`schedule_id` int NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`teacher_id` int,
	`subject_id` int,
	`space_id` int,
	`class_group_id` int,
	`duration` int NOT NULL DEFAULT 2,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `class_groups` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`semester` varchar(255) NOT NULL,
	`module` varchar(255) NOT NULL,
	`student_count` int NOT NULL,
	`shift_id` int,
	`course_id` int,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `course_types` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`course_type_id` int,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `schedule_teachers` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`schedule_id` int,
	`teacher_id` int,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`weekday` varchar(255) NOT NULL,
	`start_time` varchar(255) NOT NULL,
	`end_time` varchar(255) NOT NULL,
	`shift_id` int NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `space_types` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `spaces` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`floor` int NOT NULL,
	`capacity` int NOT NULL,
	`blocked` boolean DEFAULT false,
	`space_type_id` int,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`required_space_type_id` int,
	`course_id` int,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`correlation_id` varchar(255) NOT NULL,
	`status` enum('PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PROCESSING',
	`type` enum('TIMETABLE_OPTIMIZATION') NOT NULL,
	`error_message` text,
	`progress` int DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `correlation_id_unique` UNIQUE INDEX(`correlation_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`full_name` varchar(255) NOT NULL,
	`registration` varchar(255),
	`email` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registration_unique` UNIQUE INDEX(`registration`),
	CONSTRAINT `email_unique` UNIQUE INDEX(`email`)
);
--> statement-breakpoint
ALTER TABLE `assignment_schedules` ADD CONSTRAINT `assignment_schedules_assignment_id_assignments_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`);--> statement-breakpoint
ALTER TABLE `assignment_schedules` ADD CONSTRAINT `assignment_schedules_schedule_id_schedules_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`);--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_teacher_id_users_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_subject_id_subjects_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`);--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_space_id_spaces_id_fkey` FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`);--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_class_group_id_class_groups_id_fkey` FOREIGN KEY (`class_group_id`) REFERENCES `class_groups`(`id`);--> statement-breakpoint
ALTER TABLE `class_groups` ADD CONSTRAINT `class_groups_shift_id_shifts_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`);--> statement-breakpoint
ALTER TABLE `class_groups` ADD CONSTRAINT `class_groups_course_id_courses_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`);--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_course_type_id_course_types_id_fkey` FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`);--> statement-breakpoint
ALTER TABLE `schedule_teachers` ADD CONSTRAINT `schedule_teachers_schedule_id_schedules_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`);--> statement-breakpoint
ALTER TABLE `schedule_teachers` ADD CONSTRAINT `schedule_teachers_teacher_id_users_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_shift_id_shifts_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`);--> statement-breakpoint
ALTER TABLE `spaces` ADD CONSTRAINT `spaces_space_type_id_space_types_id_fkey` FOREIGN KEY (`space_type_id`) REFERENCES `space_types`(`id`);--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_required_space_type_id_space_types_id_fkey` FOREIGN KEY (`required_space_type_id`) REFERENCES `space_types`(`id`);--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_course_id_courses_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`);