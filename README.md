# Lab – React Client for Blueprints (Redux + Axios + JWT)

> Basado en el cliente HTML/JS del repo de referencia, este laboratorio moderniza el _frontend_ con **React + Vite**, **Redux Toolkit**, **Axios** (con interceptores y JWT), **React Router** y pruebas con **Vitest + Testing Library**.

## Objetivos de aprendizaje

- Diseñar una SPA en React aplicando **componetización** y **Redux (reducers/slices)**.
- Consumir APIs REST de Blueprints con **Axios** y manejar **estados de carga/errores**.
- Integrar **autenticación JWT** con interceptores y rutas protegidas.
- Aplicar buenas prácticas: estructura de carpetas, `.env`, linters, testing, CI.

## Requisitos previos

- Tener corriendo el backend de Blueprints de los **Labs 3 y 4** (APIs + seguridad).
- Node.js 18+ y npm.

Ver la especificación de glosario clave, consulta las [Definiciones del laboratorio](./DEFINICIONES.md).

## Endpoints esperados (ajústalos si tu backend quedo diferente)

- `GET /api/blueprints` → lista general o catálogo para derivar autores.
- `GET /api/blueprints/{author}`
- `GET /api/blueprints/{author}/{name}`
- `POST /api/blueprints` (requiere JWT)
- `POST /api/auth/login` → `{ token }`

Configura la URL base en `.env`.

## Cómo arrancar

```bash
npm install
cp .env.example .env
# edita .env con la URL del backend
npm run dev
```

Abre `http://localhost:5173`

## Variables de entorno

Crea un archivo `.env` en la raíz:

```variable
VITE_API_BASE_URL=http://localhost:8080/api
```

> **Tip:** en producción usa variables seguras o un _reverse proxy_.

## Estructura

```carpetas
blueprints-react-lab/
├─ src/
│  ├─ components/
│  ├─ features/blueprints/blueprintsSlice.js
│  ├─ pages/
│  ├─ services/apiClient.js   # axios + interceptores JWT
│  ├─ store/index.js          # Redux Toolkit
│  ├─ App.jsx, main.jsx, styles.css
├─ tests/
├─ .github/workflows/ci.yml
├─ index.html, package.json, vite.config.js, README.md
```

## 📌 Requerimientos del laboratorio

## 1. Canvas (lienzo)

- Agregar un lienzo (Canvas) a la página.
- Incluir un componente `BlueprintCanvas` con un identificador propio.
- Definir dimensiones adecuadas (ej. `520×360`) para que no ocupe toda la pantalla pero permita dibujar los planos.

## 2. Listar los planos de un autor

- Permitir ingresar el nombre de un autor y consultar sus planos desde el backend (o mock).
- Mostrar los resultados en una tabla con las siguientes columnas:
  - Nombre del plano
  - Número de puntos
  - Botón `Open` para abrirlo

## 3. Seleccionar un plano y graficarlo

Al hacer clic en el botón `Open`, debe:

- Actualizar un campo de texto con el nombre del plano actual.
- Obtener los puntos del plano correspondiente.
- Dibujar consecutivamente los segmentos de recta en el canvas y marcar cada punto.

## 4. Servicios: `apimock` y `apiclient`

- Implementar dos servicios con la misma interfaz:
  - `apimock`: retorna datos de prueba desde memoria.
  - `apiclient`: consume el API REST real con Axios.
- La interfaz de ambos debe incluir los métodos:
  - `getAll`
  - `getByAuthor`
  - `getByAuthorAndName`
  - `create`
- Habilitar el cambio entre `apimock` y `apiclient` con una sola línea de código:
  - Definir un módulo `blueprintsService.js` que importe uno u otro según una variable en `.env`.
  - Ejemplo en `.env` (Vite):

```env
VITE_USE_MOCK=true
```

- `VITE_USE_MOCK=true` usa el mock.
- `VITE_USE_MOCK=false` usa el API real.

## 5. Interfaz con React

