# Security policy

Do not report vulnerabilities through public issues. Use GitHub private vulnerability reporting when enabled, or contact the repository owner privately.

Never include real customer feedback, credentials, session tokens, database URLs, raw IP addresses, or exported private data in a report.

## Security design

- Organization-scoped server queries
- Role-based authorization backed by current database membership state
- Server-side Zod validation
- Atomic database-backed public submission rate limiting
- Trusted-proxy opt-in for forwarding headers
- Database-enforced idempotency and duplicate detection
- Plain-text comment rendering
- Parameterized Prisma queries
- Secure Auth.js cookies in HTTPS production environments
- CSV formula-injection prevention
- Audit records for sensitive administrator actions
- Production guards around demo seeding and credential hints
- Loopback-only local PostgreSQL publishing
- Docker build-context secret exclusions

## Production requirements

- Use unique values for `NEXTAUTH_SECRET` and `IP_HASH_SECRET`.
- Keep `DEMO_MODE=false` and never use the example administrator password.
- Do not run `npm run db:seed` in production unless the explicit
  `ALLOW_DEMO_SEED=true` recovery/demo exception is intended.
- Leave `TRUST_PROXY_HEADERS=false` unless a trusted edge proxy removes
  client-supplied forwarding headers and writes the canonical client address.
- Use TLS at the edge and a least-privilege managed PostgreSQL account.
- Restrict database network access to the application and migration runners.
- Redact customer feedback, session data, and request metadata from logs and
  error-monitoring payloads.
