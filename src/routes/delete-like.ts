import z from 'zod';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function deleteLike(app: FastifyTypedInstance) {
  app.delete(
    '/likes/:toUserId',
    {
      preHandler: [auth],
      schema: {
        description:
          'Delete the like sent to another user if no chat exists between them',
        tags: ['likes'],
        params: z.object({
          toUserId: z.string(),
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
      const fromUserId = request.user.sub;
      const { toUserId } = request.params;

      // Verificar se o like existe
      const like = await prisma.like.findUnique({
        where: {
          uniqueFromTo: {
            fromUserId,
            toUserId,
          },
        },
      });

      if (!like) {
        return reply.code(404).send({ message: 'Like não encontrado' });
      }

      const chat = await prisma.chat.findFirst({
        where: {
          AND: [
            { userIds: { has: fromUserId } },
            { userIds: { has: toUserId } },
          ],
        },
      });

      if (chat) {
        return reply.code(400).send({
          message:
            'Não é possível deletar o like, pois existe um chat entre os usuários',
        });
      }

      await prisma.like.delete({
        where: { id: like.id },
      });

      return reply.code(200).send({ message: 'Like excluído com sucesso' });
    }
  );
}
