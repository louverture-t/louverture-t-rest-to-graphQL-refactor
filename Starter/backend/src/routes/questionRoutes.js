import { Router } from 'express';
import Question from '../models/Question.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    return res.json(questions);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.json(question);
  } catch {
    return res.status(400).json({ message: 'Invalid question id' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'title and body are required' });
    }

    const question = await Question.create({
      title,
      body,
      createdBy: req.user.username,
      userId: req.user.userId,
      answers: [],
    });

    return res.status(201).json(question);
  } catch {
    return res.status(500).json({ message: 'Failed to create question' });
  }
});

router.post('/:id/answers', authMiddleware, async (req, res) => {
  try {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: 'Answer body is required' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.answers.push({
      body,
      createdBy: req.user.username,
      userId: req.user.userId,
    });

    await question.save();
    return res.status(201).json(question);
  } catch {
    return res.status(400).json({ message: 'Failed to post answer' });
  }
});

export default router;
