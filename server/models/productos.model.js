import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(process.env.CAFECAT_DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url)), 'productos.json');

function load() {
  const productos = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(productos)) throw new Error('productos.json debe contener una lista');
  return productos;
}

function save(productos) {
  // shortcut: almacenamiento síncrono para un solo proceso; usar BD al escalar.
  writeFileSync(`${file}.tmp`, `${JSON.stringify(productos, null, 2)}\n`, 'utf8');
  renameSync(`${file}.tmp`, file);
}

export const ProductoModel = {
  getAll: load,
  getById(id) { return load().find(p => p.id === id) || null; },
  create(data) {
    const productos = load();
    const producto = { ...data, id: Math.max(0, ...productos.map(p => p.id)) + 1 };
    productos.push(producto);
    save(productos);
    return producto;
  },
  update(id, data) {
    const productos = load();
    const idx = productos.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const nuevo = { ...data, id };
    productos[idx] = nuevo;
    save(productos);
    return nuevo;
  },
  delete(id) {
    const productos = load();
    const idx = productos.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const [producto] = productos.splice(idx, 1);
    save(productos);
    return producto;
  }
};
