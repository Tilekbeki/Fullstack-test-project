import { Router } from 'express';
import { responsibleController as c } from '../controllers/responsibles';
import { asyncHandler } from '../lib/http';

export const responsibleRoutes = Router();
responsibleRoutes.get('/', asyncHandler(c.list));
responsibleRoutes.post('/', asyncHandler(c.create));
responsibleRoutes.put('/:id', asyncHandler(c.update));
responsibleRoutes.delete('/:id', asyncHandler(c.remove));
