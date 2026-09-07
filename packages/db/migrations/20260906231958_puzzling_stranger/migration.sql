CREATE TABLE `idempotency_keys` (
	`key` varchar(128) PRIMARY KEY,
	`scope` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (now())
);
