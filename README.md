# Lab P4 — BluePrints en Tiempo Real (Sockets & STOMP)

**Autor:** Joshua David Quiroga Landazabal

Enunciado: [DECSIS-ECI/Lab_P4_BluePrints_RealTime-Sokets](https://github.com/DECSIS-ECI/Lab_P4_BluePrints_RealTime-Sokets)

Este laboratorio agrega **colaboración en tiempo real** al cliente React de Blueprints del laboratorio anterior: varias pestañas abren el mismo plano y cada punto que alguien dibuja aparece en las demás casi al instante. El tiempo real se puede hacer con **Socket.IO** o con **STOMP**, y se elige desde la interfaz.

## Qué pide el laboratorio y dónde quedó

| Requisito                                                   | Dónde está                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| CRUD por REST (listar, crear, actualizar, eliminar)         | `src/services/blueprints/` y `blueprintsSlice.js` (viene del lab anterior)                |
| Tiempo real con Socket.IO (`join-room`, `draw-event`)       | `src/lib/socketIoClient.js`, `src/lib/realtime.js`, `realtime/socketio-server/`           |
| Tiempo real con STOMP (`/app/draw` → `/topic/blueprints.*`) | `src/lib/stompClient.js`, `src/lib/realtime.js`, `realtime/stomp-server/`                 |
| Canvas con dibujo por clic (incremental)                    | `BlueprintCanvas.jsx` + `useBlueprintRealtime.js`                                         |
| Tabla del autor y total de puntos (`reduce`)                | `BlueprintList.jsx` y el selector `selectSelectedAuthorTotalPoints`                       |
| Barra de acciones: Create / Save / Delete                   | Botones **Crear**, **Guardar** y **Eliminar** de `BlueprintsPage.jsx`                     |
| Selector de tecnología (None / Socket.IO / STOMP)           | `RealtimeSelector.jsx`                                                                    |
| Logs y health checks                                        | Consola del navegador (`[rt:…]`), logs de ambos servidores, `/health`, `/actuator/health` |
| Análisis de latencia, reconexión y Socket.IO vs STOMP       | Sección [Análisis](#análisis)                                                             |

## Arquitectura

```
                     ┌──────────── REST: CRUD + estado inicial ───────────► API Blueprints (Lab 4, :8080)
React + Vite (:5173) │                                                      o apimock (sin backend)
                     │
                     └─ Tiempo real (selector de la interfaz)
                         ├─ Socket.IO: join-room / draw-event ────────────► realtime/socketio-server (:3001)
                         │             ◄──── blueprint-update (al resto de la sala)
                         └─ STOMP: publish /app/draw ─────────────────────► realtime/stomp-server (:8081)
                                   ◄──── /topic/blueprints.{author}.{name} (a todos los suscriptores)
```

- El **CRUD** y el **tiempo real** son canales separados. El servidor de tiempo real solo reenvía puntos; el plano se persiste cuando alguien presiona **Guardar** (`PUT`).
- Los dos servidores de tiempo real están **dentro de este repositorio**, en `realtime/`. Parten de los repos guía ([Socket.IO](https://github.com/DECSIS-ECI/example-backend-socketio-node-), [STOMP](https://github.com/DECSIS-ECI/example-backend-stopm)) y usan exactamente su protocolo, así que el front también funciona contra los repos guía originales.
- El backend STOMP corre en el **8081** (no en el 8080 del enunciado) porque el 8080 lo usa la API CRUD del Lab 4.

## Cómo ejecutar

Requisitos: Node.js 20.19+, y para STOMP, JDK 21 y Maven.

```bash
# 1) Front
npm install
cp .env.example .env
npm run dev                      # http://localhost:5173

# 2) Tiempo real (el que se vaya a usar, o los dos)
npm --prefix realtime/socketio-server install   # solo la primera vez
npm run rt:io                    # Socket.IO en http://localhost:3001
npm run rt:stomp                 # STOMP en http://localhost:8081 (endpoint /ws-blueprints)
```

Para la demostración:

1. Entrar a `http://localhost:5173/login` con `student / student123`.
2. Escribir el autor `john`, presionar **Get blueprints** y luego **Open** en un plano.
3. En **Tiempo real** elegir **Socket.IO** o **STOMP** y esperar el estado **Conectado**.
4. Repetir los pasos 2 y 3 en una segunda pestaña con el mismo plano.
5. Hacer clic en el lienzo de una pestaña: el punto aparece en la otra.
6. **Guardar** envía el plano al backend y actualiza la tabla y el total del autor.

Con `VITE_USE_MOCK=true` no hace falta el backend del Lab 4: el CRUD usa datos en memoria. Cada pestaña tiene su propia copia de esos datos, de modo que lo guardado en una no se ve en la otra; el tiempo real sí funciona igual. Para compartir también lo guardado, usar el Lab 4 (`VITE_USE_MOCK=false`).

### Variables de entorno

| Variable            | Valor por defecto       | Uso                                                    |
| ------------------- | ----------------------- | ------------------------------------------------------ |
| `VITE_USE_MOCK`     | `true`                  | `true` → `apimock`, `false` → API real del Lab 4       |
| `VITE_API_BASE_URL` | `/api/v1`               | Base de la API de blueprints (pasa por el proxy)       |
| `VITE_AUTH_URL`     | `/auth/login`           | Endpoint que emite el JWT                              |
| `VITE_BACKEND_URL`  | `http://localhost:8080` | Destino del proxy de Vite (Lab 4)                      |
| `VITE_IO_BASE`      | `http://localhost:3001` | Servidor Socket.IO                                     |
| `VITE_STOMP_BASE`   | `http://localhost:8081` | Servidor STOMP (se convierte a `ws://…/ws-blueprints`) |

Los servidores de tiempo real aceptan `PORT` y `CORS_ORIGIN` (orígenes permitidos separados por coma; por defecto `http://localhost:5173,http://localhost:4173`).

### Docker

```bash
docker compose up --build
# front :5173 · API Lab 4 :8080 · Socket.IO :3001 · STOMP :8081
```

El backend CRUD se construye desde el repo del Lab 4 clonado junto a este (`../LAB04_ARSW_Joshua-David-Quiroga-Landazabal`, o la ruta indicada en `BACKEND_CONTEXT`).

## Endpoints y protocolos usados

### REST (Lab 4)

El backend del Lab 4 tiene rutas distintas a las del enunciado; el cliente se ajusta a ellas.

| Operación          | Enunciado                              | Lab 4                                       |
| ------------------ | -------------------------------------- | ------------------------------------------- |
| Planos de un autor | `GET /api/blueprints?author=:author`   | `GET /api/v1/blueprints/{author}`           |
| Puntos de un plano | `GET /api/blueprints/:author/:name`    | `GET /api/v1/blueprints/{author}/{name}`    |
| Crear              | `POST /api/blueprints`                 | `POST /api/v1/blueprints`                   |
| Actualizar         | `PUT /api/blueprints/:author/:name`    | `PUT /api/v1/blueprints/{author}/{name}`    |
| Eliminar           | `DELETE /api/blueprints/:author/:name` | `DELETE /api/v1/blueprints/{author}/{name}` |
| Login              | —                                      | `POST /auth/login` → `{ access_token }`     |

Todas exigen JWT y responden `{ code, message, data }`. El total de puntos del autor se calcula en el cliente con `reduce` sobre sus planos.

### Socket.IO

| Dirección          | Evento             | Payload                                   |
| ------------------ | ------------------ | ----------------------------------------- |
| Cliente → servidor | `join-room`        | `blueprints.{author}.{name}`              |
| Cliente → servidor | `draw-event`       | `{ room, author, name, point: { x, y } }` |
| Servidor → sala    | `blueprint-update` | `{ author, name, points: [{ x, y }] }`    |

`GET /health` → `{ status: "UP", clients, uptime }`.

### STOMP

| Acción      | Destino                             | Payload                                |
| ----------- | ----------------------------------- | -------------------------------------- |
| Publicar    | `/app/draw`                         | `{ author, name, point: { x, y } }`    |
| Suscribirse | `/topic/blueprints.{author}.{name}` | `{ author, name, points: [{ x, y }] }` |

Endpoint WebSocket: `/ws-blueprints`. `GET /actuator/health` → `{ status: "UP" }`.

## Cómo se hizo

### 1. Una sola interfaz para las dos tecnologías

`src/lib/realtime.js` expone `connectRealtime(tech, { author, name, onUpdate, onStatus })`. Devuelve un objeto con `sendPoint(point)`, `close()` y `echoesSender`, igual para Socket.IO y para STOMP. El resto de la aplicación no sabe qué tecnología está activa.

- **Socket.IO** (`socketIoClient.js`): crea el socket con `transports: ['websocket']`. En cada evento `connect` (también al reconectar) emite `join-room`, porque el servidor olvida las salas cuando se cae la conexión.
- **STOMP** (`stompClient.js`): crea un `Client` de `@stomp/stompjs` con `reconnectDelay: 1000`. En cada `onConnect` se suscribe al tópico del plano.

### 2. El plano abierto es el canal

El hook `useBlueprintRealtime(tech, author, name)` abre **una conexión por (tecnología, autor, plano)** y la cierra al cambiar cualquiera de los tres. Así, al abrir otro plano se abandona el canal anterior sin depender de un evento `leave-room`, que el servidor guía no tiene. Además, el hook descarta cualquier mensaje cuyo `author`/`name` no sea el del plano abierto o cuyos puntos no sean numéricos.

### 3. El estado vive en Redux

Se agregó al slice de blueprints:

- `pointsAdded({ author, name, points })`: agrega puntos al plano actual. Lo usan tanto el clic local como los mensajes remotos.
- `dirty`: indica que hay puntos sin guardar. Se limpia al guardar o al abrir otro plano, y se restaura si el `PUT` falla (el guardado sigue siendo optimista, como en el lab anterior).

El catálogo (`items`) solo cambia al guardar. Por eso la tabla y el total muestran lo persistido y el lienzo muestra lo dibujado.

### 4. Quién pinta el punto propio

Las dos tecnologías se comportan distinto y el cliente lo tiene en cuenta con `echoesSender`:

- **Socket.IO** usa `socket.to(room)`, que excluye al emisor. El cliente pinta su punto de inmediato y lo envía.
- **STOMP** publica en un tópico al que el emisor también está suscrito. El cliente envía el punto y lo pinta cuando vuelve del broker, para no duplicarlo.

Si el canal está caído, el punto se pinta localmente y no se pierde.

### 5. Canvas colaborativo

`BlueprintCanvas` ya dibujaba por clic en los formularios de crear y editar. Ahora la página principal también le pasa `onAddPoint`, y un `viewKey` (autor/plano) que **fija la escala** calculada al abrir el plano. Sin eso, los planos pequeños del Lab 4 (coordenadas de 0 a 15) cambiarían de escala con cada punto nuevo. El clic se convierte de píxeles a coordenadas del plano con la inversa de esa escala.

Dibujar exige sesión iniciada (igual que crear o editar). Sin sesión se ven los trazos de los demás, pero el lienzo es de solo lectura.

### 6. Servidores de tiempo real

- **`realtime/socketio-server`** (Node + Express + Socket.IO): valida el payload de `draw-event`, exige que el socket esté en la sala donde dibuja, valida el origen en el handshake WebSocket y registra conexiones, salas y eventos.
- **`realtime/stomp-server`** (Spring Boot 3, Java 21): `DrawController` recibe `/app/draw`, descarta eventos inválidos y publica en el tópico del plano. `SessionEventsLogger` registra conexiones, suscripciones y desconexiones. Los orígenes permitidos se configuran en `application.yml`.

## Decisiones

- **Sala/tópico por plano** (`blueprints.{author}.{name}`): el aislamiento lo da el propio canal y se refuerza filtrando en el cliente.
- **El servidor de tiempo real no guarda puntos.** El estado inicial siempre sale del CRUD. Quien entra tarde ve lo guardado más lo que se dibuje desde ese momento; para ver lo anterior, alguien debe presionar **Guardar**.
- **Backends de tiempo real en este repo**, independientes del Lab 4, para no acoplar el CRUD con el transporte y poder comparar las dos tecnologías con el mismo front.
- **Conexión directa del navegador** a los servidores de tiempo real (sin pasar por el proxy de Vite), con orígenes restringidos en cada servidor.

## Estructura (lo nuevo)

```
src/
├─ lib/
│  ├─ socketIoClient.js        # crea el socket (WebSocket)
│  ├─ stompClient.js           # crea el cliente STOMP y la suscripción al tópico
│  └─ realtime.js              # connectRealtime(): misma interfaz para ambas tecnologías
├─ hooks/useBlueprintRealtime.js   # ciclo de vida del canal + dibujo incremental
├─ components/RealtimeSelector.jsx # None / Socket.IO / STOMP + estado de la conexión
├─ components/BlueprintCanvas.jsx  # + viewKey (escala fija por plano)
├─ features/blueprints/blueprintsSlice.js  # + pointsAdded, dirty
└─ pages/BlueprintsPage.jsx        # canvas colaborativo y barra de acciones
realtime/
├─ socketio-server/            # server.js, src/realtimeServer.js, test/, Dockerfile
└─ stomp-server/               # pom.xml, src/main/java/co/edu/eci/blueprints/rt/, src/test/, Dockerfile
tests/
├─ realtime.test.js            # adaptadores Socket.IO y STOMP
└─ realtimePage.test.jsx       # página + hook + Redux con una conexión simulada
```

## Pruebas y verificación

| Qué                    | Comando                                      | Resultado   |
| ---------------------- | -------------------------------------------- | ----------- |
| Front                  | `npm test`                                   | 97 pruebas  |
| Servidor Socket.IO     | `npm --prefix realtime/socketio-server test` | 7 pruebas   |
| Servidor STOMP         | `mvn -f realtime/stomp-server/pom.xml test`  | 3 pruebas   |
| Lint y build del front | `npm run lint`, `npm run build`              | sin errores |

El workflow de GitHub Actions ejecuta los tres grupos en jobs separados.

Además se probó de extremo a extremo con dos pestañas de un navegador real (Edge automatizado) en dos entornos: en desarrollo (front en modo mock y los dos servidores de tiempo real) y con `docker compose up --build` (front en nginx, API real del Lab 4 con JWT y los dos servidores en contenedores):

| Caso de prueba del enunciado                                                 | Resultado |
| ---------------------------------------------------------------------------- | --------- |
| Estado inicial: al abrir el plano se cargan sus puntos                       | ✅        |
| Dibujo local: con **None** el clic agrega el punto y no se replica           | ✅        |
| RT multi-pestaña con Socket.IO, en ambos sentidos                            | ✅        |
| RT multi-pestaña con STOMP, en ambos sentidos y sin duplicar el punto propio | ✅        |
| Aislamiento: una pestaña en otro plano no recibe el punto                    | ✅        |
| Guardar actualiza la tabla y el total del autor                              | ✅        |
| Reconexión automática tras reiniciar cada servidor                           | ✅        |

Solo con Docker y el Lab 4 real:

| Caso                                                                           | Resultado |
| ------------------------------------------------------------------------------ | --------- |
| Las cuatro imágenes construyen y los contenedores arrancan (backend `healthy`) | ✅        |
| Login con JWT del Lab 4 y `401` sin token                                      | ✅        |
| **Guardar** persiste los puntos (`PUT`) y una pestaña nueva los carga          | ✅        |
| **Crear** (`POST`) y **Eliminar** (`DELETE`) desde la interfaz                 | ✅        |
| Los servidores de tiempo real rechazan un origen no permitido (`403` / `400`)  | ✅        |

## Análisis

Mediciones locales (todo en `localhost`, 20 puntos por tecnología), desde el clic en una pestaña hasta que la otra actualiza el lienzo:

| Tecnología | Mínima | Mediana | Máxima |
| ---------- | ------ | ------- | ------ |
| Socket.IO  | 2 ms   | 4 ms    | 9 ms   |
| STOMP      | 3 ms   | 4 ms    | 9 ms   |

En red local no hay diferencia apreciable entre las dos: el costo lo domina el repintado, no el transporte.

**Reconexión**

- Socket.IO reconectó entre 1,5 s y 2,7 s después de volver el servidor. Hay que reenviar `join-room` en cada `connect`; si no, el cliente queda conectado pero sin recibir nada.
- STOMP reintenta cada segundo (`reconnectDelay`) y hay que volver a suscribirse en cada `onConnect`.
- En ambos casos lo dibujado durante la caída queda solo en la pestaña que lo dibujó, porque el servidor no guarda historial. Se recupera al guardar.

**Socket.IO vs STOMP**

| Aspecto                     | Socket.IO                                                                                       | STOMP                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Modelo                      | Eventos con nombre y salas                                                                      | Destinos (`/app`, `/topic`) sobre un broker de mensajes                         |
| Eco al emisor               | No (`socket.to(room)`)                                                                          | Sí (el emisor también está suscrito al tópico)                                  |
| Orden de los puntos         | Cada cliente pinta lo suyo primero: con clics simultáneos el orden puede diferir entre pestañas | El broker define un único orden para todos                                      |
| Respuesta al dibujar        | Inmediata, no depende de la red                                                                 | Espera el viaje de ida y vuelta al broker                                       |
| Reconexión                  | Incluida, con espera creciente                                                                  | Incluida, con intervalo fijo                                                    |
| Confirmaciones              | _Acks_ por evento                                                                               | Recibos de STOMP (no se usaron)                                                 |
| Interoperabilidad           | Protocolo propio: exige cliente y servidor Socket.IO                                            | Protocolo estándar: sirve cualquier cliente o broker STOMP (RabbitMQ, ActiveMQ) |
| Escalar a varias instancias | Adaptador (Redis)                                                                               | Broker externo (relay)                                                          |
| Encaje con el stack         | Natural con Node                                                                                | Natural con Spring (`@MessageMapping`)                                          |

## Seguridad

- **Validación de payloads** en ambos servidores (sala, autor, nombre y punto numérico) y de nuevo en el cliente antes de tocar el estado.
- **Autorización por sala** en Socket.IO: solo se puede dibujar en una sala a la que el socket se unió.
- **Orígenes restringidos** con `CORS_ORIGIN` en ambos servidores (en Socket.IO se valida en el handshake, porque CORS no cubre WebSocket).
- **JWT**: lo exige el CRUD y la interfaz solo deja dibujar con sesión iniciada. Los servidores de tiempo real **no** validan el token, así que un cliente hecho a mano podría publicar puntos sin autenticarse. Queda como mejora: enviar el JWT en el handshake y verificarlo con la clave pública del Lab 4.

## Limitaciones conocidas

- El servidor de tiempo real no tiene historial: quien entra tarde no ve los puntos dibujados y aún no guardados.
- Si dos personas guardan versiones distintas, gana la última (`PUT` reemplaza todos los puntos).
- Cuando una pestaña guarda, las demás no se enteran: siguen mostrando «Hay cambios sin guardar» y su tabla no cambia hasta volver a consultar al autor. El protocolo de los repos guía no tiene un evento de guardado.
- Al abrir otro plano se descartan los puntos sin guardar del actual; la interfaz avisa con «Hay cambios sin guardar», pero no pide confirmación.
- En los planos pequeños del Lab 4 (coordenadas 0–15) el clic se ajusta a coordenadas enteras, así que el punto puede quedar ligeramente desplazado respecto al cursor.

## Evidencias

- [ ] Video corto (≤ 90 s) con la colaboración en vivo y las operaciones CRUD.
- [ ] Capturas de dos pestañas con Socket.IO y con STOMP.

## Scripts

| Script             | Qué hace                          |
| ------------------ | --------------------------------- |
| `npm run dev`      | Servidor de desarrollo de Vite    |
| `npm run build`    | Build de producción               |
| `npm test`         | Pruebas del front (Vitest)        |
| `npm run lint`     | ESLint                            |
| `npm run format`   | Prettier                          |
| `npm run rt:io`    | Servidor de tiempo real Socket.IO |
| `npm run rt:stomp` | Servidor de tiempo real STOMP     |

## Base del laboratorio anterior

El cliente parte del Lab 5 (React + Vite, Redux Toolkit, Axios con interceptores JWT, React Router, Vitest), que ya incluía el CRUD con actualizaciones optimistas, las rutas protegidas, el modo mock y el despliegue con Docker. El backend CRUD es el del [Lab 4](https://github.com/JoshQ10/LAB04_ARSW_Joshua-David-Quiroga-Landazabal). Las definiciones de los términos usados están en [DEFINICIONES.md](./DEFINICIONES.md).
