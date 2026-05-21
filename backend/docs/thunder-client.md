# Thunder Client API Test Guide

> Copy-paste-ready requests for testing every Desahogate backend endpoint, including Groq SSE streaming.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Backend running | `uvicorn app.main:app --reload` → `http://localhost:8000` |
| MongoDB configured | `MONGODB_CLUSTER_URI` set in `.env` |
| Supabase token | `accessToken` from the logged-in frontend session |
| Groq API key | `GROQ_API_KEY` set in `.env` (required for streaming endpoint only) |

---

## Variables

Set these in Thunder Client's **Environment** tab (gear icon → Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `baseUrl` | `http://localhost:8000/api/v1` | Change port if needed |
| `accessToken` | *(copy from Supabase session)* | Sent as `Authorization: Bearer {{accessToken}}` |
| `userId` | *(copy from Step 1 response)* | UUID string |
| `chatId` | *(copy from Step 2 response)* | UUID string |
| `messageId` | *(copy from Step 3 or 5 response)* | UUID string |
| `taskId` | *(copy from Step 7 response)* | UUID string |

> **How to copy IDs:** After each POST request, grab the `userId`, `chatId`, etc. from the JSON response body and paste into the Environment variables. Thunder Client uses `{{variableName}}` syntax.

---

## Happy Path (execute in order)

### Step 0 — Health Check

Verify the API is alive and Mongo is connected.

#### 0a. API Liveness

```
GET {{baseUrl}}/health
```

**Expected `200`:**
```json
{
  "status": "ok",
  "environment": "development"
}
```

#### 0b. Database Connectivity

```
GET {{baseUrl}}/health/db
```

**Expected `200`:**
```json
{
  "status": "ok",
  "database": "desahogate"
}
```

**If `503`:** MongoDB is not configured or unreachable. Check `.env`.

#### 0c. Cache Status (optional)

```
GET {{baseUrl}}/health/cache
```

**Expected responses:**

When Redis is disabled (default):
```json
{
  "status": "disabled",
  "detail": "REDIS_ENABLED=false"
}
```

When Redis is enabled and reachable:
```json
{
  "status": "ok",
  "provider": "upstash",
  "url": "https://your-upstash-endpoint.upstash.io"
}
```

When Redis is enabled but unreachable:
```json
{
  "status": "degraded",
  "detail": "Redis unreachable — cache bypassed"
}
```

> **Note:** Redis is an optional read cache. The API works normally in all three states.

---

### Step 1 — Create User

```
POST {{baseUrl}}/users
Content-Type: application/json

{
  "username": "testuser_thunder",
  "personality": {
    "tone": "friendly",
    "language": "es"
  }
}
```

**Expected `201`:**
```json
{
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "username": "testuser_thunder",
  "personality": {
    "tone": "friendly",
    "language": "es"
  },
  "chats": []
}
```

> **Action:** Copy `userId` from response → set as `{{userId}}` in environment.

---

### Step 2 — Create Chat for User

```
POST {{baseUrl}}/chats
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{}
```

**Expected `201`:**
```json
{
  "chatId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userId": "{{userId}}",
  "createdAt": "2026-05-13T22:30:00Z"
}
```

> **Action:** Copy `chatId` from response → set as `{{chatId}}` in environment.

**Verify user was updated:**
```
GET {{baseUrl}}/users/{{userId}}
```
The `chats` array should now contain the new `chatId`.

---

### Step 3 — Send Manual Message (user role)

```
POST {{baseUrl}}/messages
Content-Type: application/json

{
  "chatId": "{{chatId}}",
  "role": "user",
  "content": "Hola, me siento un poco ansioso hoy"
}
```

**Expected `201`:**
```json
{
  "messageId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "chatId": "{{chatId}}",
  "role": "user",
  "content": "Hola, me siento un poco ansioso hoy",
  "createdAt": "2026-05-13T22:31:00Z"
}
```

> **Action:** Copy `messageId` → set as `{{messageId}}` in environment.

---

### Step 4 — Stream AI Response (SSE)

This is the key endpoint. It returns `text/event-stream`.

