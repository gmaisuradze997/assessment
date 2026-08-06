# Campaignly — SvelteKit

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Tests

```bash
npm test              # unit (Vitest)
npm run test:e2e      # Playwright (builds first)
npm run check         # typecheck
npm run lint          # prettier + eslint
```

## Demo credentials

Password for all accounts: `demo1234`

| Email              | Role               |
| ------------------ | ------------------ |
| `admin@demo.test`  | admin              |
| `editor@demo.test` | editor             |
| `viewer@demo.test` | viewer (read-only) |

Log in at `/en/login`, then open `/en/dashboard`.
