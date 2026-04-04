# GEMINI.md

Este archivo proporciona contexto e instrucciones para trabajar en el repositorio **crm-mex-fe**.

## Descripción del Proyecto
**crm-mex-fe** es una aplicación frontend de CRM diseñada para empresas mexicanas. Construida con **Next.js 15+ (App Router)** y **React 19**, la plataforma gestiona inventarios, pedidos, clientes y reportes de ventas con un enfoque en alto rendimiento y capacidades offline (PWA).

### Tecnologías Principales
- **Framework:** Next.js 15.2 (App Router)
- **Lenguaje:** TypeScript 5
- **Estado Global:** Zustand 5
- **Estilos:** Tailwind CSS 4 (usando variables dinámicas para branding)
- **Componentes:** Radix UI + Lucide Icons
- **Gráficos:** Recharts 3
- **Base de Datos Local (PWA):** Dexie (IndexedDB) para caché y cola de operaciones offline.
- **Comunicación:** REST API + Socket.io (para sincronización en tiempo real).

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 3001 por defecto)
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm run start

# Ejecutar linter (ESLint)
npm run lint
```

---

## Arquitectura del Código

### Estructura de Carpetas
- `app/`: Rutas y páginas de Next.js.
- `components/`: Componentes de UI.
  - `ui/`: Componentes base (Shadcn/ui).
  - `[feature]/`: Composiciones específicas por dominio (ej. `pedidos/`, `inventario/`).
- `services/`: Capa de servicios API.
  - `http-client.ts`: Wrapper central de `fetch` con soporte offline, refresco de tokens y caché.
  - `[domain]/`: Lógica de negocio por dominio (ej. `products.service.ts`, `products.types.ts`).
- `stores/`: Estados globales de Zustand (ej. `use-inventory-store.ts`).
- `lib/`: Contextos, hooks globales y utilidades.
  - `auth-context.tsx`: Gestión de JWT y permisos.
  - `offline/`: Lógica de sincronización e IndexedDB.
- `types/`: Definiciones de interfaces compartidas.

### Convenciones de Desarrollo
1. **Estado:** Usar suscripciones superficiales (shallow) de Zustand para evitar re-renders innecesarios.
2. **API:** Nunca usar `fetch` directamente; usar el cliente en `services/http-client.ts` que maneja automáticamente:
   - Encabezados de autenticación (Bearer Token).
   - Refresco de tokens (401).
   - Caché IndexedDB para peticiones GET.
   - Cola de operaciones para POST/PUT/DELETE si no hay conexión.
3. **Internacionalización:** Toda la UI y mensajes deben estar en **Español (México)**.
4. **Utilidades:**
   - `formatCurrency(n)`: Para moneda MXN.
   - `formatDate(d)` / `formatDateTime(d)`: Formatos locales.
   - `cn(...)`: Combinación de clases Tailwind (clsx + tailwind-merge).

### Sincronización en Tiempo Real
- Se usa `Socket.io` para notificaciones y cambios remotos.
- `lib/cross-tab-sync.ts`: Sincroniza estados entre pestañas abiertas del mismo navegador usando `BroadcastChannel`.

---

## Guía de Estilo y UI/UX
- **Diseño:** Limpio, profesional y responsivo.
- **Colores:** Se inyectan dinámicamente desde `lib/company-context.tsx` basándose en la configuración de la empresa. Usar variables CSS de Tailwind 4.
- **Animaciones:** Sutiles usando Framer Motion (transiciones de página y modales).
- **Validaciones:** Siempre incluir estados de error y carga (`loading`, `submitting`) en los formularios.

---

## Entidades Principales (`types/index.ts`)
- `User`: Administradores y vendedores.
- `Producto`: Incluye variaciones (talla, color), SKU y control de stock.
- `Pedido`: Gestión de estados (`cotizado`, `en_curso`, `enviado`, etc.).
- `Cliente`: Historial de compras y datos fiscales.
- `MovimientoInventario`: Auditoría de entradas/salidas de stock.
