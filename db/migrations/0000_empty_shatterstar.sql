CREATE TABLE IF NOT EXISTS "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean NOT NULL,
	"createdAt" date NOT NULL,
	"updatedAt" date
);
