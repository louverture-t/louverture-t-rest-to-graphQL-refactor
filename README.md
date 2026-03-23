# REST → GraphQL Refactor — Stack Eleven

A full-stack Q&A application that was originally built with a REST API and refactored to use GraphQL + Apollo. This repo serves as a weekly capstone project demonstrating how to migrate an Express/REST backend and a React/Vite frontend to a single GraphQL endpoint backed by Apollo Server 4.

---

## Learning Goals

- Understand GraphQL schema design (types, queries, mutations) and map REST resources to GraphQL operations.
- Implement Apollo Server 4 with resolvers that delegate to Mongoose models.
- Secure mutations using JWT extracted from the Apollo context.
- Set up Apollo Client 4 in a React + Vite frontend using `useQuery` and `useMutation` hooks.
- Compare the REST and GraphQL approaches for the same application.

---

## Tech Stack

| Layer      | Technology                                               |
|------------|----------------------------------------------------------|
| API server | Node.js + Express + Apollo Server 4 (`@apollo/server`)  |
| Integration| `@as-integrations/express4`                              |
| Schema     | GraphQL SDL (`backend/src/typeDefs.js`)                  |
| Resolvers  | `backend/src/resolvers.js`                               |
| Database   | MongoDB via Mongoose                                     |
| Auth       | JWT — verified in Apollo context                         |
| Frontend   | React 18 + Vite + Apollo Client 4                        |
| State      | Apollo `useQuery` / `useMutation` hooks                  |

---

## Project Structure

```
rest-to-graphQL-refactor/
├── README.md                        ← you are here
└── Starter/
    ├── package.json                 root workspace (runs both apps concurrently)
    ├── instructions.md              capstone assignment instructions
    ├── task-1-rest-baseline.md      REST contract baseline document
    ├── backend/
    │   ├── package.json
    │   └── src/
    │       ├── server.js            Apollo Server bootstrap, context, MongoDB connect
    │       ├── typeDefs.js          GraphQL schema (SDL)
    │       ├── resolvers.js         Query + Mutation resolvers
    │       ├── middleware/
    │       │   └── auth.js          JWT middleware (retained for reference)
    │       ├── models/
    │       │   ├── User.js
    │       │   └── Question.js
    │       └── __tests__/
    │           └── resolvers.auth.test.js
    └── frontend/
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── main.jsx             ApolloProvider + auth link setup
            ├── App.jsx              All UI logic using Apollo hooks
            └── styles.css
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **MongoDB** running locally on the default port (`mongodb://localhost:27017`)

### 1. Clone the repo

```bash
git clone https://github.com/louverture-t/rest-to-graphQL-refactor.git
cd rest-to-graphQL-refactor/Starter
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set the two required values:

```env
MONGODB_URI=mongodb://localhost:27017/stackeleven
JWT_SECRET=your_secret_here
```

### 3. Install dependencies

```bash
npm install          # installs root workspace deps (concurrently)
npm run install:all  # installs backend and frontend deps
```

### 4. Start the development servers

```bash
npm run dev
```

This runs the backend and frontend concurrently:

| Service  | URL                              |
|----------|----------------------------------|
| Backend  | http://localhost:4000/graphql    |
| Frontend | http://localhost:5173            |

---

## GraphQL API

All operations go through a single endpoint:

```
POST http://localhost:4000/graphql
```

### Schema

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

### Auth Flow

1. Call `register` or `login` — both return `{ token, user }`.
2. The frontend stores `token` in `localStorage`.
3. Apollo Client's auth link reads the token and sends it as `Authorization: Bearer <token>` on every request.
4. The Apollo context function on the server verifies the JWT and attaches `user` to context.
5. `createQuestion` and `addAnswer` throw `UNAUTHENTICATED` if no valid token is present.

---

## Running Tests

```bash
cd Starter/backend
npm test
```

Tests use Jest and cover the auth resolvers (`register` and `login`).

---

## REST → GraphQL Migration Summary

| Concern             | REST (before)                          | GraphQL (after)                          |
|---------------------|----------------------------------------|------------------------------------------|
| Endpoints           | Multiple (`/api/auth/*`, `/api/questions/*`) | Single (`/graphql`)               |
| Data fetching       | Multiple round-trips for nested data   | One query, exactly the fields needed     |
| Auth                | Express middleware on REST routes      | JWT verified in Apollo context function  |
| Frontend data layer | `fetch` helpers in `api.js`            | `useQuery` / `useMutation` Apollo hooks  |
| Over-fetching       | Fixed response shape per endpoint      | Client selects only the fields it needs  |
| Type safety         | Implicit (documented in markdown)      | Explicit via SDL schema                  |

---

## Key Files

| File | Purpose |
|------|---------|
| [Starter/backend/src/typeDefs.js](Starter/backend/src/typeDefs.js) | GraphQL schema definition |
| [Starter/backend/src/resolvers.js](Starter/backend/src/resolvers.js) | All query and mutation logic |
| [Starter/backend/src/server.js](Starter/backend/src/server.js) | Server bootstrap, Apollo wiring, JWT context |
| [Starter/frontend/src/main.jsx](Starter/frontend/src/main.jsx) | ApolloProvider + auth link configuration |
| [Starter/frontend/src/App.jsx](Starter/frontend/src/App.jsx) | React UI using Apollo hooks |
| [Starter/task-1-rest-baseline.md](Starter/task-1-rest-baseline.md) | Documented REST contract before migration |
| [Starter/instructions.md](Starter/instructions.md) | Full capstone assignment instructions |

---

## License

This project is for educational purposes as part of a backend web development course.
