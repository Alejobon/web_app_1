# Desahogate Backend

API REST con FastAPI y MongoDB Atlas para la app de chat con IA.

## Ejecutar local

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

La API arranca en `http://localhost:8000`. La documentación interactiva Swagger queda en `/docs`.

> **Importante:** Después de hacer `git pull`, ejecutá `pip install -r requirements.txt` para instalar nuevas dependencias. Si falta algún paquete opcional (como `groq`), la API arranca igual pero el endpoint de streaming devuelve un error SSE claro en vez de crashear.

## Consumir desde frontend

Guía práctica con CORS, Supabase Auth, cliente TypeScript y streaming del chat IA:

```txt
docs/frontend-integration.md
```

## Configuración

Copiá `backend/.env.example` a `backend/.env` y reemplazá las variables:

| Variable              | Descripción                           | Default          |
| --------------------- | ------------------------------------- | ---------------- |
| `APP_NAME`            | Nombre de la API                      | `Desahogate API` |
| `APP_ENV`             | Entorno (`development`, `production`) | `development`    |
| `MONGODB_CLUSTER_URI` | URI de conexión a MongoDB Atlas       | _(obligatorio)_  |
| `MONGODB_DATABASE`    | Nombre de la base de datos            | `desahogate`     |
| `MONGODB_TIMEOUT_MS`  | Timeout de conexión en ms             | `5000`           |

### Variables Frontend / CORS

| Variable                 | Descripción                                      | Default             |
| ------------------------ | ------------------------------------------------ | ------------------- |
| `CORS_ALLOWED_ORIGINS`   | Orígenes frontend permitidos, separados por coma | Localhost Vite/Next |
| `CORS_ALLOW_CREDENTIALS` | Permitir credenciales CORS cuando no se usa `*`  | `true`              |

