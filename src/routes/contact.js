import { Hono } from 'hono';
import { contactController } from '../controllers/contactController.js';

const contactRoutes = new Hono();

contactRoutes.post('/contact', contactController);

export { contactRoutes };
