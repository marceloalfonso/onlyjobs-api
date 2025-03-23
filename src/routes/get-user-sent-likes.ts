import { z } from 'zod';
import dayjs from '../lib/dayjs';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function getUserSentLikes(app: FastifyTypedInstance) {
  app.get(
    '/likes/sent',
    {
      preHandler: [auth],
      schema: {
        description: 'Get likes sent by authenticated user',
        tags: ['likes'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              createdAt: z.string(),
              toUser: z.object({
                id: z.string(),
                name: z.string(),
                profile: z.record(z.any()),
              }),
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

      const likes = await prisma.like.findMany({
        where: {
          fromUserId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          toUser: {
            select: {
              id: true,
              name: true,
              profile: true,
            },
          },
        },
      });

      return reply.code(200).send(
        likes.map((like) => ({
          ...like,
          createdAt: dayjs(like.createdAt).format('DD/MM/YY - HH:mm:ss'),
          toUser: {
            ...like.toUser,
            profile: like.toUser.profile as Record<string, any>,
          },
        }))
      );
    }
  );
}
