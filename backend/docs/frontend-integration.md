# Consumir la API desde un frontend

Esta guía deja el camino feliz para integrar un frontend con el backend de Desahogate: CORS, autenticación con Supabase, requests CRUD y streaming del chat IA.

## Camino rápido

1. Configurá CORS en `backend/.env` con el origen de tu frontend.
2. Autenticá al usuario en Supabase desde el frontend.
3. Mandá `Authorization: Bearer <supabase_access_token>` en cada request protegida.
4. Usá `GET /api/v1/users/me` para obtener/crear el usuario interno.
5. Creá un chat con `POST /api/v1/chats`.
6. Enviá mensajes al LLM con `POST /api/v1/chats/{chatId}/messages/stream` usando `fetch` streaming.

## Variables backend necesarias

```env
# Permití el origen real del frontend. Separá múltiples URLs con coma.
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true

# Supabase Auth
SUPABASE_PROJECT_URL=https://your-project-ref.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated

# Si tu proyecto Supabase usa HS256 legacy, configurá también:
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# IA streaming
GROQ_API_KEY=your_groq_api_key
```

> No pongas secretos en el frontend. `GROQ_API_KEY`, Mongo y Upstash viven SOLO en `backend/.env`.

## Base URL frontend

En el frontend usá una variable pública para la URL del backend:

```env
# Vite
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

```env
# Next.js
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Cliente HTTP mínimo

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "API request failed");
  }

  return response.json() as Promise<T>;
}
```

## Flujo recomendado

### 1. Obtener usuario interno

Después de login en Supabase:

```ts
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

if (!token) throw new Error("User is not authenticated");

const me = await apiFetch<User>("/users/me", token);
```

`/users/me` mapea el usuario Supabase a un usuario interno Mongo. El frontend NO debe inventar ni mandar `userId` para operaciones protegidas.

### 2. Crear chat

```ts
const chat = await apiFetch<Chat>("/chats", token, {
  method: "POST",
  body: JSON.stringify({}),
});
```

### 3. Listar chats del usuario

```ts
const chats = await apiFetch<Chat[]>("/chats", token);
```

### 4. Listar mensajes del chat

```ts
const messages = await apiFetch<Message[]>(
  `/messages?chat_id=${chat.chatId}&limit=50&sort=asc`,
  token,
);
```

### 5. Contexto persistente del usuario

No tenés que mandar contexto manualmente al chat.

El backend arma el contexto personalizado del prompt usando:

- `personality` del usuario
- tareas pendientes del usuario
- un snapshot interno en Redis para acelerar lecturas

Esto pasa por dentro cuando usás los endpoints existentes:

| Acción frontend | Qué hace el backend |
|-----------------|---------------------|
| `GET /users/me` | Obtiene/crea el usuario interno y precalienta su contexto en Redis. |
| `GET /tasks` | Lista las tareas como siempre. |
| `POST /tasks`, `PUT /tasks/{taskId}`, `DELETE /tasks/{taskId}` | Actualiza tareas y refresca el contexto interno del usuario. |
| `POST /chats/{chatId}/messages/stream` | Usa el contexto interno automáticamente en el prompt. |

> El frontend sigue enviando solo `{ content }` al endpoint de streaming. No envíes `personality`, `tasks` ni `userId` manualmente.

## Streaming del chat IA

No uses `EventSource` para este endpoint: `EventSource` solo soporta `GET` y acá necesitamos `POST` con body y token. Usá `fetch` + `ReadableStream`.

```ts
type StreamEvent =
  | { type: "token"; content: string }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string };

export async function streamChatMessage(params: {
  token: string;
  chatId: string;
  content: string;
  onToken: (token: string) => void;
  onDone?: (messageId: string) => void;
}) {
  const response = await fetch(
    `${API_BASE_URL}/chats/${params.chatId}/messages/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({ content: params.content }),
    },
  );

  if (!response.ok || !response.body) {
    throw new Error("Streaming request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const line = rawEvent
        .split("\n")
        .find((entry) => entry.startsWith("data: "));
      if (!line) continue;

      const event = JSON.parse(line.slice(6)) as StreamEvent;

      if (event.type === "token") params.onToken(event.content);
      if (event.type === "done") params.onDone?.(event.messageId);
      if (event.type === "error") throw new Error(event.message);
    }
  }
}
```

Uso típico en UI:

```ts
let assistantDraft = "";

await streamChatMessage({
  token,
  chatId: chat.chatId,
  content: "Hoy me siento ansioso",
  onToken(token) {
    assistantDraft += token;
    // setMessages((prev) => updateAssistantDraft(prev, assistantDraft));
  },
  onDone(messageId) {
    console.log("Assistant message saved:", messageId);
  },
});
```

## Contratos principales

### User

```ts
type User = {
  userId: string;
  authProvider?: string | null;
  authProviderUserId?: string | null;
  email?: string | null;
  username: string;
  personality: Record<string, unknown>;
  chats: string[];
};
```

`personality` puede venir vacío o enriquecido automáticamente por el backend. Mantenelo como `Record<string, unknown>` si no necesitás renderizar campos específicos.

Campos comunes que podrían aparecer:

```ts
type UserPersonality = {
  tone?: string;
  language?: string;
  profile_summary?: string;
  goals?: string[];
  stressors?: string[];
  coping_notes?: string[];
};
```

> Estos campos son informativos para UI. El chat no depende de que el frontend los mande.

### Chat

```ts
type Chat = {
  chatId: string;
  userId: string;
  createdAt: string;
};
```

### Message

```ts
type Message = {
  messageId: string;
  chatId: string;
  role: "user" | "assistant" | "system" | string;
  content: string;
  createdAt: string;
};
```

### Task

```ts
type Task = {
  taskId: string;
  userId: string;
  title: string;
  description?: string | null;
  status: "pending" | "in_progress" | "done" | string;
  createdAt: string;
  updatedAt: string;
};
```

Las tareas siguen siendo la fuente visual para la UI. El backend solo toma un snapshot de las pendientes para personalizar el prompt.

## Errores comunes

| Status / síntoma | Causa probable | Qué revisar |
|------------------|----------------|-------------|
| CORS error en browser | Origen frontend no permitido | `CORS_ALLOWED_ORIGINS` en `backend/.env` |
| `401 Missing bearer token` | Falta `Authorization` | Enviar `Bearer <access_token>` |
| `401 Invalid or expired token` | Token vencido o Supabase mal configurado | refrescar sesión; revisar `SUPABASE_PROJECT_URL` / secret |
| `403 Forbidden` | Intentás leer recurso de otro usuario | usar IDs obtenidos desde `/users/me` y `/chats` |
| Stream devuelve `error` | Groq no configurado o falló provider | revisar `GROQ_API_KEY` y logs backend |
| Stream devuelve `El servicio de IA está con mucha demanda` | El backend limitó llamadas al LLM para proteger la API key | reintentar después de unos segundos |

## Checklist frontend

- [ ] Backend corre en `http://localhost:8000`.
- [ ] Frontend URL está en `CORS_ALLOWED_ORIGINS`.
- [ ] Supabase login devuelve `access_token`.
- [ ] Cada request protegida manda `Authorization: Bearer ...`.
- [ ] Después del login se llama `GET /users/me`.
- [ ] La UI usa `fetch` streaming para `/messages/stream`, no `EventSource`.
- [ ] El chat envía solo `{ content }`; no manda `personality`, `tasks` ni `userId`.
- [ ] El frontend nunca recibe ni usa `_id` de Mongo.
