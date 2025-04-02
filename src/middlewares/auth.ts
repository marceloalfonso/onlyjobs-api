import { FastifyReply, FastifyRequest } from 'fastify';
import { verify } from 'jsonwebtoken';
import { TokenContent } from '../types';

export const auth = (
  request: FastifyRequest,
  reply: FastifyReply,
  next: () => void
) => {
  try {
    const token = request.headers.authorization;

    if (!token) {
      return reply.code(401).send({ message: 'Autenticação necessária' });
    }

    const decoded = verify(token, process.env.SECRET as string);

    request.user = decoded as TokenContent;

    next();
  } catch (error) {
    return reply.code(401).send({ message: 'Autenticação inválida' });
  }
};
