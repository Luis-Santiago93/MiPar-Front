# MiPar Front

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Para verificar la compilación: `npm run build`.

Backoffice: `http://localhost:3000/admin`. En desarrollo, entra con usuario `admin` y contraseña `mipar123`. Puedes reemplazarlos mediante `NUXT_ADMIN_USER` y `NUXT_ADMIN_PASSWORD`. En una compilación de producción ambas variables son obligatorias para iniciar sesión.

## Despliegue en Vercel

Nuxt se detecta automáticamente en Vercel. Esta versión simulada no debe usarse para ventas reales: las sesiones, pedidos e inventario viven en memoria y pueden variar entre instancias o perderse. Conectar FastAPI y una base de datos antes de publicarla para clientes.

## Alcance actual

- Catálogo y rutas de producto compartibles (`/p/:slug`).
- Selección de color y talla según existencias de ejemplo.
- Bolsa conservada al recargar la pestaña y cálculo de subtotal.
- Zonas, fechas, horarios y costos de entrega ilustrativos.
- Checkout completo de demostración con nombre, teléfono, dirección, cotización y folio de pedido.
- Login de demostración y backoffice en `/admin` para productos, imágenes, variantes, zonas y pedidos.
- Almacén con existencias por modelo, color y talla; dashboard de ventas por día.
- Opción de marcar un pedido como vendido. El dashboard cuenta únicamente ventas concretadas.
- Solicitudes de calzado para tallas agotadas y modelos marcados como **solo solicitud**. Se registran con folio y teléfono, se gestionan por separado en el backoffice y no cuentan como venta ni descuentan inventario.

Los modelos, fotos, precios y existencias son de muestra. La tienda ahora consume servicios REST simulados desde `server/api`, con datos en `server/data`. Para conectar FastAPI después, se conservarán los contratos y se cambiará la fuente de esos endpoints.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/products` | Catálogo y variantes |
| GET | `/api/products/:slug` | Detalle de producto; 404 si no existe |
| GET | `/api/delivery/zones` | Cobertura, costo y fechas disponibles |
| POST | `/api/orders/quote` | Valida variantes, existencias, zona y fecha; devuelve subtotal, envío y total |
| POST | `/api/orders` | Registra pedido de prueba y descuenta existencias en memoria |
| POST | `/api/product-requests` | Registra una solicitud de modelo o talla no disponible, sin venta ni reserva |
| GET/PATCH | `/api/admin/product-requests`, `/api/admin/product-requests/:id` | Consulta y da seguimiento a solicitudes |
| GET/PATCH | `/api/admin/orders`, `/api/admin/orders/:id` | Consulta pedidos y cambia su estado |
| POST/GET | `/api/admin/login`, `/api/admin/session` | Inicia y consulta la sesión de administración |
| GET | `/api/admin/inventory`, `/api/admin/dashboard` | Existencias y ventas por día |
| PUT/DELETE | `/api/admin/products/:id` | Crea, edita o elimina productos |
| GET/PUT | `/api/admin/zones`, `/api/admin/zones/:id` | Consulta y configura zonas |

Ejemplo para `POST /api/orders/quote`:

```json
{"items":[{"productId":"urbano-uno","color":"Marfil","size":25,"quantity":1}],"zoneId":"centro","deliveryDate":"AAAA-MM-DD","deliveryTime":"10:00"}
```

La fecha y la hora puntual deben coincidir con las disponibles para la zona en `/api/delivery/zones`. El backoffice permite configurar varias horas por zona. Las imágenes se entregan como URL en el producto (`image`); el backoffice permite pegar una URL o elegir un archivo de prueba de hasta 700 KB.

**Límite importante de la maqueta:** el login usa sesiones en memoria; los datos también se guardan solo en la memoria del proceso Nuxt. Se pierden al reiniciar el servidor y no son aptos para operar una tienda pública en Vercel. Antes de publicar para clientes reales hay que conectar FastAPI, almacenamiento de imágenes, base de datos y autenticación persistente para administradores. Los tres modelos adicionales reutilizan temporalmente la imagen de muestra del primer par.
