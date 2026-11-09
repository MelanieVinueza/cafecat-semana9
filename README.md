# CaféCat · CRUD de productos · Semana 9

Implementación de la organización 9.2.7 y del CRUD de Producto hasta 9.3.9 del material de clase. Node.js + Express, módulos ES (`import`/`export`) y persistencia JSON.

## Abrir en Visual Studio Code

Abre esta carpeta **Estructura** con Archivo > Abrir carpeta. En Terminal > Nueva terminal:

```powershell
npm.cmd ci
npm.cmd start
```

Abre http://localhost:3000/api/productos (empieza vacío). También puedes pulsar **F5 > Iniciar CafeCat** después de instalar dependencias. Detener: Ctrl+C.

```powershell
npm.cmd run dev
npm.cmd test
```

`dev` reinicia al guardar; `test` verifica el CRUD automáticamente. En Windows usamos `npm.cmd` para evitar restricciones de scripts PowerShell; en Linux/macOS usa `npm`.

## Comandos de preparación

El código usa los ejemplos del PDF: `import express from "express"`, `express.json()`, `app.listen(3000)` y `router.get/post/put/delete`. El equivalente de preparación desde cero es:

```powershell
mkdir Estructura
cd Estructura
npm.cmd init -y
npm.cmd install express
```

Esta entrega ya incluye package.json, `type: module`, scripts y package-lock.json. Para ejecutarla usa `npm.cmd ci`, sin repetir la creación.

## Organización

```text
Estructura/
  .github/workflows/ci.yml
  .vscode/launch.json
  .gitignore
  package.json
  package-lock.json
  peticiones.http
  test/productos.test.js
  server/
    server.js
    routes/
      productos.js
      pedidos.js
      usuarios.js
      auth.js
    controllers/
      productos.controller.js
      pedidos.controller.js
      usuarios.controller.js
      auth.controller.js
    models/
      productos.model.js
      pedidos.model.js
      usuarios.model.js
    data/
      productos.json
      pedidos.json
      usuarios.json
```

Rutas: métodos y endpoints. Controladores: validaciones, reglas y respuestas HTTP. Modelo: lectura y escritura JSON. Se conservan pedidos, usuarios y auth como archivos de estructura de 9.2.7; **el módulo funcional de este alcance es Producto**. Los demás no están registrados como endpoints.

## API de productos

| Método | Ruta | Resultado |
|---|---|---|
| POST | /api/productos | Crear, 201 |
| GET | /api/productos?page=1&limit=20 | Listar con total y paginación, 200 |
| GET | /api/productos/:id | Consultar, 200 / 404 |
| PUT | /api/productos/:id | Reemplazar, 200 / 404 |
| PATCH | /api/productos/:id | Modificar campos, 200 / 404 |
| DELETE | /api/productos/:id | Eliminar, 200 / 404 |

Producto: `id` generado por servidor; `nombre` obligatorio (hasta 120 caracteres); `precio` numérico > 0; `stock` entero >= 0; `descripcion` opcional (hasta 1000 caracteres). Se incluye `categoria` obligatoria (hasta 80 caracteres) porque 9.3.5 pide validarla. El PDF no especifica catálogo: se acepta texto no vacío.

PUT exige todos los campos obligatorios; PATCH conserva los campos omitidos. El cliente no puede elegir ni cambiar el ID. Datos inválidos: 400; nombre duplicado sin distinguir mayúsculas: 409; recurso inexistente: 404; cuerpo mayor de 16 KB: 413. Respuestas JSON con `status`, `data` o `message`.

## Probar desde PowerShell

Con el servidor activo, abre otra terminal:

```powershell
$base = 'http://localhost:3000/api/productos'
$body = @{ nombre='Café Espresso'; precio=9.9; stock=10; categoria='Cafés'; descripcion='Café caliente' } | ConvertTo-Json
$creado = Invoke-RestMethod -Method Post -Uri $base -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$productoId = $creado.data.id
Invoke-RestMethod -Uri $base
Invoke-RestMethod -Uri "$base/$productoId"
$cambio = @{ nombre='Café Latte'; precio=12.5; stock=8; categoria='Cafés'; descripcion='Café con leche' } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "$base/$productoId" -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($cambio))
Invoke-RestMethod -Method Patch -Uri "$base/$productoId" -ContentType 'application/json' -Body '{"stock":7}'
Invoke-RestMethod -Method Delete -Uri "$base/$productoId"
```

`peticiones.http` contiene los mismos ejemplos para un cliente HTTP compatible (REST Client, extensión opcional) o para copiar a Postman. Ajusta el ID al devuelto por POST.

## Persistencia y pruebas

Los datos se conservan en server/data/productos.json después de reiniciar. La ruta se resuelve desde el módulo. Se escribe primero un temporal y se renombra para evitar JSON incompleto. Se registra método, ruta y estado HTTP sin registrar cuerpos sensibles.

`npm test` crea datos aislados y un servidor HTTP temporal. Comprueba el ciclo CRUD completo, persistencia en disco, duplicados, validaciones, PUT completo, PATCH parcial, ID inmutable, paginación, 404, JSON malformado y límite del cuerpo. No modifica los JSON reales.

## GitHub Actions

El código se guarda en un repositorio; **Actions ejecuta las pruebas, no aloja permanentemente la API**. El flujo .github/workflows/ci.yml usa Node 24, `npm ci` y `npm test` con cada push a main, pull request o ejecución manual.

Para cambios posteriores desde la terminal de VS Code, una vez configurado el remoto:

```powershell
git add .
git commit -m "Actualizar CRUD de productos"
git push
```

Revisa los resultados en **Actions** del repositorio.

## Límites

API académica local sin autenticación: no exponer directamente a Internet. JSON está previsto para un proceso y pocos datos; migrar a una BD para concurrencia entre procesos, como propone la semana 11. No incluye frontend ni desarrolla las secciones posteriores a 9.3.9. Puerto predeterminado: 3000; configurable con PORT.

Referencias: [Express](https://expressjs.com/en/starter/installing/), [setup-node](https://github.com/actions/setup-node), [checkout](https://github.com/actions/checkout).
