import { z } from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function updateUserName(app: FastifyTypedInstance) {
  app.patch(
    '/users/name',
    {
      preHandler: [auth],
      schema: {
        description: 'Update authenticated user name',
        tags: ['users'],
        body: z.object({
          name: z.string(),
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
      const { name } = request.body;

      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });

      return reply
        .code(200)
        .send({ message: 'Nome de usuário atualizado com sucesso' });
    }
  );
}