Ejemplo:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://tu-front.vercel.app
```

### Variables Supabase Auth

El frontend autentica con Supabase y manda el access token en cada request protegida:

```http
Authorization: Bearer <supabase_access_token>
```

El backend valida ese JWT, extrae el `sub` de Supabase y lo mapea a un usuario interno de MongoDB. El frontend **no debe enviar `userId` manualmente** para operaciones autenticadas.

| Variable                | Descripción                                                        | Default         |
| ----------------------- | ------------------------------------------------------------------ | --------------- |
| `SUPABASE_PROJECT_URL`  | URL del proyecto Supabase                                          | _(vacío)_       |
| `SUPABASE_JWT_SECRET`   | Secret para proyectos HS256 legacy                                 | _(vacío)_       |
| `SUPABASE_JWT_AUDIENCE` | Audience esperada del token                                        | `authenticated` |
| `SUPABASE_JWT_ISSUER`   | Issuer esperado; si está vacío se deriva de `SUPABASE_PROJECT_URL` | _(vacío)_       |
| `SUPABASE_JWKS_URL`     | JWKS URL override para claves asimétricas                          | _(vacío)_       |

> **Importante:** si tu proyecto usa JWT signing keys asimétricas, configurá `SUPABASE_PROJECT_URL` o `SUPABASE_JWKS_URL`. Si usa HS256 legacy, configurá `SUPABASE_JWT_SECRET`.

### Variables Redis (cache opcional)

Redis acelera lecturas repetidas via cache-aside. MongoDB sigue siendo la fuente de verdad. Usamos **Upstash Redis REST** para no depender de conexiones TCP/TLS locales. Si `REDIS_ENABLED=false` (default), la API funciona sin cache sin problema.

| Variable                            | Descripción                             | Default   |
| ----------------------------------- | --------------------------------------- | --------- |
| `REDIS_ENABLED`                     | Habilitar cache Redis                   | `false`   |
| `UPSTASH_REDIS_REST_URL`            | URL REST de Upstash Redis               | _(vacío)_ |
| `UPSTASH_REDIS_REST_TOKEN`          | Token REST de Upstash Redis             | _(vacío)_ |
| `REDIS_TTL_SECONDS`                 | TTL general para users/chats (segundos) | `300`     |
| `REDIS_MESSAGE_HISTORY_TTL_SECONDS` | TTL para historial de mensajes          | `60`      |
| `REDIS_LATEST_MESSAGE_TTL_SECONDS`  | TTL para último mensaje                 | `60`      |

> **Seguridad:** el token de Upstash va solo en `backend/.env`. No lo pegues en `.env.example`, README, commits ni issues.

> **Tradeoff:** `REDIS_ENABLED=false` es el default para que el dev local no necesite Redis. En producción, habilitarlo reduce la carga en MongoDB para lecturas repetidas (listas de chats, historial de mensajes, perfiles de usuario).

### Variables LLM / Groq

| Variable            | Descripción                                    | Default                    |
| ------------------- | ---------------------------------------------- | -------------------------- |
| `LLM_PROVIDER`      | Proveedor de LLM (actualmente solo `groq`)     | `groq`                     |
| `GROQ_API_KEY`      | API key de Groq (**obligatorio** para chat IA) | _(vacío)_                  |
| `GROQ_MODEL`        | Modelo de Groq a usar                          | `qwen/qwen3-32b`           |
| `LLM_TEMPERATURE`   | Temperatura de generación (0.0–2.0)            | `0.7`                      |
| `LLM_MAX_TOKENS`    | Máximo de tokens por respuesta                 |                            |
| `LLM_HISTORY_LIMIT` | Cantidad de mensajes recientes como contexto   | `20`                       |
| `LLM_RATE_LIMIT_PER_MINUTE` | Máximo local de llamadas al LLM por minuto | `60`              |
| `LLM_MAX_CONCURRENT_REQUESTS` | Máximo local de llamadas simultáneas al LLM | `5`            |
| `LLM_SYSTEM_PROMPT` | System prompt del asistente                    | Prompt empático en español |

> **Protección LLM:** estos límites son por proceso del backend. Evitan que una ráfaga masiva sature el servidor o queme la API key de Groq. Si corrés múltiples workers/instancias, cada una aplica su propio límite.

---

## Base URL

```
http://localhost:8000/api/v1
```

Todos los endpoints de recursos cuelgan de `/api/v1`.

## Health

| Método | Path                   | Descripción                              |
| ------ | ---------------------- | ---------------------------------------- |
| `GET`  | `/api/v1/health`       | Estado de la API                         |
| `GET`  | `/api/v1/health/db`    | Estado de la conexión a MongoDB          |
| `GET`  | `/api/v1/health/cache` | Estado de la conexión a Redis (opcional) |

---

## Users

Representan usuarios del sistema. Cada usuario tiene un array `chats` con los IDs de sus conversaciones.

| Método   | Path                     | Descripción                                      |
| -------- | ------------------------ | ------------------------------------------------ |
| `GET`    | `/api/v1/users/me`       | Obtener usuario autenticado                      |
| `GET`    | `/api/v1/users`          | Devuelve el usuario autenticado en formato lista |
| `GET`    | `/api/v1/users/{userId}` | Obtener usuario por ID                           |
| `POST`   | `/api/v1/users`          | Crear usuario                                    |
| `PUT`    | `/api/v1/users/{userId}` | Actualizar usuario                               |
| `DELETE` | `/api/v1/users/{userId}` | Eliminar usuario                                 |

### Campos

| Campo         | Tipo     | Requerido | Notas                                                     |
| ------------- | -------- | --------- | --------------------------------------------------------- |
| `username`    | string   | Sí        | Debe ser único                                            |
| `personality` | object   | No        | Configuración de personalidad del usuario (default: `{}`) |
| `chats`       | string[] | —         | Solo lectura, gestionado automáticamente por el sistema   |

### Ejemplo: crear usuario

```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "samuel",
  "personality": {
    "tone": "friendly",
    "language": "es"
  }
}
```

**Respuesta `201 Created`:**

```json
{
  "userId": "a1b2c3d4-...",
  "username": "samuel",
  "personality": {
    "tone": "friendly",
    "language": "es"
  },
  "chats": []
}
```

### Errores

| Código | Causa                          |
| ------ | ------------------------------ |
| `409`  | `username` ya existe           |
| `404`  | `userId` no encontrado         |
| `400`  | PUT sin campos para actualizar |
| `503`  | Base de datos no disponible    |

---

## Chats

Conversaciones vinculadas a un usuario. Al crear un chat, el sistema agrega automáticamente el `chatId` al array `chats` del usuario.

| Método   | Path                     | Descripción         |
| -------- | ------------------------ | ------------------- |
| `GET`    | `/api/v1/chats`          | Listar chats        |
| `GET`    | `/api/v1/chats/{chatId}` | Obtener chat por ID |
| `POST`   | `/api/v1/chats`          | Crear chat          |
| `PUT`    | `/api/v1/chats/{chatId}` | Actualizar chat     |
| `DELETE` | `/api/v1/chats/{chatId}` | Eliminar chat       |

### Query params (GET list)

La lista de chats usa el usuario autenticado; no acepta `user_id` manual.

### Campos

| Campo       | Tipo     | Requerido | Notas                                |
| ----------- | -------- | --------- | ------------------------------------ |
| `userId`    | string   | Sí        | Debe existir en la colección `users` |
| `chatId`    | string   | —         | Generado automáticamente             |
| `createdAt` | datetime | —         | Timestamp UTC de creación            |

### Ejemplo: crear chat

```http
POST /api/v1/chats
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{}
```

**Respuesta `201 Created`:**

```json
{
  "chatId": "e5f6g7h8-...",
  "userId": "a1b2c3d4-...",
  "createdAt": "2026-05-13T10:30:00Z"
}
```

> **Nota:** Al crear el chat, el `chatId` se agrega automáticamente al array `chats` del usuario. Al eliminarlo, se remueve.

### Errores

| Código | Causa                                                  |
| ------ | ------------------------------------------------------ |
| `404`  | `userId` no existe (al crear) o `chatId` no encontrado |
| `400`  | PUT sin campos para actualizar                         |
| `503`  | Base de datos no disponible                            |

---

## Messages

Mensajes dentro de un chat. Cada mensaje tiene un `role` que indica quién lo envió.
Los clientes autenticados solo pueden crear y editar mensajes de `role="user"`.
Los mensajes `assistant` y `system` los genera el backend/LLM internamente.

| Método   | Path                               | Descripción               |
| -------- | ---------------------------------- | ------------------------- |
| `GET`    | `/api/v1/messages`                 | Listar mensajes           |
| `GET`    | `/api/v1/messages/latest/{chatId}` | Último mensaje de un chat |
| `GET`    | `/api/v1/messages/{messageId}`     | Obtener mensaje por ID    |
| `POST`   | `/api/v1/messages`                 | Crear mensaje             |
| `PUT`    | `/api/v1/messages/{messageId}`     | Actualizar mensaje        |
| `DELETE` | `/api/v1/messages/{messageId}`     | Eliminar mensaje          |

### Query params (GET list)

| Param     | Tipo   | Default | Descripción                                                |
| --------- | ------ | ------- | ---------------------------------------------------------- |
| `chat_id` | string | —       | Filtrar por chatId                                         |
| `limit`   | int    | `50`    | Cantidad máxima (1–200)                                    |
| `sort`    | string | `desc`  | Orden: `asc` (cronológico) o `desc` (más reciente primero) |

### Campos

| Campo       | Tipo     | Requerido | Notas                          |
| ----------- | -------- | --------- | ------------------------------ |
| `chatId`    | string   | Sí        | ID del chat al que pertenece   |
| `role`      | string   | Sí        | `user`, `assistant` o `system` |
| `content`   | string   | Sí        | Texto del mensaje (1–4000 chars) |
| `messageId` | string   | —         | Generado automáticamente       |
| `createdAt` | datetime | —         | Timestamp UTC                  |

### Ejemplo: crear mensaje

```http
POST /api/v1/messages
Content-Type: application/json

