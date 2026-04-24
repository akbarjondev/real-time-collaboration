import { nanoid } from 'nanoid'
import type { Task, TaskStatus, Priority } from '@/types/task.types'

const r = () => new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()

const SEED_TITLES = [
  'Add input validation to form fields',
  'Write E2E tests for checkout flow',
  'Refactor API response normalizer',
  'Fix tooltip z-index on mobile',
  'Migrate config to environment variables',
  'Add skeleton loading states',
  'Implement infinite scroll',
  'Audit console warnings in dev mode',
  'Set up feature flags service',
  'Add retry logic to API calls',
  'Resolve flaky test in CI',
  'Document component props with JSDoc',
  'Upgrade React Router to v7',
  'Fix memory leak in WebSocket hook',
  'Add dark mode support',
  'Implement CSV import feature',
  'Profile render performance with DevTools',
  'Add keyboard shortcuts reference modal',
  'Write migration guide for v2 API',
  'Set up end-to-end test environment',
  'Improve error messages in form validation',
  'Add loading spinner to data tables',
  'Fix date formatting for non-US locales',
  'Implement task archiving feature',
  'Optimize image assets with WebP',
  'Add search highlight to results',
  'Set up Redis caching layer',
  'Write database backup automation script',
  'Fix broken links in help docs',
  'Implement two-factor authentication',
  'Add chart visualizations to dashboard',
  'Review and merge open pull requests',
  'Create reusable modal component',
  'Add copy-to-clipboard utility',
  'Implement batch delete for tasks',
  'Fix tab order in settings modal',
  'Add pagination controls to list view',
  'Write integration test for auth flow',
  'Compress API response payloads with gzip',
  'Implement drag-to-reorder in sidebar',
  'Add custom font loading optimization',
  'Fix focus ring visibility on Safari',
  'Set up automated dependency updates',
  'Implement offline mode with service worker',
  'Add multi-language support (i18n)',
  'Audit accessibility with screen reader',
  'Implement task priority sorting',
  'Add webhook support for integrations',
  'Write load test for task list endpoint',
  'Set up log aggregation with Datadog',
]

const ASSIGNEES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const TAGS = ['frontend', 'backend', 'testing', 'devops', 'security', 'performance', 'dx', 'a11y']

function generateTasks(status: TaskStatus, count: number, startIndex: number): Task[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i
    const title = SEED_TITLES[idx % SEED_TITLES.length]!
    const suffix = Math.floor(idx / SEED_TITLES.length)
    return {
      id: nanoid(),
      title: suffix > 0 ? `${title} (${suffix + 1})` : title,
      assignee: ASSIGNEES[idx % ASSIGNEES.length],
      status,
      priority: PRIORITIES[idx % PRIORITIES.length]!,
      tags: idx % 3 === 0 ? [{ id: nanoid(), label: TAGS[idx % TAGS.length]! }] : [],
      createdAt: r(),
    }
  })
}

export const MOCK_TASKS: Task[] = [
  // todo (8 seed + 164 generated = 172)
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
  ...generateTasks('todo', 164, 0),

  // in-progress (9 seed + 164 generated = 173)
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
  ...generateTasks('in-progress', 164, 100),

  // done (8 seed + 164 generated = 172)
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
  ...generateTasks('done', 164, 200),
]
