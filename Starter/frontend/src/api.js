const API_BASE = 'http://localhost:4000/api';

export const api = {
  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  login: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getQuestions: async () => {
    const res = await fetch(`${API_BASE}/questions`);
    return res.json();
  },

  getQuestionById: async (id) => {
    const res = await fetch(`${API_BASE}/questions/${id}`);
    return res.json();
  },

  createQuestion: async (payload, token) => {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  createAnswer: async (questionId, payload, token) => {
    const res = await fetch(`${API_BASE}/questions/${questionId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
