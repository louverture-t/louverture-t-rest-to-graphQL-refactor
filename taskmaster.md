# Taskmaster

Project: REST to GraphQL + Apollo refactor for Stack Eleven
Repository target: https://github.com/louverture-t/rest-to-graphQL-refactor.git
Required git identity: louverture-t
Status rule: check off a task or subtask only when its implementation and verification are both complete.

## Completion Key
- [ ] Not complete
- [x] Complete and verified

## Task 1. Baseline Current REST Behavior
**Depends on:** none
**Blocks:** Tasks 2 through 10

- [x] 1.1 Inventory current backend REST endpoints and expected payload shapes from auth and question routes.
- [x] 1.2 Inventory current frontend state transitions for login, register, question list, question detail, create question, and create answer.
- [x] 1.3 Record user-visible success and error messages that should remain equivalent after the refactor.
- [x] 1.4 Record the current auth token storage and bearer-header behavior.

Baseline artifact: `Starter/task-1-rest-baseline.md`

```text
Inputs
- backend/src/routes/authRoutes.js
- backend/src/routes/questionRoutes.js
- frontend/src/api.js
- frontend/src/App.jsx

Definition of done
- REST behavior is documented well enough to map each route to a GraphQL operation.
- Current UX states are known before implementation starts.
```

## Task 2. Add GraphQL and Apollo Dependencies
**Depends on:** Task 1
**Blocks:** Tasks 3 through 9

- [x] 2.1 Add backend runtime dependencies for Apollo Server, GraphQL, and Express integration.
- [x] 2.2 Add frontend runtime dependencies for Apollo Client and GraphQL.
- [x] 2.3 Confirm package scripts still support local development for backend and frontend.
- [x] 2.4 Confirm no unnecessary dependency churn was introduced.

```bash
# Backend
npm install --prefix backend @apollo/server @as-integrations/express4 graphql

# Frontend
npm install --prefix frontend @apollo/client graphql
```

```text
Definition of done
- backend/package.json contains Apollo/GraphQL dependencies.
- frontend/package.json contains Apollo Client dependencies.
- Existing dev commands still work.
```

## Task 3. Define the GraphQL Schema
**Depends on:** Tasks 1, 2
**Blocks:** Tasks 4 through 9

- [x] 3.1 Create GraphQL types for User, Auth, Question, and Answer.
- [x] 3.2 Define Query.questions and Query.question(id: ID!).
- [x] 3.3 Define Mutation.register, Mutation.login, Mutation.createQuestion, and Mutation.addAnswer.
- [x] 3.4 Ensure field names map cleanly to current Mongoose models and current frontend needs.
- [x] 3.5 Decide and document any naming differences between internal implementation and public schema.

```graphql
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
```

```text
Definition of done
- Schema covers all README-required operations.
- Register is designed to auto-login by returning Auth.
- No optional me or voteQuestion scope is added.
```

## Task 4. Replace REST Server Bootstrap with Apollo Server
**Depends on:** Tasks 2, 3
**Blocks:** Tasks 5 through 9

- [x] 4.1 Create the Apollo server bootstrap and mount it at /graphql.
- [x] 4.2 Preserve MongoDB connection startup behavior.
- [x] 4.3 Preserve local frontend CORS access.
- [x] 4.4 Remove REST route mounting from the active server path.
- [x] 4.5 Keep a simple health path only if it is still useful and does not conflict with the GraphQL goal.

```js
// Target shape
const server = new ApolloServer({ typeDefs, resolvers });
await server.start();
app.use('/graphql', cors(), express.json(), expressMiddleware(server, { context }));
```

```text
Definition of done
- /graphql is the primary API endpoint.
- MongoDB startup and failure handling still work.
- The server no longer depends on mounted REST routes for app functionality.
```

## Task 5. Move Auth into Apollo Context
**Depends on:** Tasks 1, 3, 4
**Blocks:** Tasks 6 through 9

- [x] 5.1 Reuse the current bearer-token extraction logic from the auth middleware.
- [x] 5.2 Verify JWTs in Apollo context using the current JWT secret.
- [x] 5.3 Expose authenticated user data on context.user.
- [x] 5.4 Normalize missing or invalid token behavior for protected resolvers.

```js
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
```

```text
Definition of done
- Protected resolvers can rely on context.user.
- Missing or invalid tokens do not crash the server.
- JWT payload shape stays compatible with the existing app.
```

## Task 6. Port Auth Route Logic into GraphQL Resolvers
**Depends on:** Tasks 3, 5
**Blocks:** Tasks 7 through 9

- [x] 6.1 Move register validation and uniqueness checks into Mutation.register.
- [x] 6.2 Preserve bcrypt password hashing in Mutation.register.
- [x] 6.3 Return token plus user from Mutation.register to support auto-login.
- [x] 6.4 Move login credential validation into Mutation.login.
- [x] 6.5 Preserve JWT claims from the current login route.
- [x] 6.6 Normalize GraphQL resolver errors so the frontend can show meaningful status messages.

```js
Mutation: {
  register: async (_parent, args) => {
    // validate inputs, check uniqueness, hash password, create user, sign token
    return { token, user };
  },
  login: async (_parent, args) => {
    // validate credentials, sign token
    return { token, user };
  }
}
```

```text
Definition of done
- Register and login work through GraphQL only.
- Register auto-signs in by returning Auth.
- JWT contents remain compatible with later authenticated mutations.
```

## Task 7. Port Question and Answer Route Logic into GraphQL Resolvers
**Depends on:** Tasks 3, 5
**Blocks:** Tasks 8 through 9

