import { z } from 'zod';
import prisma from '../lib/prisma';
import { FastifyTypedInstance } from '../types';

export async function getUsers(app: FastifyTypedInstance) {
  app.get(
    '/users',
    {
      schema: {
        description: 'Get all users',
        tags: ['users'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              role: z.string(),
              profile: z.record(z.any()).optional(),
              chatIds: z.array(z.string()),
              createdAt: z.string(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: true,
          chatIds: true,
          createdAt: true,
        },
      });

      return reply.code(200).send(
        users.map((user) => ({
          ...user,
          profile: user.profile as Record<string, any>,
          createdAt: user.createdAt.toISOString(),
        }))
      );
    }
  );
}
