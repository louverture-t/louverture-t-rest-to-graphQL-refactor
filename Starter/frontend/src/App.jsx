import { useEffect, useMemo, useState } from 'react';
import { api } from './api';

const defaultAuth = { username: '', email: '', password: '' };
const defaultQuestion = { title: '', body: '' };

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authForm, setAuthForm] = useState(defaultAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState(defaultQuestion);
  const [answerBody, setAnswerBody] = useState('');
  const [status, setStatus] = useState('Welcome to Stack Eleven.');

  const selected = useMemo(
    () => questions.find((question) => question._id === selectedQuestionId) || selectedQuestion,
    [questions, selectedQuestion, selectedQuestionId]
  );

  const loadQuestions = async () => {
    const data = await api.getQuestions();
    setQuestions(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!selectedQuestionId) return;
    api.getQuestionById(selectedQuestionId).then(setSelectedQuestion);
  }, [selectedQuestionId]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    if (isRegister) {
      const data = await api.register(authForm);
      if (data.message) {
        setStatus(data.message);
      } else {
        setStatus('Registered. You can now sign in.');
        setIsRegister(false);
      }
      return;
    }

    const data = await api.login(authForm);
    if (!data.token) {
      setStatus(data.message || 'Login failed');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setStatus(`Signed in as ${data.user.username}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setStatus('Signed out.');
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    const created = await api.createQuestion(questionForm, token);

    if (created.message) {
      setStatus(created.message);
      return;
    }

    setQuestionForm(defaultQuestion);
    setSelectedQuestionId(created._id);
    setStatus('Question created.');
    await loadQuestions();
  };

  const handleAnswerSubmit = async (event) => {
    event.preventDefault();
    if (!selectedQuestionId) {
      setStatus('Pick a question before posting an answer.');
      return;
    }

    const updated = await api.createAnswer(selectedQuestionId, { body: answerBody }, token);
    if (updated.message) {
      setStatus(updated.message);
      return;
    }

    setAnswerBody('');
    setSelectedQuestion(updated);
    setStatus('Answer posted.');
    await loadQuestions();
  };

  return (
    <main className="app">
      <h1>Stack Eleven (REST Starter)</h1>
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
            <li key={question._id}>
              <button onClick={() => setSelectedQuestionId(question._id)}>
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
                <li key={answer._id}>
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
