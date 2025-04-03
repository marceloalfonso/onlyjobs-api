import z from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function createMessage(app: FastifyTypedInstance) {
  app.post(
    '/messages/:chatId',
    {
      preHandler: [auth],
      schema: {
        description: 'Send message in the chat',
        tags: ['messages'],
        params: z.object({
          chatId: z.string(),
        }),
        body: z.object({
          content: z.string(),
        }),
        response: {
          201: z.object({
            messageId: z.string(),
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
      const { chatId } = request.params;
      const { content } = request.body;

      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { id: true, userIds: true },
      });

      if (!chat) {
        return reply.code(404).send({ message: 'Chat não encontrado' });
      }

      if (!chat.userIds.includes(userId)) {
        return reply.code(403).send({
          message: 'Você não tem permissão para enviar mensagens neste chat',
        });
      }

      const { message } = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            chatId,
            senderId: userId,
            content,
          },
        });

        await tx.chat.update({
          where: { id: chatId },
          data: {},
        });

        return { message };
      });

      app.io.to(`chat:${chatId}`).emit('new_message', {
        id: message.id,
        chatId,
        senderId: userId,
        content,
      });

      return reply.code(201).send({ messageId: message.id });
    }
  );
}
