create table if not exists "todos" (
  "id" serial primary key not null,
  "text" text not null,
  "completed" boolean not null,
  "createdAt" date not null,
  "updatedAt" date
);