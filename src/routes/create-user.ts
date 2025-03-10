import { z } from 'zod';
import prisma from '../lib/prisma';
import { FastifyTypedInstance } from '../types';

type User = {
  name: string;
  email: string;
  password: string;
  role: 'CANDIDATE' | 'COMPANY';
  profile?: {};
};

export async function createUser(app: FastifyTypedInstance) {
  app.post(
    '/users',
    {
      schema: {
        description: 'Create a new user',
        tags: ['users'],
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string(),
          role: z.enum(['CANDIDATE', 'COMPANY']),
          profile: z.record(z.any()).optional(),
        }),
        response: {
          201: z.object({
            userId: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role, profile = {} } = request.body;

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password,
          role,
          profile,
        },
      });

      return reply.status(201).send({ userId: user.id });
    }
  );
}
