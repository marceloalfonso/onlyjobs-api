import { compareSync } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { FastifyTypedInstance } from './../types';

export async function signIn(app: FastifyTypedInstance) {
  app.post(
    '/auth/sign-in',
    {
      schema: {
        description: 'Authenticate an user',
        tags: ['auth'],
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          200: z.object({
            token: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

      if (!user || !compareSync(password, user.password)) {
        return reply.code(401).send({
          message: 'E-mail ou senha inválidos. Tente novamente.',
        });
      }

      const token = sign(
        { sub: user.id, email: user.email },
        process.env.SECRET as string,
        {
          expiresIn: '1d',
        }
      );

      return reply.code(200).send({ token });
    }
  );
}
