import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Server } from 'socket.io';

export type FastifyTypedInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>;

export type TokenContent = {
  sub: string;
  email: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }

  interface FastifyRequest {
    user: TokenContent;
  }
}
