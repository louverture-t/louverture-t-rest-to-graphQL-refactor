# Stack Eleven: GraphQL + Apollo Refactor

## Overview
Stack Eleven is a full-stack Q&A application. The REST API has been fully replaced with a
GraphQL endpoint backed by Apollo Server 4. The React frontend communicates exclusively
through Apollo Client — no REST fetch helpers remain.

## Architecture

| Layer | Technology |
|-------|-----------|
| API server | Express + Apollo Server 4 (`@apollo/server`) |
| Schema | GraphQL SDL (`backend/src/typeDefs.js`) |
| Resolvers | `backend/src/resolvers.js` |
| Database | MongoDB via Mongoose |
| Auth | JWT in Apollo context (`backend/src/server.js`) |
| Frontend | React + Vite + Apollo Client |
| State | Apollo `useQuery` / `useMutation` hooks |

## Project Structure

```
Starter/
  backend/
    src/
      server.js         Apollo Server bootstrap, context, MongoDB connect
      typeDefs.js       GraphQL schema (SDL)
      resolvers.js      Query and Mutation resolvers
      middleware/auth.js  (retained for reference, not mounted)
      models/
        User.js
        Question.js
  frontend/
    src/
      main.jsx          ApolloProvider + auth link setup
      App.jsx           useQuery / useMutation hooks, all UI logic
      styles.css
```

## API Endpoint

```
POST http://localhost:4000/graphql
```

All queries and mutations go through this single endpoint.

## GraphQL Schema

```graphql
type User   { id: ID!  username: String!  email: String! }
type Auth   { token: String!  user: User! }
type Answer { id: ID!  body: String!  createdBy: String!  userId: ID!  createdAt: String!  updatedAt: String! }
type Question {
  id: ID!  title: String!  body: String!  createdBy: String!  userId: ID!
  answers: [Answer!]!  createdAt: String!  updatedAt: String!
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

## Auth Flow
- `register` and `login` return `{ token, user }`.
- The frontend stores `token` in `localStorage` and sends it as `Authorization: Bearer <token>`.
- Apollo context extracts and verifies the JWT on every request.
- `createQuestion` and `addAnswer` throw `UNAUTHENTICATED` if no valid token is present.

## Setup and Run

### Prerequisites
- Node.js 18+
- MongoDB running locally (default `mongodb://localhost:27017/stackeleven`)

### Steps

```bash
# 1. Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env and set MONGODB_URI and JWT_SECRET

# 2. Install dependencies
npm install
npm run install:all

# 3. Start both apps (concurrently)
npm run dev
```

### App URLs
- Frontend: `http://localhost:5173`
- GraphQL API: `http://localhost:4000/graphql`

## Tests

Resolver auth enforcement is covered by unit tests in `backend/src/__tests__/`:

```bash
cd backend
npm test
```

Tests verify that `createQuestion` and `addAnswer` reject unauthenticated requests and pass
the auth guard when a valid user context is provided.

## Feature Checklist
- [x] Register a new account (auto-login)
- [x] Login and store JWT
- [x] View all questions (sorted newest first)
- [x] Open a single question with answers
- [x] Create a question (authenticated)
- [x] Add an answer (authenticated)
- [x] Logout clears JWT and Apollo cache
