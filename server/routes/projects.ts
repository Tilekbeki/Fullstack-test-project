import { Router } from 'express';
import { projectController as c } from '../controllers/projects';
import { taskController as t } from '../controllers/tasks';
import { asyncHandler } from '../lib/http';

export const projectRoutes = Router();
projectRoutes.get('/', asyncHandler(c.list));
projectRoutes.get('/:id', asyncHandler(c.get));
projectRoutes.post('/', asyncHandler(c.create));
projectRoutes.put('/:id', asyncHandler(c.update));
projectRoutes.delete('/:id', asyncHandler(c.remove));
projectRoutes.get('/:projectId/tasks', asyncHandler(t.list));
projectRoutes.post('/:projectId/tasks', asyncHandler(t.create));
projectRoutes.put('/:projectId/tasks/:id', asyncHandler(t.update));
projectRoutes.delete('/:projectId/tasks/:id', asyncHandler(t.remove));