```
POST {{baseUrl}}/chats/{{chatId}}/messages/stream
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "content": "¿Qué puedo hacer para sentirme mejor?"
}
```

**Expected response (SSE stream):**
```
data: {"type":"token","content":"Entiendo"}

data: {"type":"token","content":" que"}

data: {"type":"token","content":" te"}

data: {"type":"token","content":" sentís"}

data: {"type":"token","content":" así."}

data: {"type":"token","content":" ..."}

data: {"type":"done","messageId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
```

> **Action:** Copy `messageId` from the `done` event → set as `{{messageId}}` in environment.

#### Thunder Client SSE Configuration

Thunder Client has **limited SSE support**. The stream may show as a single block of text rather than streaming tokens in real time. This is a Thunder Client limitation, not an API bug.

**Tips for Thunder Client:**
1. Send the request normally — the full response body will appear once the stream completes.
2. You'll see the raw `data: {...}` lines in the Response body.
3. If you need real-time token streaming, use the **curl fallback** below.

#### curl Fallback (real-time streaming)

For true real-time SSE visualization, use curl in your terminal:

```powershell
curl -N -X POST "http://localhost:8000/api/v1/chats/{{chatId}}/messages/stream" `
  -H "Content-Type: application/json" `
  -d '{"userId":"{{userId}}","content":"¿Qué puedo hacer para sentirme mejor?"}'
```

> **`-N` flag** disables curl's output buffering so tokens appear immediately.

Or with PowerShell's `Invoke-WebRequest`:

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/chats/{{chatId}}/messages/stream" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"userId":"{{userId}}","content":"¿Qué puedo hacer para sentirme mejor?"}' `
  -TimeoutSec 60

$response.Content
```

---

### Step 5 — List Messages (ascending)

Get the full conversation in chronological order.

```
GET {{baseUrl}}/messages?chat_id={{chatId}}&limit=50&sort=asc
```

**Expected `200`:** Array of messages sorted oldest-first:
```json
[
  {
    "messageId": "...",
    "chatId": "{{chatId}}",
    "role": "user",
    "content": "Hola, me siento un poco ansioso hoy",
    "createdAt": "2026-05-13T22:31:00Z"
  },
  {
    "messageId": "...",
    "chatId": "{{chatId}}",
    "role": "assistant",
    "content": "Entiendo que te sentís así...",
    "createdAt": "2026-05-13T22:31:05Z"
  }
]
```

---

### Step 6 — List Messages (descending)

Get the most recent messages first (useful for chat UIs that load latest first).

```
GET {{baseUrl}}/messages?chat_id={{chatId}}&limit=10&sort=desc
```

---

### Step 7 — Get Latest Message

Get only the last message of the chat (useful for conversation preview cards).

```
GET {{baseUrl}}/messages/latest/{{chatId}}
```

**Expected `200`:**
```json
{
  "messageId": "...",
  "chatId": "{{chatId}}",
  "role": "assistant",
  "content": "Entiendo que te sentís así...",
  "createdAt": "2026-05-13T22:31:05Z"
}
```

---

### Step 8 — Create Task

```
POST {{baseUrl}}/tasks
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Completar onboarding",
  "description": "Configurar perfil y primer chat con la IA",
  "status": "pending"
}
```

**Expected `201`:**
```json
{
  "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userId": "{{userId}}",
  "title": "Completar onboarding",
  "description": "Configurar perfil y primer chat con la IA",
  "status": "pending",
  "createdAt": "2026-05-13T22:32:00Z",
  "updatedAt": "2026-05-13T22:32:00Z"
}
```

> **Action:** Copy `taskId` → set as `{{taskId}}` in environment.

---

### Step 9 — Update Task Status

```
PUT {{baseUrl}}/tasks/{{taskId}}
Content-Type: application/json

