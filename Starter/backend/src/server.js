import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';

const app = express();
const PORT = process.env.PORT || 4000;

const context = async ({ req }) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { user: null };
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return { user };
  } catch {
    return { user: null };
  }
};

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
