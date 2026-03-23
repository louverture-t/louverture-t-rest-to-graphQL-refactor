# Task 1 Baseline: Current REST Behavior

This document captures the current REST contract and frontend UX behavior that must remain functionally equivalent after the GraphQL + Apollo refactor.

## Source of Truth

- `backend/src/server.js`
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/questionRoutes.js`
- `backend/src/middleware/auth.js`
- `backend/src/models/User.js`
- `backend/src/models/Question.js`
- `frontend/src/api.js`
- `frontend/src/App.jsx`

## Active REST Endpoints

Base API URL: `http://localhost:4000/api`

### Health

`GET /api/health`

- Auth: none
- Response: `200`

```json
{ "status": "ok" }
```

### Register

`POST /api/auth/register`

- Auth: none
- Request body:

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

- Success response: `201`
- Success shape:

```json
{
  "id": "userObjectId",
  "username": "string",
  "email": "string"
}
```

- Validation and error behavior:
  - Missing `username`, `email`, or `password`: `400 { "message": "username, email, and password are required" }`
  - Duplicate email or username: `400 { "message": "Email or username already in use" }`
  - Unexpected server failure: `500 { "message": "Server error during registration" }`

- Important behavior for refactor:
  - Register does not return a token.
  - Register does not auto-login.
  - The frontend switches back to login mode after a successful registration.

### Login

`POST /api/auth/login`

- Auth: none
- Request body:

```json
{
  "email": "string",
  "password": "string"
}
```

- Success response: `200`
- Success shape:

```json
{
  "token": "jwt",
  "user": {
    "id": "userObjectId",
    "username": "string",
    "email": "string"
  }
}
```

- JWT payload shape:

```json
{
  "userId": "userObjectId",
  "username": "string",
  "email": "string"
}
```

- JWT expiry: `2h`

- Validation and error behavior:
  - Unknown email: `401 { "message": "Invalid credentials" }`
  - Wrong password: `401 { "message": "Invalid credentials" }`
  - Unexpected server failure: `500 { "message": "Server error during login" }`

### List Questions

`GET /api/questions`

- Auth: none
- Success response: `200`
- Success shape: array of question documents sorted by `createdAt` descending

```json
[
  {
    "_id": "questionObjectId",
    "title": "string",
    "body": "string",
    "createdBy": "string",
    "userId": "userObjectId",
    "answers": [
      {
        "_id": "answerObjectId",
        "body": "string",
        "createdBy": "string",
        "userId": "userObjectId",
        "createdAt": "isoDate",
        "updatedAt": "isoDate"
      }
    ],
    "createdAt": "isoDate",
    "updatedAt": "isoDate"
  }
]
```

- Error behavior:
  - Unexpected server failure: `500 { "message": "Failed to fetch questions" }`

### Get Question Detail

`GET /api/questions/:id`

- Auth: none
- Success response: `200`
- Success shape: single question document with the same shape as list items
- Error behavior:
  - Missing question for a valid ObjectId: `404 { "message": "Question not found" }`
  - Invalid ObjectId or other route-level failure: `400 { "message": "Invalid question id" }`

### Create Question

`POST /api/questions`

- Auth: required
- Required header:

```http
Authorization: Bearer <jwt>
```

- Request body:

```json
{
  "title": "string",
  "body": "string"
}
```

- Success response: `201`
- Success shape: created question document

```json
{
  "_id": "questionObjectId",
  "title": "string",
  "body": "string",
  "createdBy": "usernameFromJwt",
  "userId": "userIdFromJwt",
  "answers": [],
  "createdAt": "isoDate",
  "updatedAt": "isoDate"
}
```

- Validation and error behavior:
  - Missing token or malformed auth header: `401 { "message": "Authentication required" }`
  - Invalid or expired token: `401 { "message": "Invalid or expired token" }`
  - Missing `title` or `body`: `400 { "message": "title and body are required" }`
  - Unexpected server failure: `500 { "message": "Failed to create question" }`

### Add Answer

`POST /api/questions/:id/answers`

- Auth: required
- Required header:

```http
Authorization: Bearer <jwt>
```

- Request body:

```json
{
  "body": "string"
}
```

- Success response: `201`
- Success shape: updated question document, including the appended embedded answer
- Validation and error behavior:
  - Missing token or malformed auth header: `401 { "message": "Authentication required" }`
  - Invalid or expired token: `401 { "message": "Invalid or expired token" }`
  - Missing answer body: `400 { "message": "Answer body is required" }`
  - Valid ObjectId with no matching question: `404 { "message": "Question not found" }`
  - Invalid ObjectId or any other failure inside the handler: `400 { "message": "Failed to post answer" }`

## Frontend State Transitions

The current frontend is a single-screen React app with local component state in `App.jsx`.

### Initial Load

- `status` starts as `Welcome to Stack Eleven.`
- `token` is hydrated from `localStorage.getItem('token') || ''`
- `user` is hydrated from `localStorage.getItem('user')`
- `isRegister` starts as `false`, so login mode is the default
- `questions` starts as `[]`
- `selectedQuestionId` starts as `''`
- `selectedQuestion` starts as `null`
- `questionForm` starts as `{ title: '', body: '' }`
- `answerBody` starts as `''`
- On mount, the app calls `GET /api/questions` and replaces `questions` with the response only if it is an array

