import { z } from 'zod';

const createProjectValidationSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }).refine((val) => new Date(val) > new Date(), {
    message: 'Deadline must be a future date',
  }),
  memberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID format')).optional(),
});

const updateProjectValidationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }).refine((val) => new Date(val) > new Date(), {
    message: 'Deadline must be a future date',
  }).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
  memberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID format')).optional(),
});

const manageMemberValidationSchema = z.object({
  memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member ID format'),
});

export const projectValidation = {
  createProjectValidationSchema,
  updateProjectValidationSchema,
  manageMemberValidationSchema,
};
