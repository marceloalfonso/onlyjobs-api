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
import { createLike } from './routes/create-like';
import { getUser } from './routes/get-user';
import { getUsers } from './routes/get-users';
import { signIn } from './routes/sign-in';
import { signUp } from './routes/sign-up';
import { updateUser } from './routes/update-user';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

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

app.register(signUp);
app.register(signIn);
app.register(getUsers);
app.register(getUser);
app.register(updateUser);
app.register(createLike);

app.listen({ host: '0.0.0.0', port: 3000 }).then(() => {
  console.log('Server running!');
});
