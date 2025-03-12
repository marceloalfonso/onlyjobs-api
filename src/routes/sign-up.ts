import { hashSync } from 'bcrypt';
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

export async function signUp(app: FastifyTypedInstance) {
  app.post(
    '/auth/sign-up',
    {
      schema: {
        description: 'Sign up',
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
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role, profile = {} } = request.body;

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
