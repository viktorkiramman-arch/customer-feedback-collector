CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'REVIEWED', 'FLAGGED', 'SPAM', 'ARCHIVED');
CREATE TYPE "WorkflowStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'ACTION_PLANNED', 'RESOLVED', 'NO_ACTION');
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(320) NOT NULL UNIQUE,
  "name" VARCHAR(120),
  "password_hash" TEXT,
  "email_verified_at" TIMESTAMPTZ,
  "is_disabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "organizations" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "time_zone" VARCHAR(80) NOT NULL DEFAULT 'UTC',
  "negative_rating_threshold" SMALLINT NOT NULL DEFAULT 2 CHECK ("negative_rating_threshold" BETWEEN 1 AND 5),
  "retention_days" INTEGER CHECK ("retention_days" IS NULL OR "retention_days" > 0),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "organization_memberships" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "role" "MembershipRole" NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  CONSTRAINT "organization_memberships_organization_id_user_id_key" UNIQUE ("organization_id", "user_id")
);

CREATE TABLE "feedback_forms" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "created_by_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "name" VARCHAR(120) NOT NULL,
  "public_slug" VARCHAR(100) NOT NULL UNIQUE,
  "title" VARCHAR(160) NOT NULL,
  "description" VARCHAR(1000),
  "success_message" VARCHAR(500) NOT NULL DEFAULT 'Thank you. Your feedback has been received.',
  "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
  "category_required" BOOLEAN NOT NULL DEFAULT TRUE,
  "comment_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "comment_required" BOOLEAN NOT NULL DEFAULT FALSE,
  "comment_max_length" INTEGER NOT NULL DEFAULT 2000 CHECK ("comment_max_length" BETWEEN 1 AND 10000),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "archived_at" TIMESTAMPTZ,
  "deleted_at" TIMESTAMPTZ,
  CHECK (NOT "comment_required" OR "comment_enabled")
);

CREATE TABLE "feedback_categories" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "created_by_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "name" VARCHAR(80) NOT NULL,
  "normalized_name" VARCHAR(80) NOT NULL,
  "description" VARCHAR(300),
  "display_order" INTEGER NOT NULL DEFAULT 0 CHECK ("display_order" >= 0),
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "archived_at" TIMESTAMPTZ,
  CONSTRAINT "feedback_categories_organization_id_normalized_name_key" UNIQUE ("organization_id", "normalized_name")
);

CREATE TABLE "form_category_assignments" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "form_id" UUID NOT NULL REFERENCES "feedback_forms"("id") ON DELETE CASCADE,
  "category_id" UUID NOT NULL REFERENCES "feedback_categories"("id") ON DELETE RESTRICT,
  "display_order" INTEGER NOT NULL DEFAULT 0 CHECK ("display_order" >= 0),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_category_assignments_form_id_category_id_key" UNIQUE ("form_id", "category_id")
);

CREATE TABLE "feedback_submissions" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "form_id" UUID NOT NULL REFERENCES "feedback_forms"("id") ON DELETE RESTRICT,
  "category_id" UUID NOT NULL REFERENCES "feedback_categories"("id") ON DELETE RESTRICT,
  "rating" SMALLINT NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment" TEXT CHECK ("comment" IS NULL OR char_length("comment") <= 2000),
  "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
  "workflow_status" "WorkflowStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "moderation_reason" VARCHAR(500),
  "resolution_summary" VARCHAR(1000),
  "assignee_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_by_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" TIMESTAMPTZ,
  "resolved_at" TIMESTAMPTZ,
  "request_id" UUID NOT NULL UNIQUE,
  "idempotency_key_hash" CHAR(64),
  "source_ip_hash" CHAR(64),
  "user_agent_hash" CHAR(64),
  "payload_hash" CHAR(64),
  "duplicate_of_id" UUID REFERENCES "feedback_submissions"("id") ON DELETE SET NULL,
  "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID REFERENCES "organizations"("id") ON DELETE SET NULL,
  "actor_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" UUID,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "request_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "rate_limit_buckets" (
  "key" VARCHAR(191) PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0 CHECK ("count" >= 0),
  "reset_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE INDEX "organization_memberships_user_revoked_idx" ON "organization_memberships"("user_id", "revoked_at");
CREATE INDEX "organization_memberships_org_role_idx" ON "organization_memberships"("organization_id", "role");
CREATE INDEX "feedback_forms_org_status_idx" ON "feedback_forms"("organization_id", "status");
CREATE INDEX "feedback_forms_org_created_idx" ON "feedback_forms"("organization_id", "created_at");
CREATE INDEX "feedback_categories_org_active_order_idx" ON "feedback_categories"("organization_id", "is_active", "display_order");
CREATE INDEX "form_category_assignments_form_order_idx" ON "form_category_assignments"("form_id", "display_order");
CREATE INDEX "form_category_assignments_category_idx" ON "form_category_assignments"("category_id");
CREATE INDEX "feedback_submissions_org_submitted_idx" ON "feedback_submissions"("organization_id", "submitted_at" DESC, "id" DESC);
CREATE INDEX "feedback_submissions_org_rating_idx" ON "feedback_submissions"("organization_id", "rating", "submitted_at" DESC);
CREATE INDEX "feedback_submissions_org_category_idx" ON "feedback_submissions"("organization_id", "category_id", "submitted_at" DESC);
CREATE INDEX "feedback_submissions_org_status_idx" ON "feedback_submissions"("organization_id", "status", "submitted_at" DESC);
CREATE INDEX "feedback_submissions_org_workflow_idx" ON "feedback_submissions"("organization_id", "workflow_status", "submitted_at" DESC);
CREATE INDEX "feedback_submissions_org_form_idx" ON "feedback_submissions"("organization_id", "form_id", "submitted_at" DESC);
CREATE INDEX "feedback_submissions_form_ip_idx" ON "feedback_submissions"("form_id", "source_ip_hash", "submitted_at" DESC);
CREATE INDEX "feedback_submissions_form_payload_idx" ON "feedback_submissions"("form_id", "payload_hash", "submitted_at" DESC);
CREATE UNIQUE INDEX "feedback_submissions_form_idempotency_key" ON "feedback_submissions"("form_id", "idempotency_key_hash");
CREATE INDEX "feedback_submissions_duplicate_idx" ON "feedback_submissions"("duplicate_of_id");
CREATE INDEX "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets"("reset_at");
CREATE INDEX "audit_logs_org_created_idx" ON "audit_logs"("organization_id", "created_at" DESC);
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs"("actor_user_id", "created_at" DESC);
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);
