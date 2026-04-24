import { nanoid } from 'nanoid'
import type { Task } from '@/types/task.types'

const r = () => new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()

export const MOCK_TASKS: Task[] = [
  // todo (8)
  {
    id: nanoid(), title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', assignee: 'Alice', status: 'todo', priority: 'high', tags: [{ id: nanoid(), label: 'devops' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Add rate limiting to API endpoints', description: 'Implement per-IP rate limiting using a sliding window algorithm.', assignee: 'Bob', status: 'todo', priority: 'high', tags: [{ id: nanoid(), label: 'backend' }, { id: nanoid(), label: 'security' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Write onboarding documentation', assignee: 'Carol', status: 'todo', priority: 'medium', tags: [{ id: nanoid(), label: 'dx' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Integrate Sentry error tracking', description: 'Add Sentry DSN and configure source maps for production.', assignee: 'Dave', status: 'todo', priority: 'medium', tags: [{ id: nanoid(), label: 'devops' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Implement CSV export for reports', description: 'Allow users to download filtered task lists as CSV files.', assignee: 'Alice', status: 'todo', priority: 'medium', tags: [{ id: nanoid(), label: 'frontend' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Configure staging environment secrets', status: 'todo', priority: 'high', tags: [], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Audit third-party dependency licenses', status: 'todo', priority: 'low', tags: [], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Add OpenGraph meta tags', description: 'Improve social sharing previews by adding og:title, og:description, og:image.', assignee: 'Carol', status: 'todo', priority: 'low', tags: [{ id: nanoid(), label: 'frontend' }], createdAt: r(),
  },
  // in-progress (9)
  {
    id: nanoid(), title: 'Implement authentication middleware', description: 'Add JWT validation and session refresh logic to the middleware chain.', assignee: 'Alice', status: 'in-progress', priority: 'high', tags: [{ id: nanoid(), label: 'backend' }, { id: nanoid(), label: 'security' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Refactor database query layer', description: 'Replace raw SQL strings with a type-safe query builder.', assignee: 'Bob', status: 'in-progress', priority: 'high', tags: [{ id: nanoid(), label: 'backend' }, { id: nanoid(), label: 'performance' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Build real-time notification service', description: 'Implement WebSocket-based push notifications for task updates.', assignee: 'Dave', status: 'in-progress', priority: 'high', tags: [{ id: nanoid(), label: 'backend' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Add pagination to task list endpoint', assignee: 'Carol', status: 'in-progress', priority: 'medium', tags: [{ id: nanoid(), label: 'backend' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Migrate legacy endpoints to REST v2', description: 'Deprecate v1 routes and redirect consumers to v2 equivalents.', assignee: 'Bob', status: 'in-progress', priority: 'medium', tags: [{ id: nanoid(), label: 'backend' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Implement role-based access control', description: 'Gate admin actions behind a role check in the middleware layer.', assignee: 'Alice', status: 'in-progress', priority: 'high', tags: [{ id: nanoid(), label: 'security' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Write unit tests for boardReducer', description: 'Cover all 11 action types including rollback and conflict resolution.', assignee: 'Dave', status: 'in-progress', priority: 'medium', tags: [{ id: nanoid(), label: 'testing' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Optimize bundle size with code splitting', description: 'Lazy-load route-level chunks to reduce initial load time.', assignee: 'Carol', status: 'in-progress', priority: 'medium', tags: [{ id: nanoid(), label: 'frontend' }, { id: nanoid(), label: 'performance' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Fix race condition in session refresh', description: 'Queue concurrent requests while a token refresh is in-flight.', assignee: 'Bob', status: 'in-progress', priority: 'high', tags: [{ id: nanoid(), label: 'backend' }, { id: nanoid(), label: 'security' }], createdAt: r(),
  },
  // done (8)
  {
    id: nanoid(), title: 'Initialize Vite project with TypeScript', status: 'done', priority: 'high', tags: [{ id: nanoid(), label: 'dx' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Configure Tailwind CSS v4', status: 'done', priority: 'medium', tags: [{ id: nanoid(), label: 'frontend' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Define core Task and Tag types', assignee: 'Alice', status: 'done', priority: 'high', tags: [{ id: nanoid(), label: 'dx' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Set up Vitest with jsdom environment', assignee: 'Bob', status: 'done', priority: 'medium', tags: [{ id: nanoid(), label: 'testing' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Scaffold feature-based folder structure', status: 'done', priority: 'low', tags: [], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Create mock API client with error simulation', assignee: 'Dave', status: 'done', priority: 'medium', tags: [{ id: nanoid(), label: 'testing' }], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Implement sleep utility', status: 'done', priority: 'low', tags: [], createdAt: r(),
  },
  {
    id: nanoid(), title: 'Seed 25 development tasks', assignee: 'Carol', status: 'done', priority: 'low', tags: [{ id: nanoid(), label: 'dx' }], createdAt: r(),
  },
]
