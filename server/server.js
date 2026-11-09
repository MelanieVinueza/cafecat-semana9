import express from 'express';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import productosRouter from './routes/productos.js';

export const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.on('finish', () => console.info(`${req.method} ${req.path} ${res.statusCode}`));
  next();
});
app.use(express.json({ limit: '16kb' }));
app.get('/', (req, res) => res.json({ status: 'success', message: 'CafeCat API', productos: '/api/productos' }));
app.use('/api/productos', productosRouter);
app.use((req, res) => res.status(404).json({ status: 'fail', message: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'fail', message: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ status: 'fail', message: 'El cuerpo supera 16 KB' });
  }
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.info(`CafeCat: http://localhost:${port}`));
}
