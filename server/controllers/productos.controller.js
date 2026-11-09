import { ProductoModel } from '../models/productos.model.js';

const campos = ['nombre', 'precio', 'stock', 'descripcion', 'categoria'];
const fail = (res, code, message) => res.status(code).json({ status: 'fail', message });

function obtenerId(req, res) {
  const id = Number(req.params.id);
  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id <= 0) {
    fail(res, 400, 'El ID debe ser un entero positivo');
    return null;
  }
  return id;
}

function validar(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Envía un objeto JSON';
  if (Object.keys(data).some(key => !campos.includes(key))) return 'Hay campos desconocidos; el ID lo genera el servidor';
  if (typeof data.nombre !== 'string' || !data.nombre.trim() || data.nombre.length > 120) return 'nombre es obligatorio (máximo 120 caracteres)';
  if (typeof data.precio !== 'number' || !Number.isFinite(data.precio) || data.precio <= 0) return 'precio debe ser un número mayor que cero';
  if (!Number.isSafeInteger(data.stock) || data.stock < 0) return 'stock debe ser un entero mayor o igual a cero';
  if (typeof data.categoria !== 'string' || !data.categoria.trim() || data.categoria.length > 80) return 'categoria es obligatoria (máximo 80 caracteres)';
  if (data.descripcion !== undefined && (typeof data.descripcion !== 'string' || data.descripcion.length > 1000)) return 'descripcion debe ser texto (máximo 1000 caracteres)';
  return null;
}

function normalizar(data) {
  return { nombre: data.nombre.trim(), precio: data.precio, stock: data.stock, categoria: data.categoria.trim(), descripcion: (data.descripcion || '').trim() };
}

function duplicado(data, id) {
  return ProductoModel.getAll().some(p => p.id !== id && p.nombre.toLocaleLowerCase() === data.nombre.trim().toLocaleLowerCase());
}

export function listarProductos(req, res) {
  const { page = '1', limit = '20' } = req.query;
  if (typeof page !== 'string' || typeof limit !== 'string' || !/^\d+$/.test(page) || !/^\d+$/.test(limit) || !Number.isSafeInteger(Number(page)) || Number(page) < 1 || Number(limit) < 1 || Number(limit) > 100) {
    return fail(res, 400, 'page debe ser un entero positivo y limit un entero entre 1 y 100');
  }
  const productos = ProductoModel.getAll();
  const inicio = (Number(page) - 1) * Number(limit);
  res.json({ status: 'success', data: productos.slice(inicio, inicio + Number(limit)), pagination: { page: Number(page), limit: Number(limit), total: productos.length } });
}

export function detalleProducto(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;
  const producto = ProductoModel.getById(id);
  if (!producto) return fail(res, 404, 'Producto no encontrado');
  res.json({ status: 'success', data: producto });
}

export function crearProducto(req, res) {
  const error = validar(req.body);
  if (error) return fail(res, 400, error);
  if (duplicado(req.body)) return fail(res, 409, 'Ya existe un producto con ese nombre');
  const producto = ProductoModel.create(normalizar(req.body));
  res.status(201).location(`/api/productos/${producto.id}`).json({ status: 'created', data: producto });
}

function actualizar(req, res, parcial) {
  const id = obtenerId(req, res);
  if (id === null) return;
  const existente = ProductoModel.getById(id);
  if (!existente) return fail(res, 404, 'Producto no encontrado');
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some(key => !campos.includes(key))) {
    return fail(res, 400, 'Envía campos válidos de producto; no se permite modificar el ID');
  }
  const { id: _, ...anterior } = existente;
  const data = parcial ? { ...anterior, ...body } : body;
  const error = validar(data);
  if (error) return fail(res, 400, error);
  if (duplicado(data, id)) return fail(res, 409, 'Ya existe un producto con ese nombre');
  const updated = ProductoModel.update(id, normalizar(data));
  res.status(200).json({ status: 'updated', data: updated });
}

export function actualizarProducto(req, res) { return actualizar(req, res, false); }
export function modificarProducto(req, res) { return actualizar(req, res, true); }

export function eliminarProducto(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;
  const producto = ProductoModel.delete(id);
  if (!producto) return fail(res, 404, 'Producto no encontrado');
  res.status(200).json({ status: 'deleted', data: producto });
}