{
  "chatId": "e5f6g7h8-...",
  "role": "user",
  "content": "Hola, ¿cómo estás?"
}
```

**Respuesta `201 Created`:**

```json
{
  "messageId": "i9j0k1l2-...",
  "chatId": "e5f6g7h8-...",
  "role": "user",
  "content": "Hola, ¿cómo estás?",
  "createdAt": "2026-05-13T10:31:00Z"
}
```

### Ejemplo: obtener el último mensaje de un chat

```http
GET /api/v1/messages/latest/e5f6g7h8-...
```

Devuelve el mensaje más reciente de ese chat (ordenado por `createdAt` descendente). Útil para mostrar previews en listas de conversaciones.

### Ejemplo: listar los últimos 10 mensajes de un chat (orden cronológico)

```http
GET /api/v1/messages?chat_id=e5f6g7h8-...&limit=10&sort=asc
```

### Errores

| Código | Causa                                                                        |
| ------ | ---------------------------------------------------------------------------- |
| `404`  | `messageId` no encontrado, o no hay mensajes para el `chatId` (en `/latest`) |
| `400`  | PUT sin campos para actualizar, o intento de crear/editar mensajes no-`user` |
| `503`  | Base de datos no disponible                                                  |

---

## Tasks

Tareas vinculadas a un usuario, con estado de progreso.

| Método   | Path                     | Descripción          |
| -------- | ------------------------ | -------------------- |
| `GET`    | `/api/v1/tasks`          | Listar tareas        |
| `GET`    | `/api/v1/tasks/{taskId}` | Obtener tarea por ID |
| `POST`   | `/api/v1/tasks`          | Crear tarea          |
| `PUT`    | `/api/v1/tasks/{taskId}` | Actualizar tarea     |
| `DELETE` | `/api/v1/tasks/{taskId}` | Eliminar tarea       |

### Query params (GET list)

| Param         | Tipo   | Descripción                                           |
| ------------- | ------ | ----------------------------------------------------- |
| `task_status` | string | Filtrar por status (`pending`, `in_progress`, `done`) |

### Campos

| Campo         | Tipo     | Requerido | Notas                                                  |
| ------------- | -------- | --------- | ------------------------------------------------------ |
| `userId`      | string   | Sí        | ID del usuario dueño                                   |
| `title`       | string   | Sí        | Título de la tarea                                     |
| `description` | string   | No        | Descripción (default: `""`)                            |
| `status`      | string   | No        | `pending`, `in_progress` o `done` (default: `pending`) |
| `taskId`      | string   | —         | Generado automáticamente                               |
| `createdAt`   | datetime | —         | Timestamp UTC de creación                              |
| `updatedAt`   | datetime | —         | Timestamp UTC de última actualización                  |

> Validaciones principales: `title` 1–200 chars, `description` hasta 2000 chars, `status` restringido a `pending`, `in_progress` o `done`.

### Ejemplo: crear tarea

```http
POST /api/v1/tasks
Content-Type: application/json

