import { hashSync } from 'bcrypt';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { FastifyTypedInstance } from '../types';

export async function createUser(app: FastifyTypedInstance) {
  app.post(
    '/auth/sign-up',
    {
      schema: {
        description: 'Create a new user',
        tags: ['auth'],
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
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role, profile = {} } = request.body;

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        return reply
          .code(409)
          .send({ message: 'Este e-mail já está cadastrado' });
      }

      const hash = hashSync(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hash,
          role,
          profile,
        },
      });

      return reply.code(201).send({ userId: user.id });
    }
  );
}
