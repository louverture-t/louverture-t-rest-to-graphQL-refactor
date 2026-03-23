import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Question from './models/Question.js';

const resolvers = {
  Query: {
    questions: async () => Question.find().sort({ createdAt: -1 }),
    question: async (_parent, { id }) => Question.findById(id),
  },
  Mutation: {
    register: async (_parent, { username, email, password }) => {
      if (!username || !email || !password) {
        throw new GraphQLError('username, email, and password are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const exists = await User.findOne({ $or: [{ email }, { username }] });
      if (exists) {
        throw new GraphQLError('Email or username already in use', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashed });

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return { token, user: { id: user._id, username: user.username, email: user.email } };
    },

    login: async (_parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return { token, user: { id: user._id, username: user.username, email: user.email } };
    },

    createQuestion: async (_parent, { title, body }, { user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      if (!title || !body) {
        throw new GraphQLError('title and body are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      return Question.create({
        title,
        body,
        createdBy: user.username,
        userId: user.userId,
        answers: [],
      });
    },

    addAnswer: async (_parent, { questionId, body }, { user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      if (!body) {
        throw new GraphQLError('Answer body is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const question = await Question.findById(questionId);
      if (!question) {
        throw new GraphQLError('Question not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      question.answers.push({
        body,
        createdBy: user.username,
        userId: user.userId,
      });
      await question.save();
      return question;
    },
  },
};

export default resolvers;