- El nombre del plano actual debe mostrarse en el DOM como parte del estado global (Redux).
- Evitar manipular directamente el DOM; usar componentes y props/estado.

## 6. Estilos

- Agregar estilos para mejorar la presentación.
- Se puede usar Bootstrap u otro framework CSS.
- Ajustar la tabla, botones y tarjetas para acercarse al mock de referencia.

## 7. Pruebas unitarias

- Agregar pruebas con Vitest + Testing Library para validar:
  - Render del canvas.
  - Envío de formularios.
  - Interacciones básicas con Redux (por ejemplo: dispatch de `fetchByAuthor`).

---

### Notas rápidas y recomendaciones

- Para el canvas en tests con jsdom: agregar un mock de `HTMLCanvasElement.prototype.getContext` en `tests/setup.js`.
- Para usar `@testing-library/jest-dom` con Vitest: en `tests/setup.js` importar `import '@testing-library/jest-dom'` y asegurarse de que Vitest provea el global `expect` (configurar `vitest.config.js` con la opción `test: { globals: true, setupFiles: './tests/setup.js' }`).
- Para la conmutación de servicios en Vite, usar `import.meta.env.VITE_USE_MOCK` para leer la variable en tiempo de ejecución.

## 📌 Recomendaciones y actividades sugeridas para el exito del laboratorio

1. **Redux avanzado**
   - [x] Agrega estados `loading/error` por _thunk_ y muéstralos en la UI.
   - [x] Implementa _memo selectors_ para derivar el top-5 de blueprints por cantidad de puntos.
2. **Rutas protegidas**
   - [x] Crea un componente `<PrivateRoute>` y protege la creación/edición.
3. **CRUD completo**
   - [x] Implementa `PUT /api/blueprints/{author}/{name}` y `DELETE ...` en el slice y en la UI.
   - [x] Optimistic updates (revertir si falla).
4. **Dibujo interactivo**
   - [x] Reemplaza el `svg` por un lienzo donde el usuario haga _click_ para agregar puntos.
   - [x] Botón “Guardar” que envíe el blueprint.
5. **Errores y _Retry_**
   - [x] Si `GET` falla, muestra un banner y un botón **Reintentar** que dispare el thunk.
6. **Testing**
   - [x] Pruebas de `blueprintsSlice` (reducers puros).
   - [x] Pruebas de componentes con Testing Library (render, interacción).
7. **CI/Lint/Format**
   - [x] Activa **GitHub Actions** (workflow incluido) → lint + test + build.
8. **Docker (opcional)**
   - [x] Crea `Dockerfile` (+ `compose`) para front + backend.

## Criterios de evaluación

- Funcionalidad y cobertura de casos (30%)
- Calidad de código y arquitectura (Redux, componentes, servicios) (25%)
- Manejo de estado, errores, UX (15%)
- Pruebas automatizadas (15%)
- Seguridad (JWT/Interceptores/Rutas protegidas) (10%)
- CI/Lint/Format (5%)

## Scripts

- `npm run dev` – servidor de desarrollo Vite
- `npm run build` – build de producción
- `npm run preview` – previsualizar build
- `npm run lint` – ESLint
- `npm run format` – Prettier
- `npm test` – Vitest

---

### Extensiones propuestas del reto

- **Redux Toolkit Query** para _caching_ de requests.
- **MSW** para _mocks_ sin backend.
- **Dark mode** y diseño responsive.

> Este proyecto es un punto de partida para que tus estudiantes evolucionen el cliente clásico de Blueprints a una SPA moderna con prácticas de la industria.

---

## ✅ Desarrollo del laboratorio

**Autor:** Joshua David Quiroga Landazabal

