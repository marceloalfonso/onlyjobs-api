import { Record } from '@prisma/client/runtime/library';
import { z } from 'zod';
import dayjs from '../lib/dayjs';
import prisma from '../lib/prisma';
import { auth } from '../middlewares/auth';
import { FastifyTypedInstance } from '../types';

export async function getUserChats(app: FastifyTypedInstance) {
  app.get(
    '/chats',
    {
      preHandler: [auth],
      schema: {
        description: "Get authenticated user's chats",
        tags: ['chats'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              userIds: z.array(z.string()),
              createdAt: z.string(),
              updatedAt: z.string(),
              otherUser: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  profile: z.record(z.any()),
                })
              ),
              messages: z.array(
                z.object({
                  id: z.string(),
                  chatId: z.string(),
                  senderId: z.string(),
                  content: z.string(),
                  read: z.boolean(),
                  createdAt: z.string(),
                  updatedAt: z.string(),
                })
              ),
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

      const chats = await prisma.chat.findMany({
        where: {
          userIds: {
            has: userId,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      const otherUserIds = Array.from(
        new Set(
          chats.flatMap((chat) => chat.userIds.filter((id) => id !== userId))
        )
      );

      const otherUsers = await prisma.user.findMany({
        where: {
          id: {
            in: otherUserIds,
          },
        },
        select: {
          id: true,
          name: true,
          profile: true,
        },
      });

      const otherUsersMap = new Map(
        otherUsers.map((otherUser) => [
          otherUser.id,
          {
            ...otherUser,
            profile: otherUser.profile as Record<string, any>,
          },
        ])
      );

      const formattedChats = chats.map((chat) => {
        const otherUser = chat.userIds
          .map((id) => otherUsersMap.get(id))
          .filter(
            (
              otherUser
            ): otherUser is {
              id: string;
              name: string;
              profile: Record<string, any>;
            } => otherUser !== undefined
          );

        return {
          ...chat,
          createdAt: dayjs(chat.createdAt).format('DD/MM/YY - HH:mm:ss'),
          updatedAt: dayjs(chat.updatedAt).format('DD/MM/YY - HH:mm:ss'),
          otherUser: otherUser,
          messages: chat.messages.map((message) => ({
            ...message,
            createdAt: dayjs(message.createdAt).format('DD/MM/YY - HH:mm:ss'),
            updatedAt: dayjs(message.updatedAt).format('DD/MM/YY - HH:mm:ss'),
          })),
        };
      });

      return reply.code(200).send(formattedChats);
    }
  );
}
