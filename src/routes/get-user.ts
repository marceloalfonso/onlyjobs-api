import { z } from 'zod';
import dayjs from '../lib/dayjs';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function getUser(app: FastifyTypedInstance) {
  app.get(
    '/users',
    {
      preHandler: [auth],
      schema: {
        description: '"Get authenticated user information"',
        tags: ['users'],
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.string(),
            profile: z.record(z.any()),
            chatIds: z.array(z.string()),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: true,
          chatIds: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          message: 'Usuário não encontrado.',
        });
      }

      return reply.code(200).send({
        ...user,
        profile: user.profile as Record<string, any>,
        createdAt: dayjs(user.createdAt)
          .tz('America/Sao_Paulo')
          .format('DD/MM/YY - HH:mm:ss'),
        updatedAt: dayjs(user.updatedAt)
          .tz('America/Sao_Paulo')
          .format('DD/MM/YY - HH:mm:ss'),
      });
    }
  );
}
