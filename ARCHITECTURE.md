# Architecture decisions

## ADR-001: Shared-schema multi-tenancy

Use a shared PostgreSQL schema with an `organization_id` tenancy boundary. The MVP exposes one active workspace per account, while the data model supports future workspace switching.

## ADR-002: Server-rendered admin application

Use Server Components for authenticated reads. Use small Client Components only where browser interaction is required, such as the public feedback form and login form.

## ADR-003: Mixed mutation boundary

Use Server Actions for authenticated same-application mutations and Route Handlers for public submissions, authentication callbacks, health checks, and file downloads.

## ADR-004: Immutable original feedback

Normal administrator actions do not edit the original rating or comment. Moderation, priority, workflow, and resolution data are maintained separately.

## ADR-005: Anonymous-by-default collection

The MVP does not request customer name, email, phone number, or order number. Comments are still treated as potentially containing personal data.

## ADR-006: Layered public abuse prevention

Use a honeypot, minimum completion signal, coarse pre-query throttling, an
atomic database-backed form rate limit, a database-enforced idempotency key,
salted request-identity hashes, payload hashes, and short-window duplicate
detection. Forwarding headers are ignored unless the deployment explicitly
trusts a proxy that overwrites them. Avoid invasive browser fingerprinting.

## ADR-007: Fresh authorization state

Auth.js sessions identify the signed-in principal, but authorization-sensitive
requests reload the current user, organization membership, role, and
organization state from PostgreSQL. Disabling a user, revoking membership,
downgrading a role, or deleting an organization therefore takes effect without
waiting for the JWT lifetime to expire.

## ADR-008: Database integrity for public submissions

PostgreSQL owns concurrency-sensitive guarantees. Rate-limit updates use an
atomic upsert and submission idempotency uses a unique constraint on form and
idempotency-key hash. Application checks improve error messages but are not the
final concurrency control.
