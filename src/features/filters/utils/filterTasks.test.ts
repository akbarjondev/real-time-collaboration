import { describe, it, expect } from 'vitest'
import { filterTasks } from './filterTasks'
import type { Task } from '@/types/task.types'
import type { FilterState } from '@/store/FilterContext'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Default Task',
    description: undefined,
    assignee: 'Alice',
    status: 'todo',
    priority: 'medium',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const emptyFilters: FilterState = { assignee: null, priority: null, searchQuery: '' }

describe('filterTasks', () => {
  it('returns all tasks when all filters are empty', () => {
    const tasks = [makeTask({ id: '1' }), makeTask({ id: '2' })]
    expect(filterTasks(tasks, emptyFilters)).toBe(tasks)
  })

  it('filters by assignee (exact match)', () => {
    const tasks = [
      makeTask({ id: '1', assignee: 'Alice' }),
      makeTask({ id: '2', assignee: 'Bob' }),
      makeTask({ id: '3', assignee: 'Alice' }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, assignee: 'Alice' })
    expect(result).toHaveLength(2)
    expect(result.every(t => t.assignee === 'Alice')).toBe(true)
  })

  it('filters by priority (exact match)', () => {
    const tasks = [
      makeTask({ id: '1', priority: 'high' }),
      makeTask({ id: '2', priority: 'medium' }),
      makeTask({ id: '3', priority: 'high' }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, priority: 'high' })
    expect(result).toHaveLength(2)
    expect(result.every(t => t.priority === 'high')).toBe(true)
  })

  it('filters by searchQuery matching title (case-insensitive)', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Fix Login Bug' }),
      makeTask({ id: '2', title: 'Add Dashboard' }),
      makeTask({ id: '3', title: 'Fix logout flow' }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, searchQuery: 'fix' })
    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe('1')
    expect(result[1]?.id).toBe('3')
  })

  it('filters by searchQuery matching description (case-insensitive)', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Task A', description: 'Needs refactoring' }),
      makeTask({ id: '2', title: 'Task B', description: 'Add unit tests' }),
      makeTask({ id: '3', title: 'Task C', description: undefined }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, searchQuery: 'refactor' })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('ANDs assignee + priority filters', () => {
    const tasks = [
      makeTask({ id: '1', assignee: 'Alice', priority: 'high' }),
      makeTask({ id: '2', assignee: 'Alice', priority: 'low' }),
      makeTask({ id: '3', assignee: 'Bob', priority: 'high' }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, assignee: 'Alice', priority: 'high' })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('ANDs assignee + searchQuery filters', () => {
    const tasks = [
      makeTask({ id: '1', assignee: 'Alice', title: 'Fix bug' }),
      makeTask({ id: '2', assignee: 'Bob', title: 'Fix bug' }),
      makeTask({ id: '3', assignee: 'Alice', title: 'Add feature' }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, assignee: 'Alice', searchQuery: 'fix' })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('returns empty array when no tasks match', () => {
    const tasks = [
      makeTask({ id: '1', assignee: 'Alice' }),
      makeTask({ id: '2', assignee: 'Bob' }),
    ]
    const result = filterTasks(tasks, { ...emptyFilters, assignee: 'Carol' })
    expect(result).toHaveLength(0)
  })

  it('ignores null assignee/priority (partial filter state)', () => {
    const tasks = [
      makeTask({ id: '1', assignee: 'Alice', priority: 'high' }),
      makeTask({ id: '2', assignee: 'Bob', priority: 'high' }),
    ]
    const result = filterTasks(tasks, { assignee: null, priority: 'high', searchQuery: '' })
    expect(result).toHaveLength(2)
  })

  it('handles tasks with undefined description gracefully', () => {
    const tasks = [makeTask({ id: '1', title: 'Task A', description: undefined })]
    const result = filterTasks(tasks, { ...emptyFilters, searchQuery: 'task a' })
    expect(result).toHaveLength(1)
  })
})
