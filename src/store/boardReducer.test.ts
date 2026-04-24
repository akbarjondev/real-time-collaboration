import { describe, it, expect } from 'vitest'
import { boardReducer, initialBoardState } from '@/store/boardReducer'
import type { BoardState } from '@/store/boardReducer'
import type { Task } from '@/types/task.types'

const mockTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: 'Login fails on Safari',
  assignee: 'Alice',
  status: 'todo',
  priority: 'high',
  tags: [],
  createdAt: '2026-01-15T10:00:00.000Z',
}

const stateWithTask: BoardState = {
  ...initialBoardState,
  tasks: [mockTask],
}

describe('boardReducer — TASK_DELETE', () => {
  it('removes the task from tasks[]', () => {
    const next = boardReducer(stateWithTask, {
      type: 'TASK_DELETE',
      taskId: 'task-1',
      opId: 'op-1',
    })
    expect(next.tasks).toHaveLength(0)
    expect(next.tasks.find(t => t.id === 'task-1')).toBeUndefined()
  })

  it('records pendingOps entry with snapshot and opType=delete', () => {
    const next = boardReducer(stateWithTask, {
      type: 'TASK_DELETE',
      taskId: 'task-1',
      opId: 'op-1',
    })
    const op = next.pendingOps.get('op-1')
    expect(op).toBeDefined()
    expect(op?.taskId).toBe('task-1')
    expect(op?.snapshot).toEqual(mockTask)
    expect(op?.opType).toBe('delete')
  })

  it('is a no-op if task does not exist', () => {
    const next = boardReducer(stateWithTask, {
      type: 'TASK_DELETE',
      taskId: 'nonexistent',
      opId: 'op-1',
    })
    expect(next.tasks).toHaveLength(1)
    expect(next.pendingOps.size).toBe(0)
  })
})

describe('boardReducer — OP_ROLLBACK (delete)', () => {
  it('restores deleted task from pendingOps snapshot', () => {
    const stateAfterDelete = boardReducer(stateWithTask, {
      type: 'TASK_DELETE',
      taskId: 'task-1',
      opId: 'op-1',
    })
    expect(stateAfterDelete.tasks).toHaveLength(0)

    const restored = boardReducer(stateAfterDelete, {
      type: 'OP_ROLLBACK',
      opId: 'op-1',
    })
    expect(restored.tasks).toHaveLength(1)
    expect(restored.tasks[0]).toEqual(mockTask)
    expect(restored.pendingOps.size).toBe(0)
  })
})

describe('boardReducer — OP_ROLLBACK (create)', () => {
  it('removes optimistically created task on rollback', () => {
    const stateAfterCreate = boardReducer(initialBoardState, {
      type: 'TASK_CREATE',
      task: mockTask,
      opId: 'op-1',
    })
    expect(stateAfterCreate.tasks).toHaveLength(1)

    const rolledBack = boardReducer(stateAfterCreate, {
      type: 'OP_ROLLBACK',
      opId: 'op-1',
    })
    expect(rolledBack.tasks).toHaveLength(0)
    expect(rolledBack.pendingOps.size).toBe(0)
  })
})

describe('boardReducer — OP_ROLLBACK (update)', () => {
  it('restores pre-edit snapshot on update rollback', () => {
    const stateAfterUpdate = boardReducer(stateWithTask, {
      type: 'TASK_UPDATE',
      taskId: 'task-1',
      changes: { title: 'Updated title' },
      opId: 'op-1',
    })
    expect(stateAfterUpdate.tasks[0]?.title).toBe('Updated title')

    const rolledBack = boardReducer(stateAfterUpdate, {
      type: 'OP_ROLLBACK',
      opId: 'op-1',
    })
    expect(rolledBack.tasks[0]?.title).toBe('Fix login bug')
    expect(rolledBack.pendingOps.size).toBe(0)
  })
})

describe('boardReducer — OP_SUCCESS', () => {
  it('clears pendingOps entry on success', () => {
    const stateAfterDelete = boardReducer(stateWithTask, {
      type: 'TASK_DELETE',
      taskId: 'task-1',
      opId: 'op-1',
    })
    expect(stateAfterDelete.pendingOps.size).toBe(1)

    const next = boardReducer(stateAfterDelete, {
      type: 'OP_SUCCESS',
      opId: 'op-1',
    })
    expect(next.pendingOps.size).toBe(0)
    expect(next.tasks).toHaveLength(0)
  })
})

describe('boardReducer — TASK_CREATE', () => {
  it('adds task to tasks[] immediately', () => {
    const next = boardReducer(initialBoardState, {
      type: 'TASK_CREATE',
      task: mockTask,
      opId: 'op-1',
    })
    expect(next.tasks).toHaveLength(1)
    expect(next.tasks[0]).toEqual(mockTask)
  })

  it('records pendingOps entry with opType=create', () => {
    const next = boardReducer(initialBoardState, {
      type: 'TASK_CREATE',
      task: mockTask,
      opId: 'op-1',
    })
    const op = next.pendingOps.get('op-1')
    expect(op?.opType).toBe('create')
    expect(op?.taskId).toBe('task-1')
  })
})
