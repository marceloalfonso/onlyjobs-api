import { hashSync } from 'bcrypt';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function updateUser(app: FastifyTypedInstance) {
  app.patch(
    '/users',
    {
      preHandler: [auth],
      schema: {
        description: 'Update authenticated user account',
        tags: ['users'],
        body: z.object({
          name: z.string().optional(),
          password: z.string().optional(),
          profile: z.record(z.any()).optional(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { name, password, profile } = request.body;

      if (Object.keys(request.body).length === 0) {
        return reply.code(400).send({
          message: 'At least one field must be provided for update',
        });
      }

      const dataToBeUpdated: Record<string, any> = {};

      if (name !== undefined) {
        dataToBeUpdated.name = name;
      }

      if (password !== undefined) {
        dataToBeUpdated.password = hashSync(password, 10);
      }

      if (profile !== undefined) {
        dataToBeUpdated.profile = profile;
      }

      await prisma.user.update({
        where: { id: userId },
        data: dataToBeUpdated,
      });

      return reply.code(200).send({ message: 'User updated successfully' });
    }
  );
}
