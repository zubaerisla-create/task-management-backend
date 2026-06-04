import { z } from 'zod';

const createTaskValidationSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid due date format',
  }).refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(val) >= today;
  }, {
    message: 'Please select a valid deadline',
  }),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID format'),
  assignedMemberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID format').optional(),
});

const updateTaskValidationSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid due date format',
  }).refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(val) >= today;
  }, {
    message: 'Please select a valid deadline',
  }).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID format').optional(),
  assignedMemberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID format').nullable().optional(),
});

export const taskValidation = {
  createTaskValidationSchema,
  updateTaskValidationSchema,
};
