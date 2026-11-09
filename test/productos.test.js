import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const dir = mkdtempSync(join(tmpdir(), 'cafecat-test-'));
process.env.CAFECAT_DATA_DIR = dir;
writeFileSync(join(dir, 'productos.json'), '[]');
let server, base;
before(async () => {
  const { app } = await import('../server/server.js');
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api/productos`;
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  rmSync(dir, { recursive: true, force: true });
});
async function request(method = 'GET', path = '', body) {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { code: response.status, body: await response.json() };
}
const producto = { nombre: 'Café Espresso', precio: 9.9, stock: 10, categoria: 'Cafés', descripcion: 'Caliente' };

test('CRUD completo por HTTP y persistencia en JSON', async () => {
  const created = await request('POST', '', producto);
  assert.equal(created.code, 201);
  const id = created.body.data.id;
  assert.equal(created.body.status, 'created');
  assert.equal(JSON.parse(readFileSync(join(dir, 'productos.json'), 'utf8'))[0].nombre, producto.nombre);
  assert.deepEqual((await request('GET', `/${id}`)).body.data, { ...producto, id });
  assert.equal((await request()).body.data.length, 1);
  assert.equal((await request('POST', '', producto)).code, 409);
  const updated = await request('PUT', `/${id}`, { ...producto, nombre: 'Café Latte', precio: 12.5 });
  assert.equal(updated.code, 200);
  assert.equal(updated.body.data.precio, 12.5);
  assert.equal((await request('PATCH', `/${id}`, { stock: 7 })).body.data.stock, 7);
  assert.equal((await request('GET', '?page=2&limit=1')).body.data.length, 0);
  assert.equal((await request('DELETE', `/${id}`)).code, 200);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'productos.json'), 'utf8')), []);
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal((await request(method, `/${id}`, ['PUT', 'PATCH'].includes(method) ? producto : undefined)).code, 404);
  }
});

test('rechaza campos, IDs y paginación inválidos', async () => {
  for (const change of [{ nombre: '' }, { precio: 0 }, { precio: '9' }, { stock: -1 }, { stock: 0.5 }, { categoria: '' }, { descripcion: 3 }, { id: 99 }]) {
    assert.equal((await request('POST', '', { ...producto, ...change })).code, 400);
  }
  for (const body of [null, [], {}, 'texto']) assert.equal((await request('POST', '', body)).code, 400);
  for (const id of ['0', '-1', 'abc', '1.5', '9007199254740992']) assert.equal((await request('GET', `/${id}`)).code, 400);
  for (const query of ['?page=0', '?limit=101', '?page=x', '?limit=1.5', '?page=1&page=2']) {
    assert.equal((await request('GET', query)).code, 400);
  }
});

test('PUT exige reemplazo completo y PATCH conserva campos e ID', async () => {
  const { body } = await request('POST', '', { ...producto, nombre: 'Producto parcial' });
  const id = body.data.id;
  assert.equal((await request('PUT', `/${id}`, { stock: 1 })).code, 400);
  assert.equal((await request('PATCH', `/${id}`, { id: 123 })).code, 400);
  assert.equal((await request('PATCH', `/${id}`, {})).code, 400);
  const patched = await request('PATCH', `/${id}`, { stock: 3 });
  assert.deepEqual(patched.body.data, { ...body.data, stock: 3 });
  await request('DELETE', `/${id}`);
});

test('JSON malformado, límite del cuerpo y ruta desconocida responden JSON', async () => {
  const malformed = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).status, 'fail');
  assert.equal((await request('POST', '', { ...producto, descripcion: 'a'.repeat(17000) })).code, 413);
  const missing = await fetch(base.replace('/api/productos', '/inexistente'));
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).status, 'fail');
});
