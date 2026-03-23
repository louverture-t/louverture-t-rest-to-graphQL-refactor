import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Context function is replaced with JWT auth logic in Task 5.
const context = async ({ req }) => ({ req });

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();

    app.use(
      '/graphql',
      cors({ origin: 'http://localhost:5173' }),
      express.json(),
      expressMiddleware(server, { context })
    );

    app.listen(PORT, () => {
      console.log(`GraphQL API running on http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
