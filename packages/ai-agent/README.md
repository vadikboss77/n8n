# @n8n/ai-agent

Business AI agent service with daily scheduler and HTTP API.

## Quick start

1. Create `.env` (see `.env.example`).
2. Install deps and build:

```bash
pnpm install
pnpm -w build
```

3. Run the service:

```bash
pnpm --filter @n8n/ai-agent start
```

4. Test endpoints:

- Health: `GET http://localhost:3030/health`
- Inspect config: `GET http://localhost:3030/config`
- Trigger daily run: `POST http://localhost:3030/run` with optional JSON `{ "date": "2025-01-01" }`

## Environment

See `.env.example`. Minimum required: `OPENAI_API_KEY`.

## Roadmap

- Slack/Email delivery of daily plan
- RAG over business docs
- Calendar and CRM integrations