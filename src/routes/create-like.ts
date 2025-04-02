import { z } from 'zod';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function createLike(app: FastifyTypedInstance) {
  app.post(
    '/likes',
    {
      preHandler: [auth],
      schema: {
        description: 'Like another user',
        tags: ['likes'],
        body: z.object({
          toUserId: z.string(),
        }),
        response: {
          201: z.object({
            likeId: z.string(),
            chatId: z.string().optional(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const fromUserId = request.user.sub;
      const { toUserId } = request.body;

      const [fromUser, toUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: fromUserId },
          select: { role: true },
        }),

        prisma.user.findUnique({
          where: { id: toUserId },
          select: { role: true },
        }),
      ]);

      if (!fromUser || !toUser) {
        return reply
          .code(404)
          .send({ message: 'Usuário(s) não encontrado(s)' });
      }

      if (fromUser.role === toUser.role) {
        return reply.code(400).send({
          message: 'Não é possível dar like num usuário com a mesma função',
        });
      }

      const existingLike = await prisma.like.findUnique({
        where: {
          uniqueFromTo: {
            fromUserId,
            toUserId,
          },
        },
      });

      if (existingLike) {
        return reply.status(409).send({
          message: 'Você já deu like neste usuário',
        });
      }

      const like = await prisma.like.create({
        data: {
          fromUserId,
          toUserId,
        },
      });

      const reciprocalLike = await prisma.like.findUnique({
        where: {
          uniqueFromTo: {
            fromUserId: toUserId,
            toUserId: fromUserId,
          },
        },
      });

      if (reciprocalLike) {
        const existingChat = await prisma.chat.findFirst({
          where: {
            AND: [
              { userIds: { has: fromUserId } },
              { userIds: { has: toUserId } },
            ],
          },
        });

        if (existingChat) {
          return reply
            .code(201)
            .send({ likeId: like.id, chatId: existingChat.id });
        }

        const userIds = [fromUserId, toUserId].sort();

        const { chat } = await prisma.$transaction(async (tx) => {
          const chat = await tx.chat.create({
            data: {
              userIds,
            },
          });

          await tx.user.update({
            where: { id: fromUserId },
            data: { chatIds: { push: chat.id } },
          });

          await tx.user.update({
            where: { id: toUserId },
            data: { chatIds: { push: chat.id } },
          });

          return { chat };
        });

        return reply.code(201).send({ likeId: like.id, chatId: chat.id });
      }

      return reply.code(201).send({ likeId: like.id });
    }
  );
}
