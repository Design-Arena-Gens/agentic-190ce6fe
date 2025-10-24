# WhatsApp Group Agent

Full-stack Next.js application that hosts an autonomous WhatsApp persona capable of joining community groups, mirroring a human participant, and replying to members in real time.

## Features

- Web dashboard to monitor groups, review transcripts, and manually drive replies.
- Persona designer to tune the agent's tone, goals, and greeting message.
- WhatsApp Cloud API webhook handler for inbound group chats.
- Server utilities for joining a group via invite code and dispatching agent responses.
- Lightweight memory layer that keeps recent context for better replies.

## Prerequisites

- Node.js 18+
- WhatsApp Business Cloud API access with:
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN`
- A deployed webhook URL (Vercel ready)

## Local Development

```bash
npm install
npm run dev
```

Create a `.env.local` file with:

```bash
WHATSAPP_ACCESS_TOKEN=your_long_lived_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
AGENT_NAME=Nova
```

Expose `http://localhost:3000/api/webhook` to Meta using a tunnel (e.g. ngrok) during testing.

## Deployment

1. Build and test locally: `npm run build && npm run start`
2. Deploy to Vercel: `vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-190ce6fe`
3. Configure the WhatsApp webhook to use `https://agentic-190ce6fe.vercel.app/api/webhook`

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhook` | GET | Meta verification handshake |
| `/api/webhook` | POST | Receives inbound WhatsApp messages |
| `/api/groups` | GET/POST | List and join WhatsApp groups |
| `/api/messages` | POST | Send an outbound group message |
| `/api/persona` | PUT | Update agent persona |
| `/api/state` | GET | Fetch in-memory state snapshot |

## Safety Notice

WhatsApp automation is subject to Meta platform policies. Ensure you have the appropriate permissions and follow all rate limits to avoid account restrictions.
