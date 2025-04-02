import z from 'zod';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function getNotLikedUsers(app: FastifyTypedInstance) {
  app.get(
    '/users/not-liked',
    {
      preHandler: [auth],
      schema: {
        description: 'Get users that have not been liked yet',
        tags: ['users'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              profile: z.record(z.any()),
            })
          ),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          sentLikes: {
            select: { toUserId: true },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ message: 'Usuário não encontrado' });
      }

      const likedUserIds = user.sentLikes.map((sentLike) => sentLike.toUserId);

      const notLikedUsers = await prisma.user.findMany({
        where: {
          AND: [
            { NOT: { id: userId } },
            { NOT: { role: user.role } },
            { NOT: { id: { in: likedUserIds } } },
          ],
        },
        select: {
          id: true,
          name: true,
          profile: true,
        },
      });

      return reply.code(200).send(
        notLikedUsers.map((notLikedUser) => ({
          ...notLikedUser,
          profile: notLikedUser.profile as Record<string, any>,
        }))
      );
    }
  );
}
