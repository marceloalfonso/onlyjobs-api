import z from 'zod';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function updateMessage(app: FastifyTypedInstance) {
  app.patch(
    '/messages/:messageId',
    {
      preHandler: [auth],
      schema: {
        description: 'Update the message read status',
        tags: ['messages'],
        params: z.object({
          messageId: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
          403: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { messageId } = request.params;

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
          chatId: true,
          senderId: true,
          read: true,
          chat: {
            select: {
              userIds: true,
            },
          },
        },
      });

      if (!message) {
        return reply.code(404).send({ message: 'Message not found' });
      }

      if (message.read) {
        return reply
          .code(400)
          .send({ message: 'Message is already marked as read' });
      }

      if (!message.chat.userIds.includes(userId)) {
        return reply
          .code(403)
          .send({ message: 'Not authorized to update this message' });
      }

      if (message.senderId === userId) {
        return reply
          .code(400)
          .send({ message: 'Cannot mark your own message as read' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.message.update({
          where: { id: messageId },
          data: {
            read: true,
          },
        });

        await tx.chat.update({
          where: { id: message.chatId },
          data: {},
        });
      });

      return reply
        .code(200)
        .send({ message: 'Message read status updated successfully' });
    }
  );
}
