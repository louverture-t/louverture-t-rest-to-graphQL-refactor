/**
 * Targeted unit tests for resolver auth enforcement (Task 10.5).
 * These run without a database — only the auth-guard branches are exercised.
 */
import { jest } from '@jest/globals';

// Stub Mongoose models so the module loads without a real connection
jest.unstable_mockModule('../models/User.js', () => ({
  default: { findOne: jest.fn(), create: jest.fn() },
}));
jest.unstable_mockModule('../models/Question.js', () => ({
  default: {
    find: jest.fn(() => ({ sort: jest.fn() })),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

const { default: resolvers } = await import('../resolvers.js');

describe('Resolver auth enforcement', () => {
  test('createQuestion rejects anonymous request', async () => {
    await expect(
      resolvers.Mutation.createQuestion(null, { title: 'T', body: 'B' }, { user: null })
    ).rejects.toMatchObject({
      message: 'Authentication required',
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  test('addAnswer rejects anonymous request', async () => {
    await expect(
      resolvers.Mutation.addAnswer(null, { questionId: '507f1f77bcf86cd799439011', body: 'A' }, { user: null })
    ).rejects.toMatchObject({
      message: 'Authentication required',
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  test('createQuestion proceeds past auth guard when user is present', async () => {
    // Validation throws BAD_USER_INPUT (not UNAUTHENTICATED) — proves auth guard was passed
    await expect(
      resolvers.Mutation.createQuestion(null, { title: '', body: '' }, { user: { userId: '1', username: 'alice' } })
    ).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });

  test('addAnswer proceeds past auth guard when user is present', async () => {
    // Empty body triggers BAD_USER_INPUT — proves auth guard was passed
    await expect(
      resolvers.Mutation.addAnswer(null, { questionId: '507f1f77bcf86cd799439011', body: '' }, { user: { userId: '1', username: 'alice' } })
    ).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });
});