{
  "userId": "a1b2c3d4-...",
  "title": "Completar onboarding",
  "description": "Configurar perfil y primer chat",
  "status": "pending"
}
```

**Respuesta `201 Created`:**

```json
{
  "taskId": "m3n4o5p6-...",
  "userId": "a1b2c3d4-...",
  "title": "Completar onboarding",
  "description": "Configurar perfil y primer chat",
  "status": "pending",
  "createdAt": "2026-05-13T10:32:00Z",
  "updatedAt": "2026-05-13T10:32:00Z"
}
```

### Ejemplo: filtrar tareas pendientes de un usuario

```http
GET /api/v1/tasks?task_status=pending
```

### Errores

| Código | Causa                          |
| ------ | ------------------------------ |
| `404`  | `taskId` no encontrado         |
| `400`  | PUT sin campos para actualizar |
| `503`  | Base de datos no disponible    |

---

## AI Chat (Streaming)

Chat con IA usando Groq como proveedor de LLM. Las respuestas se transmiten en tiempo real via SSE (Server-Sent Events).

| Método | Path                                     | Descripción               |
| ------ | ---------------------------------------- | ------------------------- |
| `POST` | `/api/v1/chats/{chatId}/messages/stream` | Streaming de respuesta IA |

### Body

| Campo          | Tipo   | Requerido | Notas                                          |
| -------------- | ------ | --------- | ---------------------------------------------- |
| `userId`       | string | Sí        | ID del usuario (temporal, hasta que haya auth) |
| `content`      | string | Sí        | Mensaje del usuario (mínimo 1 carácter)        |
| `historyLimit` | int    | No        | Override de mensajes de contexto (1–100)       |

### Ejemplo: enviar mensaje y recibir streaming

```http
POST /api/v1/chats/e5f6g7h8-.../messages/stream
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{
  "content": "Me siento ansioso hoy"
}
```

### Eventos SSE

El endpoint devuelve `text/event-stream` con eventos JSON línea por línea:

```
data: {"type":"token","content":"Entiendo"}

