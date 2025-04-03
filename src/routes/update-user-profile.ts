import { z } from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function updateUserProfile(app: FastifyTypedInstance) {
  app.patch(
    '/users/profile',
    {
      preHandler: [auth],
      schema: {
        description: 'Update authenticated user profile',
        tags: ['users'],
        body: z.object({
          profile: z.record(z.any()),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { profile } = request.body;

      await prisma.user.update({
        where: { id: userId },
        data: { profile },
      });

      return reply.code(200).send({ message: 'Perfil atualizado com sucesso' });
    }
  );
}
