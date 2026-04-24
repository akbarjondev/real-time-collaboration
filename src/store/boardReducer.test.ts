import { describe, it, expect } from 'vitest'
import { boardReducer, initialBoardState } from '@/store/boardReducer'
import type { BoardState } from '@/store/boardReducer'
import type { Task } from '@/types/task.types'
import type { PendingOperation } from '@/types/common.types'

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

describe('boardReducer — concurrent mutation isolation', () => {
  const task2: Task = {
    id: 'task-2',
    title: 'Add dark mode',
    assignee: 'Bob',
    status: 'in-progress',
    priority: 'medium',
    tags: [],
    createdAt: '2026-01-16T10:00:00.000Z',
  }

  it('rolling back opId-2 (different task) leaves opId-1 pending entry intact', () => {
    // Two concurrent TASK_MOVE ops on different tasks
    const stateWith2Tasks = { ...initialBoardState, tasks: [mockTask, task2] }

    const afterMove1 = boardReducer(stateWith2Tasks, {
      type: 'TASK_MOVE',
      taskId: 'task-1',
      newStatus: 'in-progress',
      opId: 'op-1',
    })
    const afterMove2 = boardReducer(afterMove1, {
      type: 'TASK_MOVE',
      taskId: 'task-2',
      newStatus: 'done',
      opId: 'op-2',
    })

    expect(afterMove2.pendingOps.size).toBe(2)

    // Roll back op-2 only
    const afterRollback = boardReducer(afterMove2, {
      type: 'OP_ROLLBACK',
      opId: 'op-2',
    })

    // op-1 entry must still be present
    expect(afterRollback.pendingOps.get('op-1')).toBeDefined()
    expect(afterRollback.pendingOps.get('op-2')).toBeUndefined()
    expect(afterRollback.pendingOps.size).toBe(1)

    // task-2 reverted; task-1 still at optimistic status
    const t1 = afterRollback.tasks.find(t => t.id === 'task-1')
    const t2 = afterRollback.tasks.find(t => t.id === 'task-2')
    expect(t1?.status).toBe('in-progress')
    expect(t2?.status).toBe('in-progress')
  })

  it('rolling back opId-2 on the same task restores opId-2 snapshot (post-opId-1 state)', () => {
    // Two concurrent TASK_UPDATE ops on the same task
    const afterUpdate1 = boardReducer(stateWithTask, {
      type: 'TASK_UPDATE',
      taskId: 'task-1',
      changes: { title: 'After op-1' },
      opId: 'op-1',
    })
    const afterUpdate2 = boardReducer(afterUpdate1, {
      type: 'TASK_UPDATE',
      taskId: 'task-1',
      changes: { title: 'After op-2' },
      opId: 'op-2',
    })

    // op-2 snapshot is the post-op-1 state
    const op2Snapshot = afterUpdate2.pendingOps.get('op-2')?.snapshot
    expect(op2Snapshot?.title).toBe('After op-1')

    // Roll back op-2 → restores post-op-1 title, not original
    const afterRollback = boardReducer(afterUpdate2, {
      type: 'OP_ROLLBACK',
      opId: 'op-2',
    })
    expect(afterRollback.tasks[0]?.title).toBe('After op-1')
    expect(afterRollback.pendingOps.get('op-1')).toBeDefined()
  })

  it('OP_SUCCESS for opId-1 does not affect opId-2 pending entry', () => {
    const stateWith2Tasks = { ...initialBoardState, tasks: [mockTask, task2] }

    const afterMove1 = boardReducer(stateWith2Tasks, {
      type: 'TASK_MOVE',
      taskId: 'task-1',
      newStatus: 'done',
      opId: 'op-1',
    })
    const afterMove2 = boardReducer(afterMove1, {
      type: 'TASK_MOVE',
      taskId: 'task-2',
      newStatus: 'done',
      opId: 'op-2',
    })

    const afterSuccess1 = boardReducer(afterMove2, {
      type: 'OP_SUCCESS',
      opId: 'op-1',
    })

    expect(afterSuccess1.pendingOps.get('op-1')).toBeUndefined()
    expect(afterSuccess1.pendingOps.get('op-2')).toBeDefined()
    expect(afterSuccess1.pendingOps.size).toBe(1)
  })
})

describe('boardReducer — object reference preservation', () => {
  const taskA: Task = { ...mockTask, id: 'task-a', title: 'Task A', status: 'todo' }
  const taskB: Task = { ...mockTask, id: 'task-b', title: 'Task B', status: 'todo' }
  const stateWith2: BoardState = { ...initialBoardState, tasks: [taskA, taskB] }

  it('TASK_MOVE: unchanged task keeps exact object reference', () => {
    const next = boardReducer(stateWith2, {
      type: 'TASK_MOVE',
      taskId: 'task-a',
      newStatus: 'done',
      opId: 'op-1',
    })
    expect(next.tasks.find(t => t.id === 'task-b')).toBe(taskB)
    expect(next.tasks.find(t => t.id === 'task-a')).not.toBe(taskA)
  })

  it('TASK_UPDATE: unchanged task keeps exact object reference', () => {
    const next = boardReducer(stateWith2, {
      type: 'TASK_UPDATE',
      taskId: 'task-a',
      changes: { title: 'Updated A' },
      opId: 'op-1',
    })
    expect(next.tasks.find(t => t.id === 'task-b')).toBe(taskB)
    expect(next.tasks.find(t => t.id === 'task-a')).not.toBe(taskA)
  })

  it('TASK_CREATE: existing tasks keep exact object references', () => {
    const newTask: Task = { ...mockTask, id: 'task-new', title: 'New' }
    const next = boardReducer(stateWith2, {
      type: 'TASK_CREATE',
      task: newTask,
      opId: 'op-1',
    })
    expect(next.tasks.find(t => t.id === 'task-a')).toBe(taskA)
    expect(next.tasks.find(t => t.id === 'task-b')).toBe(taskB)
  })

  it('TASK_DELETE: remaining tasks keep exact object references', () => {
    const next = boardReducer(stateWith2, {
      type: 'TASK_DELETE',
      taskId: 'task-a',
      opId: 'op-1',
    })
    expect(next.tasks.find(t => t.id === 'task-b')).toBe(taskB)
  })
})

  it('changes task status — task appears in new status', () => {
    const task: Task = { ...mockTask, status: 'todo' }
    const state: BoardState = { ...initialBoardState, tasks: [task] }
    const updated = boardReducer(state, {
      type: 'REMOTE_UPDATE',
      task: { ...task, status: 'done' },
    })
    expect(updated.tasks[0]?.status).toBe('done')
  })

  it('upserts task by replacing matching entry in place', () => {
    const state: BoardState = { ...initialBoardState, tasks: [mockTask] }
    const updated = boardReducer(state, {
      type: 'REMOTE_UPDATE',
      task: { ...mockTask, priority: 'low' },
    })
    expect(updated.tasks).toHaveLength(1)
    expect(updated.tasks[0]?.priority).toBe('low')
  })

  it('on task with pending op — op remains in map and task is updated', () => {
    const op: PendingOperation = { opId: 'op1', taskId: mockTask.id, snapshot: mockTask, opType: 'move' }
    const state: BoardState = {
      ...initialBoardState,
      tasks: [mockTask],
      pendingOps: new Map([['op1', op]]),
    }
    const updated = boardReducer(state, {
      type: 'REMOTE_UPDATE',
      task: { ...mockTask, priority: 'high' },
    })
    expect(updated.pendingOps.has('op1')).toBe(true)
    expect(updated.tasks[0]?.priority).toBe('high')
  })
})

