import { z } from 'zod';
import dayjs from '../lib/dayjs';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function getUserReceivedLikes(app: FastifyTypedInstance) {
  app.get(
    '/likes/received',
    {
      preHandler: [auth],
      schema: {
        description: 'Get likes received by authenticated user',
        tags: ['likes'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              createdAt: z.string(),
              fromUser: z.object({
                id: z.string(),
                profile: z.record(z.any()),
              }),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;

      const likes = await prisma.like.findMany({
        where: {
          toUserId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          fromUser: {
            select: {
              id: true,
              profile: true,
            },
          },
        },
      });

      return reply.code(200).send(
        likes.map((like) => ({
          ...like,
          createdAt: dayjs(like.createdAt).format('DD/MM/YY - HH:mm:ss'),
          fromUser: {
            ...like.fromUser,
            profile: like.fromUser.profile as Record<string, any>,
          },
        }))
      );
    }
  );
}
