Stack Eleven Capstone — Refactor REST to GraphQL (Apollo)
=====================================================

Overview
--------
This week's capstone asks you to take an existing RESTful full-stack project (a small Q&A app) and refactor it to use GraphQL. You'll replace the REST API with an Apollo Server using Mongoose models on the backend, and update the Vite + React frontend to use Apollo Client for data fetching and mutations.

Learning goals
--------------
- Understand GraphQL schema design (types, queries, mutations) and map REST resources to GraphQL.
- Implement Apollo Server with resolvers that use Mongoose models.
- Use Apollo Client in a React + Vite frontend: write queries, mutations, and update cache after mutations.
- Compare pros/cons of REST vs GraphQL for the same app.

Project structure (what you'll change)
-------------------------------------
- Backend: replace Express REST routes with Apollo Server (GraphQL) while keeping Mongoose for data models.
- Frontend: replace REST fetch/Axios calls with Apollo Client queries/mutations and use React hooks (useQuery/useMutation).

Minimum features (must-have)
----------------------------
Backend (Apollo Server + Mongoose):

- Implement Mongoose models for User, Question, Answer (you can reuse existing models or adapt them to Mongoose schemas).
- Implement GraphQL schema with types and resolvers for:
  - Query: questions, question(id), me (optional)
  - Mutation: register, login (return JWT token), createQuestion, createAnswer, voteQuestion (optional)
- Implement JWT auth middleware that extracts Bearer token from HTTP headers and attaches user to context for resolvers.
- Secure mutations that require authentication.

Frontend (Vite + React + Apollo Client):

- Initialize Apollo Client with an HTTP link that sends the Authorization header with the JWT (if present).
- Replace REST calls with GraphQL operations:
  - Query: fetch questions list on home page
  - Query: fetch question details and answers on question page
  - Mutation: register, login, post question, post answer
- Manage auth state (store token in localStorage) and add it to Apollo Client requests via an auth link.

Step-by-step tasks
------------------
1. Prep: fork/clone the starter REST project provided by the instructor.

2. Backend: add GraphQL & Apollo

  a. Install dependencies:

  ```bash
  npm install @apollo/server @as-integrations/express4 graphql jsonwebtoken bcryptjs mongoose
  npm install -D @types/jsonwebtoken @types/bcryptjs
  ```

  b. Create `src/graphql/schema.ts` (or `.graphql`) and `src/graphql/resolvers.ts`.

  c. Example GraphQL type definitions (SDL):

  ```graphql
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type Answer {
    id: ID!
    body: String!
    author: User!
    createdAt: String!
  }

  type Question {
    id: ID!
    title: String!
    body: String!
    author: User!
    answers: [Answer!]!
    createdAt: String!
  }

  type Query {
    questions: [Question!]!
    question(id: ID!): Question
    me: User
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createQuestion(title: String!, body: String!): Question!
    createAnswer(questionId: ID!, body: String!): Answer!
  }
  ```

  d. Wire Apollo Server into Express (or start Apollo Server standalone) and pass `context` which includes the authenticated user (use JWT verification).

3. Backend: resolvers

  - Implement resolvers that call Mongoose models (e.g., Question.find(), Question.findById(), Answer.create()).
  - For mutations requiring auth, read the `user` from `context` and throw authentication errors if missing.

4. Frontend: Apollo Client setup

  a. Install dependencies in the frontend:

  ```bash
  npm install @apollo/client graphql
  ```

  b. Create an Apollo client instance (`src/lib/apollo.ts`):

  ```ts
  import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
  import { setContext } from '@apollo/client/link/context';

  const httpLink = createHttpLink({ uri: '/graphql' });

  const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('hh:token');
    return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
  });

  export const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
  ```

  c. Wrap the app with `<ApolloProvider client={client}>` in `main.tsx`.

5. Frontend: queries & mutations

  - Replace the REST fetch logic with `useQuery` and `useMutation` hooks.
  - Example query (questions list):

  ```graphql
  query Questions { questions { id title body author { id username } createdAt } }
  ```

  - Example mutation (createQuestion):

  ```graphql
  mutation CreateQuestion($title: String!, $body: String!) { createQuestion(title: $title, body: $body) { id title } }
  ```

6. Handle authentication

  - When login/register returns an AuthPayload with token, store token and user in localStorage and update Apollo client headers.
  - Use `cache.modify` or `refetchQueries` after mutations to keep the UI in sync.

7. Incremental verification

  - Start the GraphQL server and use GraphQL Playground / Apollo Studio Explorer to run queries and mutations directly.
  - Then switch the frontend to Apollo and verify the UI works end-to-end.

Example mapping: REST -> GraphQL
--------------------------------
- REST: GET /api/questions -> GraphQL: query { questions { ... } }
- REST: GET /api/questions/:id -> GraphQL: query { question(id: "...") { ... } }
- REST: POST /api/questions -> GraphQL: mutation createQuestion

Testing & verification
----------------------
- Use Apollo Studio Explorer or GraphiQL to test GraphQL endpoints.
- Write minimal integration tests for resolvers (optional): you can use Jest + supertest against the Express/Apollo endpoint or use apollo-server-testing utilities.

Grading rubric (suggested)
--------------------------
- 40% Backend GraphQL correctness
  - Schema design, resolver implementation, auth/context wiring
- 40% Frontend integration
  - Apollo Client implemented, queries/mutations work, UI updates correctly
- 10% Code quality & TypeScript usage
- 10% Documentation & run instructions

Deliverables
------------
- A Git repo or branch with the refactored backend (GraphQL) and frontend (Apollo Client).
- README with run instructions for both server and client (include env var JWT_SECRET, MongoDB URL).
- Short reflection (1 paragraph): explain the main changes you made, and one pro and one con of GraphQL for this app.

Instructor notes & hints
-----------------------
- Start small: implement read-only queries first (questions list and question detail), then add mutations.
- Keep resolvers thin: call Mongoose methods and map results into GraphQL types.
- Use DataLoader (optional) to prevent N+1 query problems when resolving nested relations (author on each question).
- If students are comfortable, add subscriptions for live updates (optional stretch).

Completion checklist
--------------------
- [ ] Backend: Apollo Server running and tests passing
- [ ] Backend: Mongoose models and resolvers implemented
- [ ] Frontend: Apollo Client wired and queries/mutations used
- [ ] Auth: JWT-based authentication works and is used in mutations
- [ ] Documentation: README and reflection added to repo
