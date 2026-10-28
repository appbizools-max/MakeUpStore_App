# SALBEAU MAKEUPSTORE — PRODUCTION MONITORING, BACKUP AND RECOVERY PLAN

**Document Reference:** `docs/quality-and-release/PRODUCTION_MONITORING_BACKUP_AND_RECOVERY_PLAN.md`  
**Date:** 2026-10-25  
**Engineering Lead:** Principal Site Reliability Engineer (SRE) & DevOps Architect  
**Scope:** Supabase Postgres, CDN Edge, Frontend & Mobile Telemetry, DR Procedures

---

## 1. Executive Summary

This document establishes the operational observability, automated backup retention, disaster recovery (DR), and incident response playbooks for the Salbeau MakeUpStore platform in production.

---

## 2. Telemetry, Observability & Alerting Architecture

```
+---------------------------------------------------------------------------------------+
|                                PRODUCTION OBSERVABILITY MATRIX                        |
+---------------------------------------------------------------------------------------+
            |                                           |
            v                                           v
[CLIENT TELEMETRY: SENTRY]                   [EDGE METRICS: CLOUDFLARE]
- Unhandled JS exceptions                    - Edge cache hit ratio (Target: >80%)
- Mobile crash reporting (ANR, Native)       - HTTP 4xx / 5xx error spikes
- Core Web Vitals (LCP, INP, CLS)            - DDoS / Rate limiting triggers
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    [ORIGIN & DATABASE OBSERVABILITY]
                    - Supabase Database Health Dashboard
                    - PgBouncer connection pool saturation
                    - Slow Query Logger (threshold: queries > 250ms)
                    - CPU, RAM, and Disk IOPS utilization
```

### 2.1 Critical Alerting Thresholds

| Severity | Condition / Trigger | Notification Channel | Response SLA | Action Required |
| :---: | :--- | :--- | :---: | :--- |
| **P1 — CRITICAL** | API Error Rate > 1.0% for 3 mins OR Database Unreachable | PagerDuty / On-call Phone Alert | **< 15 minutes** | Trigger immediate failover or scale DB pool |
| **P1 — CRITICAL** | Checkout failure rate > 0.5% | PagerDuty / Slack #war-room | **< 15 minutes** | Inspect payment gateway & inventory locks |
| **P2 — HIGH** | API p95 Latency > 800ms for 5 mins | Slack #sre-alerts | **< 30 minutes** | Inspect slow query log & PgBouncer saturation |
| **P2 — HIGH** | Bulk Import Queue Backlog > 50,000 rows | Slack #sre-alerts | **< 1 hour** | Spin up additional worker instances |
| **P3 — MEDIUM** | CDN Cache Hit Rate drops below 70% | Slack #performance | **< 4 hours** | Audit cache-control headers on static assets |

---

## 3. Database Backup & Disaster Recovery (DR) Strategy

### 3.1 Point-in-Time Recovery (PITR) & Continuous WAL Archiving
- **Mechanism:** PostgreSQL Write-Ahead Logging (WAL) continuously streamed to high-durability object storage (AWS S3 / Supabase Storage with 99.999999999% durability).
- **RPO (Recovery Point Objective):** **< 5 minutes** (Maximum data loss window).
- **RTO (Recovery Time Objective):** **< 30 minutes** (Maximum service restoration duration).
- **Retention Period:** 30 days of continuous PITR history; daily compressed snapshots retained for 90 days.

### 3.2 Automated Backup Restoration Drill Procedure
To verify that backups are recoverable without corrupting active production:
1. Spin up an isolated staging database replica from the latest snapshot.
2. Replay WAL logs to a designated timestamp 1 hour prior.
3. Execute automated schema validation:
   ```sql
   SELECT count(*) FROM public.products;
   SELECT count(*) FROM public.orders;
   SELECT count(*) FROM public.b2b_verifications;
   ```
4. Verify parent-variant relationships and pricing columns match production checksums.
5. Destroy staging sandbox upon drill completion.

---

## 4. Database Migration Rollback Strategy

Every migration script applied to the database must possess an associated idempotent down-migration script:

```
[Migration File]                             [Rollback File]
supabase_b2b_verification_migration.sql  -->  rollback_b2b_verification_migration.sql
supabase_inventory_removal_migration.sql -->  rollback_inventory_removal_migration.sql
```

### Rollback Guidelines:
1. **Never Drop Columns In-Place:** Deprecate columns first by making them nullable, rather than issuing immediate `DROP COLUMN` commands that break running application instances.
2. **Blue-Green API Deployments:** The new database schema must be backward-compatible with the previous version of the frontend application for at least one release cycle.

---

## 5. Deployment Rollback & Zero-Downtime Releases

- **Admin Web Console:** Hosted on Cloudflare Pages or Vercel. Rollback is instant via atomic Git hash reverts in the deployment console (< 10 seconds).
- **Customer Mobile App:** JavaScript bundle hot-updates dispatched via Expo Updates (`eas update`) allow critical bug fixes without waiting for App Store review cycles.
- **Incident Post-Mortem Policy:** Any P1 incident requires a blameless post-mortem document within 48 hours detailing timeline, root cause, detection gap, and preventive engineering actions.
