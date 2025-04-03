import { hashSync } from 'bcrypt';
import { z } from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function updateUserPassword(app: FastifyTypedInstance) {
  app.patch(
    '/users/password',
    {
      preHandler: [auth],
      schema: {
        description: 'Update authenticated user password',
        tags: ['users'],
        body: z.object({
          password: z.string(),
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
      const { password } = request.body;

      const hash = hashSync(password, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hash },
      });

      return reply.code(200).send({ message: 'Senha atualizada com sucesso' });
    }
  );
}