{
  "status": "in_progress"
}
```

**Expected `200`:** Same task object with `status` changed to `"in_progress"` and `updatedAt` bumped.

---

### Step 10 — List Tasks (filtered)

```
GET {{baseUrl}}/tasks?task_status=in_progress
```

**Expected `200`:** Array of tasks matching the filter.

---

## Bonus: Individual CRUD Operations

### Get User by ID
```
GET {{baseUrl}}/users/{{userId}}
```

### List All Users
```
GET {{baseUrl}}/users
```

### Update User
```
PUT {{baseUrl}}/users/{{userId}}
Content-Type: application/json

{
  "personality": {
    "tone": "calm",
    "language": "es",
    "emoji": true
  }
}
```

### Get Chat by ID
```
GET {{baseUrl}}/chats/{{chatId}}
```

### List My Chats
```
GET {{baseUrl}}/chats
```

### Get Message by ID
```
GET {{baseUrl}}/messages/{{messageId}}
```

### Update Message Content
```
PUT {{baseUrl}}/messages/{{messageId}}
Content-Type: application/json

{
  "content": "Mensaje editado"
}
```

### Get Task by ID
```
GET {{baseUrl}}/tasks/{{taskId}}
```

### Update Task (title + status)
```
PUT {{baseUrl}}/tasks/{{taskId}}
Content-Type: application/json

{
  "title": "Completar onboarding - revisado",
  "status": "done"
}
```

### Delete Operations

> **Warning:** Delete operations cascade. Deleting a chat removes it from the user's `chats` array.

```
DELETE {{baseUrl}}/tasks/{{taskId}}
DELETE {{baseUrl}}/messages/{{messageId}}
DELETE {{baseUrl}}/chats/{{chatId}}
DELETE {{baseUrl}}/users/{{userId}}
```

All return `204 No Content` on success.

---

## Streaming SSE — Technical Notes

### Event Types

| Type | Fields | When |
|------|--------|------|
| `token` | `content` (string) | Each chunk of the AI response |
| `done` | `messageId` (string) | Stream finished, assistant message saved to DB |
| `error` | `message` (string) | Something failed (safe message, no secrets) |

### How It Works Internally

1. User message is **saved to DB immediately** before streaming starts.
2. Tokens arrive as `data: {"type":"token","content":"..."}` lines.
3. All tokens are accumulated in memory during the stream.
4. When the stream completes, the **full assistant message is saved to DB**.
5. If the stream fails with zero content generated, no empty message is persisted.

### Error Codes via SSE

Since the endpoint returns a stream, errors come as SSE events (not HTTP status codes):

- `404` → `chatId` does not exist
- `403` → `userId` is not the owner of the chat
- `500` → LLM provider error

Standard HTTP validation errors (invalid body) return `422` as JSON before streaming starts.

---

## Thunder Client Limitations for SSE

| Limitation | Workaround |
|------------|------------|
| No real-time token display | Tokens arrive as a single block after stream completes |
| No event-by-event parsing | Raw `data:` lines visible in Response body |
| No automatic reconnection | Not needed — each request is a fresh stream |

> **Recommendation:** Use Thunder Client for verifying the response structure and status codes. Use curl or a browser-based SSE client for visualizing real-time streaming behavior.

---

## Environment Variables Reference

These must be set in `backend/.env` for the full test suite to work:

| Variable | Required For | Example |
|----------|-------------|---------|
| `MONGODB_CLUSTER_URI` | All endpoints | `mongodb+srv://...` |
| `MONGODB_DATABASE` | All endpoints | `desahogate` |
| `REDIS_ENABLED` | Cache (optional) | `false` |
| `UPSTASH_REDIS_REST_URL` | Cache (optional) | `https://your-upstash-endpoint.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Cache (optional) | `your_upstash_token` |
| `GROQ_API_KEY` | Streaming only | `gsk_...` |
| `GROQ_MODEL` | Streaming only | `llama-3.3-70b-versatile` |
| `LLM_TEMPERATURE` | Streaming only | `0.7` |
| `LLM_MAX_TOKENS` | Streaming only | `1024` |
| `LLM_HISTORY_LIMIT` | Streaming only | `20` |

> **Note:** All CRUD endpoints work without `GROQ_API_KEY`. Only the `/messages/stream` endpoint requires it.