Backend usado: [LAB04 – Blueprints API con JWT](https://github.com/JoshQ10/LAB04_ARSW_Joshua-David-Quiroga-Landazabal), que extiende el [LAB03](https://github.com/JoshQ10/LAB03_ARSW_Joshua_David_Quiroga).

### Endpoints reales del backend (Lab 4)

El backend quedó distinto a los endpoints de ejemplo, así que el cliente se ajustó a él:

| Operación          | Endpoint del Lab 4                          | Notas                                                   |
| ------------------ | ------------------------------------------- | ------------------------------------------------------- |
| Login              | `POST /auth/login`                          | Devuelve `{ access_token, token_type, expires_in }`     |
| Todos los planos   | `GET /api/v1/blueprints`                    | Requiere JWT (scope `blueprints.read`)                  |
| Planos de un autor | `GET /api/v1/blueprints/{author}`           | 404 si no tiene planos → el cliente muestra lista vacía |
| Un plano           | `GET /api/v1/blueprints/{author}/{name}`    | Requiere JWT                                            |
| Crear              | `POST /api/v1/blueprints`                   | Requiere JWT (scope `blueprints.write`)                 |
| Actualizar         | `PUT /api/v1/blueprints/{author}/{name}`    | Reemplaza los puntos (`blueprints.write`)               |
| Eliminar           | `DELETE /api/v1/blueprints/{author}/{name}` | Requiere JWT (`blueprints.write`)                       |

- Todas las respuestas vienen envueltas en `{ code, message, data }`; `apiclient` las desempaqueta.
- Usuarios de prueba: `student / student123` y `assistant / assistant123`.
- El Lab 4 **no configura CORS**. Por eso en desarrollo las rutas `/api` y `/auth` pasan por el **proxy de Vite** (`vite.config.js`) y en Docker por **nginx**. Así el navegador ve el front y la API en el mismo origen y no hace falta cambiar el backend.
- `PUT /{author}/{name}` y `DELETE /{author}/{name}` **se agregaron al Lab 4** para este laboratorio, con sus pruebas (`BlueprintsAPIControllerTest`). El cliente los usa con actualizaciones optimistas: si el servidor falla (por ejemplo, un backend sin esos endpoints responde `405`), el cambio se revierte y se muestra el error.

### Cómo ejecutar

Requiere Node.js 20.19+ (lo pide Vite 7).

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

**Modo mock** (sin backend): `VITE_USE_MOCK=true` en `.env`. El login acepta los mismos usuarios del Lab 4.

**Modo API real**: levantar el Lab 4 (`mvn -DskipTests spring-boot:run` con JDK 21) y poner `VITE_USE_MOCK=false` en `.env`.

| Variable            | Valor por defecto       | Uso                                                         |
| ------------------- | ----------------------- | ----------------------------------------------------------- |
| `VITE_USE_MOCK`     | `true`                  | `true` → `apimock`, `false` → `apiclient`                   |
| `VITE_API_BASE_URL` | `/api/v1`               | Base de la API de blueprints (relativa = pasa por el proxy) |
| `VITE_AUTH_URL`     | `/auth/login`           | Endpoint que emite el JWT                                   |
| `VITE_BACKEND_URL`  | `http://localhost:8080` | Destino del proxy de Vite                                   |

**Docker (front + backend):**

```bash
docker compose up --build   # front en http://localhost:5173, API en :8080
```

- El backend se construye desde el repo del Lab 4 clonado junto a este proyecto (`../LAB04_ARSW_Joshua-David-Quiroga-Landazabal`). Para usar otra ruta, define `BACKEND_CONTEXT`: `BACKEND_CONTEXT=/ruta/al/lab4 docker compose up --build`.
- El front se construye con `VITE_USE_MOCK=false`. nginx sirve la SPA (también al recargar rutas como `/login`) y reenvía `/api` y `/auth` al contenedor `backend`.
- `web` espera a que el healthcheck del `backend` esté en verde antes de arrancar.
- Para detener: `docker compose down`. El backend guarda los datos en memoria, así que al reiniciarlo vuelve a los datos semilla.

### Arquitectura

```carpetas
src/
├─ components/
│  ├─ BlueprintCanvas.jsx     # <canvas id="blueprint-canvas"> 520×360: segmentos + marca de cada punto; modo clic para dibujar
│  ├─ BlueprintForm.jsx       # crear/editar: autor, nombre y puntos dibujados en el lienzo (Guardar/Deshacer/Limpiar)
│  ├─ BlueprintList.jsx       # tabla: Blueprint name | Number of points | Open
│  ├─ TopBlueprints.jsx       # top 5 por número de puntos (selector memoizado)
│  ├─ ErrorBanner.jsx         # banner de error con botón Reintentar
│  ├─ PrivateRoute.jsx        # protege crear/editar; redirige a /login y vuelve a la ruta original
│  ├─ DeleteButton.jsx, ThemeToggle.jsx
├─ features/
│  ├─ blueprints/blueprintsSlice.js   # thunks, estados loading/error por thunk, updates optimistas, selectores
│  └─ auth/authSlice.js               # login JWT, logout, sesión inicial desde localStorage (descarta tokens vencidos)
├─ pages/  BlueprintsPage, BlueprintDetailPage, CreateBlueprintPage, EditBlueprintPage, LoginPage, NotFound
├─ services/
│  ├─ apiClient.js            # axios + interceptores: agrega Bearer y, ante un 401, cierra la sesión
│  ├─ blueprints/apiclient.js # API REST real
│  ├─ blueprints/apimock.js   # datos en memoria (misma interfaz)
│  ├─ blueprintsService.js    # elige mock o API según VITE_USE_MOCK
│  ├─ authService.js, tokenStorage.js
└─ store/index.js             # makeStore(): inyecta los servicios como extraArgument de los thunks
```

### Requerimientos

1. **Canvas**: `BlueprintCanvas` dibuja un `<canvas id="blueprint-canvas">` de 520×360 con cuadrícula estilo plano. Si los puntos son muy pequeños (el seed del Lab 4 va de 0 a 15) o se salen del lienzo, se escalan para que se vean.
2. **Planos por autor**: se escribe el autor (con sugerencias de los autores conocidos), `Get blueprints` despacha `fetchByAuthor` y la tabla muestra nombre, número de puntos y `Open`, más el total de puntos del autor.
3. **Abrir un plano**: `Open` despacha `fetchBlueprint`. El campo de texto _Current blueprint_ se actualiza desde Redux y el canvas dibuja los segmentos consecutivos y marca cada punto (el primero en verde).
4. **`apimock` y `apiclient`**: ambos exponen `getAll`, `getByAuthor`, `getByAuthorAndName` y `create` (más `update` y `remove`). `blueprintsService.js` elige uno u otro con una sola línea según `VITE_USE_MOCK`.
5. **Interfaz React**: el nombre del plano actual sale del estado global (`selectCurrentName`). No se manipula el DOM directamente; el canvas usa `ref` dentro de `useEffect`.
6. **Estilos**: CSS propio con variables, modo claro/oscuro (se recuerda la elección) y diseño responsive. La tabla, los botones y las tarjetas siguen el mock de referencia.
7. **Pruebas**: 73 pruebas con Vitest + Testing Library en `tests/`:
   - Render del canvas, dibujo de segmentos y puntos, clic para agregar puntos.
   - Envío y validación del formulario.
   - `dispatch` de `fetchByAuthor` desde la página, tabla y `Open`.
   - Reducers puros, updates optimistas con reversión y selectores memoizados.
   - Interceptores JWT, `PrivateRoute`, login y conmutación mock/API.

### Verificación

- `npm run lint`, `npm run format:check`, `npm test` y `npm run build` pasan; el workflow de CI ejecuta los cuatro.
- El store y los servicios se probaron contra el backend real del Lab 4:
  - Sin token → 401 → banner.
  - Login inválido y válido.
  - Listado, autor inexistente → lista vacía, plano individual.
  - Creación y duplicado → error del backend.
  - PUT reemplaza los puntos y DELETE elimina el plano; si el servidor falla, el cambio optimista se revierte.
  - Token inválido → el interceptor cierra la sesión.

---

## 📸 Evidencias

Capturas tomadas con el front y el backend del Lab 4 corriendo en Docker (`apiclient`), salvo la sección 7, que compara ambos modos.

| #   | Evidencia                                                       | Requerimiento                       |
| --- | --------------------------------------------------------------- | ----------------------------------- |
| 1   | [Despliegue con Docker](#1-despliegue-con-docker)               | Docker (opcional)                   |
| 2   | [Seguridad con JWT](#2-seguridad-con-jwt)                       | JWT, interceptores y `PrivateRoute` |
| 3   | [Listar y graficar planos](#3-listar-y-graficar-planos)         | Req. 1, 2, 3 y 5                    |
| 4   | [Top 5 por número de puntos](#4-top-5-por-número-de-puntos)     | Selectores memoizados               |
| 5   | [Crear un plano dibujando](#5-crear-un-plano-dibujando)         | Dibujo interactivo y botón Guardar  |
| 6   | [Editar y eliminar](#6-editar-y-eliminar)                       | CRUD completo (`PUT` / `DELETE`)    |
| 7   | [Cambio entre mock y API real](#7-cambio-entre-mock-y-api-real) | Req. 4                              |
| 8   | [Estilos y diseño responsive](#8-estilos-y-diseño-responsive)   | Req. 6, dark mode y responsive      |
| 9   | [Pruebas, lint y build](#9-pruebas-lint-y-build)                | Req. 7                              |
| 10  | [Integración continua](#10-integración-continua)                | CI con GitHub Actions               |

### 1. Despliegue con Docker

`docker compose ps`: el front (nginx) y el backend del Lab 4 arriba, con el backend en estado `healthy`.

<p align="center">
  <img alt="docker compose ps" src="https://github.com/user-attachments/assets/ae70348c-dbd9-4e15-a94e-e92bb427b9d6" />
</p>

### 2. Seguridad con JWT

Sin sesión, el backend responde `401` y la UI muestra el error con el botón **Reintentar**:

<p align="center">
  <img width="85%" alt="Acceso no autorizado" src="https://github.com/user-attachments/assets/857ba411-10b7-4c4d-a2a0-a0c64a947f7e" />
</p>

`PrivateRoute`: al entrar a **Nuevo** sin sesión, redirige al login:

<p align="center">
  <img width="85%" alt="Ruta protegida" src="https://github.com/user-attachments/assets/bb7bbdb5-08a3-4fb8-afe8-4855d11b72b8" />
</p>

<table>
  <tr>
    <th width="50%">Login: el backend entrega el <code>access_token</code></th>
    <th width="50%">Interceptor: agrega <code>Authorization: Bearer …</code></th>
  </tr>
  <tr>
    <td><img alt="Access token" src="https://github.com/user-attachments/assets/0a78e824-9459-4443-91fd-6868a0495017" /></td>
    <td><img alt="Request headers" src="https://github.com/user-attachments/assets/d169a9c8-7989-4e46-85ac-9cc469298943" /></td>
  </tr>
</table>

### 3. Listar y graficar planos

<table>
  <tr>
    <th width="50%">Req. 2: tabla de planos de <code>john</code> (nombre, puntos, Open y total)</th>
    <th width="50%">Req. 1, 3 y 5: <code>Open</code> actualiza <i>Current blueprint</i> (Redux) y dibuja el plano en el canvas</th>
  </tr>
  <tr>
    <td><img alt="Tabla de blueprints de john" src="https://github.com/user-attachments/assets/24dcc6ae-2783-497c-ad37-7ad9d3bce942" /></td>
    <td><img alt="Blueprint house en el canvas" src="https://github.com/user-attachments/assets/f98ebf6e-5f4f-4de7-bbea-d797f01cba27" /></td>
  </tr>
</table>

### 4. Top 5 por número de puntos

Se calcula con un selector memoizado (`createSelector`) sobre el catálogo completo.

<p align="center">
  <img alt="Top 5" src="https://github.com/user-attachments/assets/898368d2-11ca-4e6c-ab33-4d70fda55762" />
</p>

### 5. Crear un plano dibujando

<table>
  <tr>
    <th width="50%">Los puntos se agregan con clics sobre el lienzo</th>
    <th width="50%">Tras <b>Guardar</b>, el plano aparece en la tabla de <code>student</code></th>
  </tr>
  <tr>
    <td><img alt="Blueprint nuevo" src="https://github.com/user-attachments/assets/a96acbdc-0b9d-4574-9a35-ac5305ce915b" /></td>
    <td><img alt="Nuevo plano de student" src="https://github.com/user-attachments/assets/5c778a29-445b-49e8-b426-cac84f792f71" /></td>
  </tr>
</table>

### 6. Editar y eliminar

Operaciones con actualización optimista contra los endpoints agregados al Lab 4.

<table>
  <tr>
    <th width="50%">Edición (<code>PUT</code>): nuevos puntos del plano</th>
    <th width="50%">Eliminación (<code>DELETE</code>): el plano desaparece de la tabla</th>
  </tr>
  <tr>
    <td><img alt="Blueprint editado" src="https://github.com/user-attachments/assets/a47e6677-258d-46aa-a343-a3c1be2d44fa" /></td>
    <td><img alt="Blueprint eliminado" src="https://github.com/user-attachments/assets/12287d0b-83e3-4775-a014-0f575547a3a7" /></td>
  </tr>
</table>

### 7. Cambio entre mock y API real

Cambiando una sola línea del `.env`, `blueprintsService.js` usa uno u otro servicio. El distintivo del encabezado indica cuál está activo.

<table>
  <tr>
    <th width="50%"><code>VITE_USE_MOCK=true</code> → <code>apimock</code></th>
    <th width="50%"><code>VITE_USE_MOCK=false</code> → <code>apiclient</code></th>
  </tr>
  <tr>
    <td><img alt="Modo mock" src="https://github.com/user-attachments/assets/5dccab74-f0f0-47f9-9c27-5e1785479cb6" /></td>
    <td><img alt="Modo API real" src="https://github.com/user-attachments/assets/3cb86b4b-9756-422b-be33-206c361a5866" /></td>
  </tr>
</table>

### 8. Estilos y diseño responsive

El modo oscuro es el de las capturas anteriores. El botón ☀/☾ alterna el tema y la elección se recuerda.

<table>
  <tr>
    <th width="65%">Modo claro</th>
    <th width="35%">Vista móvil (iPhone 12)</th>
  </tr>
  <tr>
    <td><img alt="Modo claro" src="https://github.com/user-attachments/assets/e3458350-3678-4b89-81ae-89778da18301" /></td>
    <td><img alt="Vista responsive" src="https://github.com/user-attachments/assets/5d0c517e-04fc-46a2-997e-d92677b24982" /></td>
  </tr>
</table>

### 9. Pruebas, lint y build

Los mismos comandos que ejecuta el workflow de GitHub Actions.

| Comando         | Resultado                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm test`      | <img alt="npm test" src="https://github.com/user-attachments/assets/b095529a-7d5c-443a-9453-55b9670938de" />      |
| `npm run lint`  | <img alt="npm run lint" src="https://github.com/user-attachments/assets/76e74ef8-9e2c-4653-bd0f-98e6ba02d070" />  |
| `npm run build` | <img alt="npm run build" src="https://github.com/user-attachments/assets/abbce1a4-1c82-4df8-9f73-b9dab6a8d103" /> |

### 10. Integración continua

El workflow `node-ci` de GitHub Actions corre en cada push y pull request: `npm ci`, lint, formato, pruebas y build, todos en verde.

<p align="center">
  <img alt="Workflow node-ci en verde" src="https://github.com/user-attachments/assets/86389579-db13-47d3-a3e6-665b7307e564" />
</p>
