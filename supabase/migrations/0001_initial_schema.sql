-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  colour      TEXT NOT NULL,
  description TEXT
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  module             TEXT,
  start_date         DATE,
  due_date           DATE NOT NULL,
  due_time           TIME,
  progress           INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes              TEXT,
  assignment_details JSONB,
  is_recurring       BOOLEAN NOT NULL DEFAULT FALSE,
  is_template        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule    TEXT,
  parent_task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_due_date_idx       ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_category_id_idx    ON tasks(category_id);
CREATE INDEX IF NOT EXISTS tasks_is_template_idx    ON tasks(is_template);
CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON tasks(parent_task_id);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size    INTEGER NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attachments_task_id_idx ON attachments(task_id);
