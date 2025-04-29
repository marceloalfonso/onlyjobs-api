import { z } from 'zod';
import dayjs from '../lib/dayjs';
import prisma from '../lib/prisma';
import { FastifyTypedInstance } from '../types';

export async function getCandidates(app: FastifyTypedInstance) {
  app.get(
    '/users/candidates',
    {
      schema: {
        description: 'Get users with "CANDIDATE" role',
        tags: ['users'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              role: z.string(),
              profile: z.record(z.any()),
              chatIds: z.array(z.string()),
              createdAt: z.string(),
              updatedAt: z.string(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const users = await prisma.user.findMany({
        where: {
          role: 'CANDIDATE',
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

      return reply.code(200).send(
        users.map((user) => ({
          ...user,
          profile: user.profile as Record<string, any>,
          createdAt: dayjs(user.createdAt)
            .tz('America/Sao_Paulo')
            .format('DD/MM/YY - HH:mm:ss'),
          updatedAt: dayjs(user.updatedAt)
            .tz('America/Sao_Paulo')
            .format('DD/MM/YY - HH:mm:ss'),
        }))
      );
    }
  );
}