- [x] 7.1 Move question list logic into Query.questions and preserve descending createdAt sort order.
- [x] 7.2 Move single-question lookup into Query.question(id).
- [x] 7.3 Move create question logic into Mutation.createQuestion with auth enforcement.
- [x] 7.4 Move add answer logic into Mutation.addAnswer with auth enforcement.
- [x] 7.5 Preserve existing embedded answer storage in the Question model.
- [x] 7.6 Preserve validation behavior for missing title, question body, and answer body.

```js
Query: {
  questions: async () => Question.find().sort({ createdAt: -1 }),
  question: async (_parent, { id }) => Question.findById(id)
},
Mutation: {
  createQuestion: async (_parent, { title, body }, { user }) => {
    // require auth, validate, create
  },
  addAnswer: async (_parent, { questionId, body }, { user }) => {
    // require auth, validate, push embedded answer, save
  }
}
```

```text
Definition of done
- Read and write question flows work through GraphQL.
- Auth-protected writes reject anonymous requests.
- Returned data still supports the current UI rendering needs.
```

## Task 8. Add Apollo Client Foundation in the Frontend
**Depends on:** Tasks 2, 3, 4, 5
**Blocks:** Tasks 9 and 10

- [x] 8.1 Create the Apollo Client with an HTTP link targeting /graphql.
- [x] 8.2 Add an auth link that injects the bearer token from localStorage.
- [x] 8.3 Wrap the React app in ApolloProvider.
- [x] 8.4 Ensure logout clears both local auth state and Apollo cached data.

```js
const httpLink = createHttpLink({ uri: 'http://localhost:4000/graphql' });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});
```

```text
Definition of done
- ApolloProvider is active at app root.
- Every GraphQL request can include the JWT automatically.
- Logout clears cached authenticated data.
```

## Task 9. Replace Frontend REST Calls with Apollo Queries and Mutations
**Depends on:** Tasks 3, 6, 7, 8
**Blocks:** Task 10

- [x] 9.1 Replace question list loading with useQuery.
- [x] 9.2 Replace selected question loading with useQuery using the selected ID.
- [x] 9.3 Replace register flow with useMutation and auto-login state updates.
- [x] 9.4 Replace login flow with useMutation.
- [x] 9.5 Replace create question flow with useMutation and UI refresh behavior.
- [x] 9.6 Replace add answer flow with useMutation and selected-question refresh behavior.
- [x] 9.7 Remove the frontend REST helper from active usage.
- [x] 9.8 Update status messages to match current UX expectations as closely as possible.

```graphql
query Questions {
  questions {
    id
    title
    body
    createdBy
    createdAt
    answers {
      id
      body
      createdBy
      createdAt
    }
  }
}

query Question($id: ID!) {
  question(id: $id) {
    id
    title
    body
    createdBy
    answers {
      id
      body
      createdBy
      createdAt
    }
  }
}

mutation Register($username: String!, $email: String!, $password: String!) {
  register(username: $username, email: $email, password: $password) {
    token
    user { id username email }
  }
}

mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user { id username email }
  }
}

mutation CreateQuestion($title: String!, $body: String!) {
  createQuestion(title: $title, body: $body) {
    id
    title
    body
    createdBy
  }
}

mutation AddAnswer($questionId: ID!, $body: String!) {
  addAnswer(questionId: $questionId, body: $body) {
    id
    answers {
      id
      body
      createdBy
    }
  }
}
```

```text
Definition of done
- The frontend uses Apollo hooks instead of REST fetch helpers.
- No user-facing frontend path still calls /api.
- Auth, question creation, and answer creation all work against GraphQL.
```

## Task 10. Verify, Document, and Complete Version-Control Handoff
**Depends on:** Tasks 1 through 9
**Blocks:** none

- [x] 10.1 Verify /graphql manually with direct queries and mutations.
- [x] 10.2 Verify the frontend end to end for list, detail, register, login, create question, and add answer.
- [x] 10.3 Confirm protected mutations fail without a token and succeed with a valid token.
- [x] 10.4 Search the frontend for leftover REST endpoint usage and remove any remaining references.
- [x] 10.5 Add targeted automated tests for resolver auth enforcement and key UI flows if setup remains proportionate.
- [x] 10.6 Update README instructions to reflect GraphQL/Apollo usage and current run steps.
- [x] 10.7 Verify the working directory is attached to the correct git repository.
- [x] 10.8 Verify origin is set to https://github.com/louverture-t/rest-to-graphQL-refactor.git.
- [x] 10.9 Verify git user identity is louverture-t.
- [x] 10.10 Commit and push only after all previous subtasks are complete and verified.

```bash
# Verification examples
npm run dev
npm run --prefix frontend build

# Git verification examples once the actual repo root is available
git remote -v
git config user.name
git config user.email
git status
```

```text
Definition of done
- All required GraphQL/Apollo behavior works end to end.
- README reflects the finished architecture.
- Frontend REST usage is fully removed.
- Git remote and identity are verified before commit/push.
```

## Dependency Summary

```text
1 -> 2, 3, 5, 10
2 -> 3, 4, 8
3 -> 4, 5, 6, 7, 8, 9
4 -> 5, 8
5 -> 6, 7, 8
6 -> 9
7 -> 9
8 -> 9, 10
9 -> 10
```

## Final Rule for Check-Off

```text
Only mark a box [x] when:
1. The code change is implemented.
2. The related app behavior is verified.
3. Any dependent follow-up breakage is resolved.
4. The task no longer requires rework.
```
