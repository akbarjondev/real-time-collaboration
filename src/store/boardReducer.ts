import type { Task, TaskStatus } from "@/types/task.types";
import type { PendingOperation, ConflictState } from "@/types/common.types";

export type BoardState = {
  tasks: Task[];
  pendingOps: Map<string, PendingOperation>;
  conflict: ConflictState | null;
};

export type BoardAction =
  | { type: "TASK_MOVE"; taskId: string; newStatus: TaskStatus; opId: string }
  | { type: "TASK_CREATE"; task: Task; opId: string }
  | {
      type: "TASK_UPDATE";
      taskId: string;
      changes: Partial<Task>;
      opId: string;
    }
  | { type: "TASK_DELETE"; taskId: string; opId: string }
  | { type: "OP_SUCCESS"; opId: string }
  | { type: "OP_ROLLBACK"; opId: string }
  | { type: "REMOTE_UPDATE"; task: Task }
  | {
      type: "CONFLICT_DETECTED";
      taskId: string;
      remoteTask: Task;
      localTask: Task;
    }
  | { type: "CONFLICT_RESOLVE_MINE"; taskId: string }
  | { type: "CONFLICT_RESOLVE_THEIRS"; taskId: string; remoteTask: Task };

export const initialBoardState: BoardState = {
  tasks: [],
  pendingOps: new Map(),
  conflict: null,
};

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "TASK_MOVE": {
      const snapshot = state.tasks.find((t) => t.id === action.taskId);
      if (!snapshot) return state;
      const newPendingOps = new Map(state.pendingOps);
      newPendingOps.set(action.opId, {
        opId: action.opId,
        taskId: action.taskId,
        snapshot,
        opType: "move",
      });
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, status: action.newStatus } : t,
        ),
        pendingOps: newPendingOps,
      };
    }

    case "TASK_CREATE": {
      const newPendingOps = new Map(state.pendingOps);
      newPendingOps.set(action.opId, {
        opId: action.opId,
        taskId: action.task.id,
        snapshot: action.task,
        opType: "create",
      });
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        pendingOps: newPendingOps,
      };
    }

    case "TASK_UPDATE": {
      const snapshot = state.tasks.find((t) => t.id === action.taskId);
      if (!snapshot) return state;
      const newPendingOps = new Map(state.pendingOps);
      newPendingOps.set(action.opId, {
        opId: action.opId,
        taskId: action.taskId,
        snapshot,
        opType: "update",
      });
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.changes } : t,
        ),
        pendingOps: newPendingOps,
      };
    }

    case "TASK_DELETE": {
      const snapshot = state.tasks.find((t) => t.id === action.taskId);
      if (!snapshot) return state;
      const newPendingOps = new Map(state.pendingOps);
      newPendingOps.set(action.opId, {
        opId: action.opId,
        taskId: action.taskId,
        snapshot,
        opType: "delete",
      });
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
        pendingOps: newPendingOps,
      };
    }

    case "OP_SUCCESS": {
      const newPendingOps = new Map(state.pendingOps);
      newPendingOps.delete(action.opId);
      return { ...state, pendingOps: newPendingOps };
    }

    case "OP_ROLLBACK": {
      const op = state.pendingOps.get(action.opId);
      if (!op) return state;
      const newPendingOps = new Map(state.pendingOps);
      newPendingOps.delete(action.opId);

      let restoredTasks: Task[];
      if (op.opType === "create") {
        // Remove the optimistically added task
        restoredTasks = state.tasks.filter((t) => t.id !== op.taskId);
      } else if (op.opType === "delete") {
        // Restore the deleted task to end of list
        restoredTasks = [...state.tasks, op.snapshot];
      } else {
        // Restore pre-edit snapshot (update / move)
        restoredTasks = state.tasks.map((t) =>
          t.id === op.taskId ? op.snapshot : t,
        );
      }

      return { ...state, tasks: restoredTasks, pendingOps: newPendingOps };
    }

    case "REMOTE_UPDATE": {
      const exists = state.tasks.some((t) => t.id === action.task.id);
      return {
        ...state,
        tasks: exists
          ? state.tasks.map((t) => (t.id === action.task.id ? action.task : t))
          : [...state.tasks, action.task],
      };
    }

    case "CONFLICT_DETECTED": {
      return {
        ...state,
        conflict: {
          taskId: action.taskId,
          remoteTask: action.remoteTask,
          localTask: action.localTask,
        },
      };
    }

    case "CONFLICT_RESOLVE_MINE": {
      return { ...state, conflict: null };
    }

    case "CONFLICT_RESOLVE_THEIRS": {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? action.remoteTask : t,
        ),
        conflict: null,
      };
    }

    default:
      return state;
  }
}