data: {"type":"token","content":" que"}

data: {"type":"token","content":" te"}

data: {"type":"token","content":" sentís"}

data: {"type":"token","content":" así"}

data: {"type":"done","messageId":"i9j0k1l2-..."}
```

### Tipos de evento

| Tipo    | Campos      | Descripción                                 |
| ------- | ----------- | ------------------------------------------- |
| `token` | `content`   | Fragmento de texto de la respuesta          |
| `done`  | `messageId` | Stream completado, mensaje guardado         |
| `error` | `message`   | Error (mensaje seguro, sin exponer secrets) |

### Consumir desde el frontend

Con `fetch` + lectura manual del stream:

```javascript
const response = await fetch(`/api/v1/chats/${chatId}/messages/stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId, content: "Hola" }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const event = JSON.parse(line.slice(6));
      if (event.type === "token") {
        // Append event.content to UI
      } else if (event.type === "done") {
        // Stream finished, message saved with id event.messageId
      } else if (event.type === "error") {
        // Show event.message to user
      }
    }
  }
}
```

### Persistencia

1. El **mensaje del usuario** se guarda en la DB **antes** de iniciar el streaming.
2. Los tokens se acumulan en memoria durante el stream.
3. El **mensaje del asistente** se guarda **después** de que el stream completa.
4. Si el stream falla sin generar contenido, no se guarda mensaje vacío.

### Errores

| Código          | Causa                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `404` (via SSE) | `chatId` no existe                                                       |
| `403` (via SSE) | `userId` no es dueño del chat                                            |
| `500` (via SSE) | Error interno del proveedor LLM                                          |
| SSE `error`     | Paquete `groq` no instalado — ejecutar `pip install -r requirements.txt` |

Los errores de validación HTTP (body inválido) devuelven `422` como JSON estándar de FastAPI.

---

## Flujos comunes

### Flujo completo: crear usuario → chat → mensajes

```
1. POST /api/v1/users          → { userId: "u1", chats: [] }
2. POST /api/v1/chats          → { chatId: "c1", userId: "u1" }
   (el sistema agrega "c1" al array chats del usuario)
3. POST /api/v1/messages       → { role: "user", content: "Hola", chatId: "c1" }
4. POST /api/v1/messages       → { role: "assistant", content: "¡Hola!", chatId: "c1" }
5. GET  /api/v1/messages/latest/c1 → último mensaje del chat
6. GET  /api/v1/users/u1       → { chats: ["c1"], ... }
```

### Mostrar lista de conversaciones con preview

```
1. GET /api/v1/chats                  → lista de chats del usuario autenticado
2. Para cada chat, GET /api/v1/messages/latest/{chatId} → preview del último mensaje
```

### Mostrar historial de un chat

```
GET /api/v1/messages?chat_id=c1&limit=50&sort=asc
```

---

## Testing con Thunder Client

Guía completa con requests copy-paste para probar todos los endpoints, incluyendo el streaming SSE de Groq:

- **Documento:** [`docs/thunder-client.md`](docs/thunder-client.md)
- **Colección importable:** [`docs/thunder-client-collection.json`](docs/thunder-client-collection.json)

La guía incluye un happy path paso a paso (health → user → chat → messages → streaming → tasks) y un fallback con curl para visualizar el streaming en tiempo real.

---

## Arquitectura

El backend sigue una separación de responsabilidades en cuatro capas:

```
app/
├── core/           # Configuración (pydantic-settings)
├── cache/          # Redis cache-aside (opcional, safe degradation)
│   ├── keys.py         # Key patterns centralizados
│   └── redis.py        # Upstash REST async client, lazy connect, JSON helpers
├── db/             # Conexión MongoDB + helpers (UUID, timestamps)
├── llm/            # Abstracción de proveedores LLM
│   ├── client.py       # Factory: devuelve el proveedor activo
│   └── providers/
│       └── groq_provider.py  # Streaming async via SDK de Groq
├── schemas/        # Pydantic models para request/response (sin lógica de DB)
│   ├── user.py
│   ├── chat.py
│   ├── chat_stream.py  # Request schema para streaming IA
│   ├── message.py
│   └── task.py
├── services/       # Reglas de negocio y orquestación cross-entity
│   ├── user_service.py
│   ├── chat_service.py
│   ├── ai_chat_service.py  # Orquestación del chat IA (stream + persistencia)
│   ├── message_service.py
│   └── task_service.py
├── repositories/   # Persistencia pura: queries, updates, sin lógica de negocio
│   ├── user_repository.py
│   ├── chat_repository.py
│   ├── message_repository.py
│   └── task_repository.py
├── routers/        # HTTP thin layer: validación → service → HTTP response
│   ├── users.py
│   ├── chats.py      # CRUD + POST /{chatId}/messages/stream
│   ├── messages.py
│   ├── tasks.py
│   └── health.py
└── main.py         # App factory + lifespan
```

### Responsabilidades por capa

| Capa              | Responsabilidad                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **schemas/**      | Definir la forma de datos de entrada/salida (Pydantic). Sin lógica de DB.                            |
| **services/**     | Reglas de negocio y orquestación. Cache-aside en reads, invalidación en writes.                      |
| **cache/**        | Upstash Redis cache-aside opcional. Lazy connect, safe degradation, JSON serialization.              |
| **repositories/** | Persistencia pura: queries Mongo, CRUD helpers, generación de IDs/timestamps. Sin lógica de negocio. |
| **routers/**      | Parsear request → llamar service → traducir resultado/error a HTTP. Sin acceso directo a Mongo.      |
| **db/**           | Conexión singleton, helpers compartidos (`new_id`, `now_utc`).                                       |

### Seguridad de IDs

- Los IDs expuestos en la API son UUIDs generados por el servidor (`userId`, `chatId`, `messageId`, `taskId`).
- El `_id` interno de Mongo **nunca** se incluye en las respuestas HTTP.
- Cada router tiene una función `_to_response()` que extrae solo los campos públicos del documento Mongo.

## Notas técnicas

- Los IDs son UUIDs generados por el servidor (no ObjectIDs de Mongo).
- Todos los timestamps son UTC.
- El campo `updatedAt` solo existe en Tasks; se actualiza automáticamente al hacer PUT (lógica en `task_service.py`).
- La relación User ↔ Chat se mantiene sincronizada: crear un chat agrega el ID al usuario, eliminarlo lo remueve (lógica en `chat_service.py`).
- Los repositories solo hacen persistencia — la orquestación cross-entity vive en services/.
- No hay autenticación implementada aún.
- Redis es cache opcional (default off). MongoDB siempre es fuente de verdad. Si Redis no está disponible, la API funciona sin cache (safe degradation).
