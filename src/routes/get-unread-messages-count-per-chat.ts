import z from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function getUnreadMessagesCountPerChat(app: FastifyTypedInstance) {
  app.get(
    '/messages/unread',
    {
      preHandler: [auth],
      schema: {
        description: 'Get how many unread messages there are per chat',
        tags: ['messages'],
        response: {
          200: z.array(
            z.object({
              chatId: z.string(),
              unreadMessagesCount: z.number(),
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
        select: { chatIds: true },
      });

      if (!user) {
        return reply.code(404).send({ message: 'Usuário não encontrado' });
      }

      const messagesGroups = await prisma.message.groupBy({
        by: ['chatId'],
        where: {
          chatId: { in: user.chatIds },
          senderId: { not: userId },
          read: false,
        },
        _count: {
          id: true,
        },
      });

      return reply.code(200).send(
        messagesGroups.map((messagesGroup) => ({
          chatId: messagesGroup.chatId,
          unreadMessagesCount: messagesGroup._count.id,
        }))
      );
    }
  );
}
