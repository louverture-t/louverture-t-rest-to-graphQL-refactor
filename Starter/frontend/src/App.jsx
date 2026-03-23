import { useState } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';

const GET_QUESTIONS = gql`
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
`;

const GET_QUESTION = gql`
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
`;

const REGISTER = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user { id username email }
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id username email }
    }
  }
`;

const CREATE_QUESTION = gql`
  mutation CreateQuestion($title: String!, $body: String!) {
    createQuestion(title: $title, body: $body) {
      id
      title
      body
      createdBy
    }
  }
`;

const ADD_ANSWER = gql`
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
`;

const defaultAuth = { username: '', email: '', password: '' };
const defaultQuestion = { title: '', body: '' };

function App() {
  const apolloClient = useApolloClient();
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authForm, setAuthForm] = useState(defaultAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [questionForm, setQuestionForm] = useState(defaultQuestion);
  const [answerBody, setAnswerBody] = useState('');
  const [status, setStatus] = useState('Welcome to Stack Eleven.');

  const { data: questionsData } = useQuery(GET_QUESTIONS);
  const { data: questionData } = useQuery(GET_QUESTION, {
    variables: { id: selectedQuestionId },
    skip: !selectedQuestionId,
  });

  const [register] = useMutation(REGISTER);
  const [login] = useMutation(LOGIN);
  const [createQuestion] = useMutation(CREATE_QUESTION, {
    refetchQueries: [{ query: GET_QUESTIONS }],
  });
  const [addAnswer] = useMutation(ADD_ANSWER);

  const questions = questionsData?.questions || [];
  const selected =
    questionData?.question || questions.find((q) => q.id === selectedQuestionId) || null;

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    if (isRegister) {
      try {
        const { data } = await register({
          variables: {
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
          },
        });
        const { token: newToken, user: newUser } = data.register;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setIsRegister(false);
        setStatus(`Registered and signed in as ${newUser.username}.`);
      } catch (err) {
        setStatus(err.graphQLErrors?.[0]?.message || 'Registration failed.');
      }
      return;
    }

    try {
      const { data } = await login({
        variables: { email: authForm.email, password: authForm.password },
      });
      const { token: newToken, user: newUser } = data.login;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setStatus(`Signed in as ${newUser.username}.`);
    } catch (err) {
      setStatus(err.graphQLErrors?.[0]?.message || 'Login failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setStatus('Signed out.');
    apolloClient.clearStore();
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await createQuestion({
        variables: { title: questionForm.title, body: questionForm.body },
      });
      setQuestionForm(defaultQuestion);
      setSelectedQuestionId(data.createQuestion.id);
      setStatus('Question created.');
    } catch (err) {
      setStatus(err.graphQLErrors?.[0]?.message || 'Failed to create question.');
    }
  };

  const handleAnswerSubmit = async (event) => {
    event.preventDefault();
    if (!selectedQuestionId) {
      setStatus('Pick a question before posting an answer.');
      return;
    }
    try {
      await addAnswer({
        variables: { questionId: selectedQuestionId, body: answerBody },
        refetchQueries: [{ query: GET_QUESTION, variables: { id: selectedQuestionId } }],
      });
      setAnswerBody('');
      setStatus('Answer posted.');
    } catch (err) {
      setStatus(err.graphQLErrors?.[0]?.message || 'Failed to post answer.');
    }
  };

  return (
    <main className="app">
      <h1>Stack Eleven</h1>
      <p className="status">{status}</p>

      <section className="card">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleAuthSubmit} className="stack">
          {isRegister && (
            <input
              placeholder="Username"
              value={authForm.username}
              onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })}
            />
          )}
          <input
            placeholder="Email"
            value={authForm.email}
            onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
          />
          <button type="submit">{isRegister ? 'Create Account' : 'Sign In'}</button>
        </form>
        <button onClick={() => setIsRegister((value) => !value)}>
          {isRegister ? 'Switch to Login' : 'Switch to Register'}
        </button>
        {token && (
          <div className="inline">
            <span>Logged in as {user?.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Questions</h2>
        <ul>
          {questions.map((question) => (
            <li key={question.id}>
              <button onClick={() => setSelectedQuestionId(question.id)}>
                {question.title} • by {question.createdBy}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Create Question</h2>
        <form onSubmit={handleQuestionSubmit} className="stack">
          <input
            placeholder="Question title"
            value={questionForm.title}
            onChange={(event) => setQuestionForm({ ...questionForm, title: event.target.value })}
          />
          <textarea
            rows="4"
            placeholder="Question details"
            value={questionForm.body}
            onChange={(event) => setQuestionForm({ ...questionForm, body: event.target.value })}
          />
          <button type="submit" disabled={!token}>
            Post Question
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Selected Question</h2>
        {!selected && <p>Select a question to view details.</p>}
        {selected && (
          <>
            <h3>{selected.title}</h3>
            <p>{selected.body}</p>
            <p>Asked by: {selected.createdBy}</p>
            <h4>Answers</h4>
            <ul>
              {(selected.answers || []).map((answer) => (
                <li key={answer.id}>
                  {answer.body} — {answer.createdBy}
                </li>
              ))}
            </ul>
            <form onSubmit={handleAnswerSubmit} className="stack">
              <textarea
                rows="3"
                placeholder="Write your answer"
                value={answerBody}
                onChange={(event) => setAnswerBody(event.target.value)}
              />
              <button type="submit" disabled={!token}>
                Post Answer
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