### Login Flow

- UI starts in login mode unless the user toggles to register mode
- Submitting login sends `authForm` to `POST /api/auth/login`
- Failure path:
  - If response lacks `token`, status becomes `data.message || 'Login failed'`
  - No local storage is updated
- Success path:
  - `localStorage.token` is set to the JWT string
  - `localStorage.user` is set to the serialized user object
  - React `token` and `user` state are updated
  - Status becomes `Signed in as <username>`
  - The app remains on the same screen; there is no navigation event

### Register Flow

- Toggling the mode button flips `isRegister`
- In register mode, the username input is shown and submit calls `POST /api/auth/register`
- Failure path:
  - If response includes `message`, status becomes that message
- Success path:
  - Status becomes `Registered. You can now sign in.`
  - `isRegister` is set back to `false`
  - No token is stored
  - No user state is set

### Question List Flow

- The list renders from `questions`
- Each row displays `question.title` and `question.createdBy`
- Clicking a row sets `selectedQuestionId` to `question._id`
- After a create or answer mutation succeeds, the app reloads the entire list with `GET /api/questions`

### Question Detail Flow

- When `selectedQuestionId` changes to a truthy value, the app calls `GET /api/questions/:id`
- The response is stored in `selectedQuestion`
- The rendered `selected` value prefers the matching item from `questions` by `_id`; if not found, it falls back to `selectedQuestion`
- If no question is selected, the UI shows `Select a question to view details.`
- When selected, the UI renders title, body, createdBy, and each answer as `answer.body — answer.createdBy`

### Create Question Flow

- The submit button is disabled when no token exists
- Submitting sends `{ title, body }` plus the bearer token to `POST /api/questions`
- Failure path:
  - If response includes `message`, status becomes that message
- Success path:
  - `questionForm` resets to empty values
  - `selectedQuestionId` becomes `created._id`
  - Status becomes `Question created.`
  - The app reloads the question list
  - The selected question detail then refreshes because `selectedQuestionId` changed

### Create Answer Flow

- The submit button is disabled when no token exists
- If submit occurs with no `selectedQuestionId`, status becomes `Pick a question before posting an answer.` and no request is sent
- Otherwise the app sends `{ body: answerBody }` plus the bearer token to `POST /api/questions/:id/answers`
- Failure path:
  - If response includes `message`, status becomes that message
- Success path:
  - `answerBody` resets to `''`
  - `selectedQuestion` becomes the updated question returned from the API
  - Status becomes `Answer posted.`
  - The app reloads the question list

### Logout Flow

- Clicking logout removes `token` and `user` from local storage
- React `token` is set to `''`
- React `user` is set to `null`
- Status becomes `Signed out.`
- Question data and selected question state are not otherwise cleared

## User-Visible Messages To Preserve

### Client messages

- `Welcome to Stack Eleven.`
- `Registered. You can now sign in.`
- `Login failed`
- `Signed in as <username>`
- `Signed out.`
- `Question created.`
- `Answer posted.`
- `Pick a question before posting an answer.`
- `Select a question to view details.`

### Server messages surfaced directly by the UI

- `username, email, and password are required`
- `Email or username already in use`
- `Server error during registration`
- `Invalid credentials`
- `Server error during login`
- `Authentication required`
- `Invalid or expired token`
- `title and body are required`
- `Failed to create question`
- `Answer body is required`
- `Question not found`
- `Failed to post answer`

### Server messages not currently shown by the UI during normal flows, but still part of the API contract

- `Failed to fetch questions`
- `Invalid question id`

## Auth Token Storage and Bearer Header Behavior

- Local storage keys:
  - `token`: raw JWT string
  - `user`: serialized JSON object from the login response
- Token is restored when the app first renders
- User is restored by parsing `localStorage.getItem('user')`
- The frontend does not attach auth headers globally
- The bearer token is only passed on protected write requests from `frontend/src/api.js`
- Header format is exactly:

```http
Authorization: Bearer <token>
```

- The backend auth middleware reads `req.headers.authorization || ''`
- The backend treats the token as present only when the header starts with `Bearer `
- If the header is missing, empty, or does not start with `Bearer `, the backend responds with `401 Authentication required`
- If JWT verification fails, the backend responds with `401 Invalid or expired token`
- On success, `req.user` is populated with the decoded JWT payload containing `userId`, `username`, and `email`

## GraphQL Refactor Guardrails Derived From Current Behavior

- `register` currently does not sign the user in; if the GraphQL refactor changes this to auto-login, the frontend status flow must be updated intentionally rather than accidentally.
- Protected writes rely on the JWT payload fields `userId`, `username`, and `email`; Apollo context should preserve that payload shape.
- Question reads currently expose Mongo document field names with `_id`; the GraphQL schema can translate to `id`, but the frontend data needs equivalent coverage.
- The current UI treats any JSON object with a `message` field as an error response for mutations.
- Question list ordering must remain newest first.
- Add-answer currently returns the full updated question, not just the new answer.