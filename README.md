# OmniComm Pro

Enterprise-grade SaaS SMS & Telephony Automation Platform.
Replaces manual communication workflows with a scalable,
event-driven, queue-based architecture.

---

## What it does

- Sends SMS via API providers (Twilio, Nexmo, Infobip) with
  automatic failover to a GSM modem (Gammu) when all APIs fail
- Routes IP-based calls through Asterisk PBX with IVR menus,
  ACD queues, agent routing, and call recording
- Processes all messages through a BullMQ queue with exponential
  backoff retries and a dead-letter queue for permanent failures
- Enforces per-tenant SMS/call quotas under a SaaS subscription
  model (Stripe, bKash, SSLCommerz)
- Emits structured events for every action, feeding CRM sync,
  workflow automation, and monitoring

---

## Tech stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Backend      | NestJS (TypeScript)                     |
| Queue        | BullMQ + Redis                          |
| Database     | PostgreSQL + TypeORM                    |
| SMS primary  | Twilio / Nexmo / Infobip (priority-routed) |
| SMS fallback | Gammu (GSM modem)                       |
| Telephony    | Asterisk + FreePBX + SIP                |
| Messaging    | WhatsApp Business API (Meta)            |
| Payments     | Stripe + bKash + SSLCommerz             |
| CRM          | HubSpot + Salesforce                    |
| AI           | OpenAI (SMS auto-reply, Voice AI IVR)   |
| Monitoring   | Prometheus + Grafana + Alertmanager     |
| Logging      | Winston (structured JSON)               |
| DevOps       | Docker + Nginx + GitHub Actions CI/CD   |

---

## Quick start
```bash


1. Clone
git clone https://github.com/yourorg/omnicomm-pro.git
cd omnicomm-pro2. Configure environment
cp .env.example .env
Fill in: DB creds, Redis, JWT secret, Twilio keys,
Stripe keys, bKash keys, OpenAI key3. Start all services
docker-compose up -d4. Seed database (plans, super-admin, SMS providers)
cd backend && npm run seed