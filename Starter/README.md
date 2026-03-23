# 🏆 Stack Eleven: REST to GraphQL Refactor (Starter)

## 🎯 Overview
In this Starter, learners start with a complete full-stack REST application named **Stack Eleven** and refactor it to GraphQL + Apollo.

This Starter includes:
- A working Express REST API (`backend/`)
- A working React + Vite frontend (`frontend/`)
- JWT auth and protected write routes
- Question and answer features

## 🗂️ Starter Structure
- `backend/src/server.js` REST server bootstrap
- `backend/src/routes/authRoutes.js` register + login routes
- `backend/src/routes/questionRoutes.js` question + answer routes
- `backend/src/models/*.js` Mongoose models
- `frontend/src/App.jsx` REST UI flow
- `frontend/src/api.js` REST request layer

## 🚀 Run the Starter
1. Create env file:
   - Copy `backend/.env.example` to `backend/.env`
2. Install dependencies:
   - `npm install`
   - `npm run install:all`
3. Start MongoDB locally.
4. Run both apps:
   - `npm run dev`

App URLs:
- Frontend: `http://localhost:5173`
- Backend REST API: `http://localhost:4000/api`

## 🧪 Starter Feature Checklist
- Register a new account
- Login and store JWT
- Create a question (authenticated)
- View all questions
- Open one question
- Add an answer (authenticated)

## 🏗️ Student Refactor Targets
Refactor this Starter from REST to GraphQL while preserving the same UX.

### Target 1: Server Foundation
- Install GraphQL server dependencies.
- Replace REST route mounting in `backend/src/server.js`.
- Add Apollo Server endpoint at `/graphql`.

### Target 2: Schema Design (SDL)
Create types for:
- `User`
- `Auth`
- `Question`
- `Answer`

Add operations:
- `Query.questions`
- `Query.question(id: ID!)`
- `Query.me`
- `Mutation.register`
- `Mutation.login`
- `Mutation.createQuestion`
- `Mutation.addAnswer`

### Target 3: Resolvers
- Move logic from REST handlers into GraphQL resolvers.
- Keep authentication behavior identical.
- Keep validation behavior equivalent.

### Target 4: Client Migration
- Remove direct REST fetch usage in `frontend/src/api.js`.
- Add Apollo Client in `frontend/src/main.jsx`.
- Replace REST calls with `useQuery` and `useMutation` in `frontend/src/App.jsx`.

### Target 5: Verification
- Confirm all existing app behavior still works.
- Confirm protected mutations require JWT.
- Confirm question and answer creation works end-to-end.

## 💡 Hints
- Start with `Query.questions` first to verify server/client link quickly.
- Add authentication context before protected mutations.
- Keep variable names close to existing REST payload names to reduce UI churn.

## ✅ Goal
Produce a complete GraphQL/Apollo refactor with no REST endpoint usage from the frontend.
