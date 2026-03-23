// Resolver implementations are added in Tasks 6 and 7.
// This stub satisfies Apollo Server's requirement for a resolvers map
// so the server can start and the schema can be validated.
import { GraphQLError } from 'graphql';

const notImplemented = () => {
  throw new GraphQLError('Not implemented', {
    extensions: { code: 'NOT_IMPLEMENTED' },
  });
};

const resolvers = {
  Query: {
    questions: notImplemented,
    question: notImplemented,
  },
  Mutation: {
    register: notImplemented,
    login: notImplemented,
    createQuestion: notImplemented,
    addAnswer: notImplemented,
  },
};

export default resolvers;
