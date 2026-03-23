const typeDefs = `
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type Auth {
    token: String!
    user: User!
  }

  type Answer {
    id: ID!
    body: String!
    createdBy: String!
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Question {
    id: ID!
    title: String!
    body: String!
    createdBy: String!
    userId: ID!
    answers: [Answer!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    questions: [Question!]!
    question(id: ID!): Question
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): Auth!
    login(email: String!, password: String!): Auth!
    createQuestion(title: String!, body: String!): Question!
    addAnswer(questionId: ID!, body: String!): Question!
  }
`;

export default typeDefs;
