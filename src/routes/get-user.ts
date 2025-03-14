import { z } from 'zod';
import prisma from '../lib/prisma';
import { FastifyTypedInstance } from '../types';

export async function getUser(app: FastifyTypedInstance) {
  app.get(
    '/users/:userId',
    {
      schema: {
        description: 'Get user by ID',
        tags: ['users'],
        params: z.object({
          userId: z.string(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.string(),
            profile: z.record(z.any()),
            chatIds: z.array(z.string()),
            createdAt: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params;

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
        },
      });

      if (!user) {
        return reply.code(404).send({
          message: 'User not found',
        });
      }

      return reply.code(200).send({
        ...user,
        profile: user.profile as Record<string, any>,
        createdAt: user.createdAt.toISOString(),
      });
    }
  );
}
