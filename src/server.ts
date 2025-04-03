import { fastifyCors } from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastify } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { Server } from 'socket.io';
import setupSocketIO from './lib/socketio';
import { createLike } from './routes/create-like';
import { createMessage } from './routes/create-message';
import { createUser } from './routes/create-user';
import { deleteLike } from './routes/delete-like';
import { deleteUser } from './routes/delete-user';
import { getCandidates } from './routes/get-candidates';
import { getCompanies } from './routes/get-companies';
import { getNotLikedUsers } from './routes/get-not-liked-users';
import { getUnreadMessagesCountPerChat } from './routes/get-unread-messages-count-per-chat';
import { getUser } from './routes/get-user';
import { getUserChats } from './routes/get-user-chats';
import { getUserReceivedLikes } from './routes/get-user-received-likes';
import { getUserSentLikes } from './routes/get-user-sent-likes';
import { signIn } from './routes/sign-in';
import { updateMessage } from './routes/update-message';
import { updateUserName } from './routes/update-user-name';
import { updateUserPassword } from './routes/update-user-password';
import { updateUserProfile } from './routes/update-user-profile';

const app = fastify().withTypeProvider<ZodTypeProvider>();
let io: Server;

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.decorate('io', {
  getter() {
    return io;
  },
});

app.register(fastifyCors, { origin: '*' });

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'API',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
});
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

app.register(signIn);
app.register(createUser);
app.register(createLike);
app.register(createMessage);

app.register(updateUserName);
app.register(updateUserProfile);
app.register(updateUserPassword);
app.register(updateMessage);

app.register(deleteUser);
app.register(deleteLike);

app.register(getUser);
app.register(getCandidates);
app.register(getCompanies);
app.register(getUserSentLikes);
app.register(getUserReceivedLikes);
app.register(getUserChats);
app.register(getNotLikedUsers);
app.register(getUnreadMessagesCountPerChat);

const start = async () => {
  try {
    await app.listen({ host: '0.0.0.0', port: 3000 });

    console.log('HTTP server running!');

    io = setupSocketIO(app);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
