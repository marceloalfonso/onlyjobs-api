import z from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
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
        return reply.code(404).send({ message: 'Mensagem não encontrada' });
      }

      if (message.read) {
        return reply
          .code(400)
          .send({ message: 'Mensagem já marcada como lida' });
      }

      if (!message.chat.userIds.includes(userId)) {
        return reply.code(403).send({
          message:
            'Autorização necessária para atualizar o status de leitura da mensagem',
        });
      }

      if (message.senderId === userId) {
        return reply.code(400).send({
          message: 'Não é possível marcar sua própria mensagem como lida',
        });
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

      return reply.code(200).send({
        message: 'Status de leitura da mensagem atualizado com sucesso',
      });
    }
  );
}
