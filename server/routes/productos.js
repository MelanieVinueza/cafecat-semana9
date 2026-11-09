import { Router } from 'express';
import { listarProductos, detalleProducto, crearProducto, actualizarProducto, modificarProducto, eliminarProducto } from '../controllers/productos.controller.js';

const router = Router();
router.get('/', listarProductos);
router.get('/:id', detalleProducto);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id', modificarProducto);
router.delete('/:id', eliminarProducto);
export default router;
