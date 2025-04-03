import z from 'zod';
import prisma from '../lib/prisma';
import auth from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function deleteUser(app: FastifyTypedInstance) {
  app.delete(
    '/users',
    {
      preHandler: [auth],
      schema: {
        description: 'Delete authenticated user account',
        tags: ['users'],
        response: {
          200: z.object({
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { chatIds: true },
      });

      if (!user) {
        return reply.code(404).send({ message: 'Usuário não encontrado' });
      }

      await prisma.$transaction(async (tx) => {
        if (user.chatIds.length > 0) {
          const affectedUsers = await tx.user.findMany({
            where: {
              NOT: { id: userId },
              chatIds: { hasSome: user.chatIds },
            },
            select: { id: true, chatIds: true },
          });

          await Promise.all(
            affectedUsers.map((affectedUser) => {
              const updatedChatIds = affectedUser.chatIds.filter(
                (chatId) => !user.chatIds.includes(chatId)
              );

              return tx.user.update({
                where: { id: affectedUser.id },
                data: { chatIds: updatedChatIds },
              });
            })
          );

          await tx.message.deleteMany({
            where: { chatId: { in: user.chatIds } },
          });

          await tx.chat.deleteMany({
            where: { id: { in: user.chatIds } },
          });
        }

        await tx.like.deleteMany({
          where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
        });

        await tx.user.delete({
          where: { id: userId },
        });
      });

      return reply.code(200).send({ message: 'Usuário excluído com sucesso' });
    }
  );
}
