/**
 * Workflow engine — Temporal-shaped abstraction with an in-process executor.
 *
 * Why this shape:
 *   - In dev/MVP we can't easily run Temporal Server (Cassandra, schema, etc).
 *   - But the architectural goals from §5 of the roadmap are non-negotiable:
 *       deterministic, idempotent, replayable, crash-resumable, with
 *       compensating transactions on failure.
 *   - So we model workflows as ordered steps with idempotency keys and
 *     persisted state. The same Workflow definitions can later run against
 *     real Temporal by swapping the Executor.
 *
 * Runtime guarantees today:
 *   - Each step is keyed by (workflowId, stepName) and persisted to DB.
 *   - On crash + restart, the reconciler resumes from the last completed step.
 *   - Steps can declare a compensating action that runs in reverse on failure.
 *   - Retries with exponential backoff per step.
 */

import prisma from '../utils/prisma'
import logger from '../utils/logger'

export type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'compensated'

export interface WorkflowState {
  id: string
  type: string
  resourceId: string                // e.g. server.id
  status: 'running' | 'succeeded' | 'failed' | 'compensating' | 'compensated'
  currentStep: string | null
  context: Record<string, any>      // free-form per-workflow data
  steps: StepRecord[]
  startedAt: Date
  finishedAt: Date | null
  error: string | null
}

export interface StepRecord {
  name: string
  status: StepStatus
  attempts: number
  output?: any
  error?: string
  startedAt?: Date
  finishedAt?: Date
}

export interface StepDef<TCtx> {
  name: string
  /**
   * The activity. Receives the current context and returns a partial context
   * that will be merged after the step completes successfully.
   *
   * MUST be idempotent — it may be called more than once for the same step
   * if the worker crashes mid-execution. Use external keys like
   * (workflowId, stepName) when calling out to providers (Proxmox, Cloudflare,
   * Razorpay, etc.).
   */
  run: (ctx: TCtx) => Promise<Partial<TCtx> | void>
  /**
   * Optional compensating action. Runs in reverse order from the last
   * succeeded step when the workflow fails after this step.
   */
  compensate?: (ctx: TCtx) => Promise<void>
  /** Retry policy for transient failures. */
  retry?: {
    maxAttempts?: number      // default 3
    backoffMs?: number        // base backoff, default 1000
  }
}

export interface WorkflowDef<TCtx> {
  type: string
  steps: StepDef<TCtx>[]
}

/* ─── Executor ──────────────────────────────────────────────── */

type Listener = (state: WorkflowState) => void
const listeners = new Set<Listener>()
export function onWorkflowEvent(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit(state: WorkflowState) {
  for (const fn of listeners) {
    try { fn(state) } catch (e: any) { logger.warn({ err: e }, 'workflow listener error') }
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function loadState(id: string): Promise<WorkflowState | null> {
  const row = await prisma.workflowRun.findUnique({ where: { id } })
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    resourceId: row.resourceId,
    status: row.status as any,
    currentStep: row.currentStep,
    context: safeJSON(row.context, {}),
    steps: safeJSON(row.steps, []) as StepRecord[],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    error: row.error,
  }
}

async function saveState(s: WorkflowState): Promise<void> {
  await prisma.workflowRun.upsert({
    where: { id: s.id },
    update: {
      status: s.status,
      currentStep: s.currentStep,
      context: JSON.stringify(s.context),
      steps: JSON.stringify(s.steps),
      finishedAt: s.finishedAt,
      error: s.error,
    },
    create: {
      id: s.id,
      type: s.type,
      resourceId: s.resourceId,
      status: s.status,
      currentStep: s.currentStep,
      context: JSON.stringify(s.context),
      steps: JSON.stringify(s.steps),
      startedAt: s.startedAt,
      error: s.error,
    },
  })
  emit(s)
}

const safeJSON = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

/* ─── Public API ────────────────────────────────────────────── */

/**
 * Start a new workflow. Returns the workflow id immediately. Execution runs
 * asynchronously; subscribe via onWorkflowEvent or poll loadWorkflow().
 *
 * Idempotency: pass the same `id` to resume an existing workflow rather than
 * starting a new one. The executor will pick up at the next pending step.
 */
export async function startWorkflow<TCtx extends object>(
  def: WorkflowDef<TCtx>,
  args: { id: string; resourceId: string; context: TCtx }
): Promise<WorkflowState> {
  let state = await loadState(args.id)
  if (!state) {
    state = {
      id: args.id,
      type: def.type,
      resourceId: args.resourceId,
      status: 'running',
      currentStep: def.steps[0]?.name ?? null,
      context: args.context as any,
      steps: def.steps.map((s) => ({ name: s.name, status: 'pending' as StepStatus, attempts: 0 })),
      startedAt: new Date(),
      finishedAt: null,
      error: null,
    }
    await saveState(state)
  } else if (state.status === 'succeeded') {
    return state // idempotent — already done
  } else if (state.status === 'failed' || state.status === 'compensated') {
    return state // already terminal
  }

  // Run async — caller doesn't await. Errors become `failed` state.
  void execute(def, state).catch((err) =>
    logger.error({ err, workflowId: args.id }, 'workflow execute crashed')
  )
  return state
}

/** Look up a workflow by id. */
export async function loadWorkflow(id: string): Promise<WorkflowState | null> {
  return loadState(id)
}

/** Resume any workflow that's still in 'running' state (called by reconciler). */
export async function resumeRunning<TCtx extends object>(def: WorkflowDef<TCtx>): Promise<number> {
  const stuck = await prisma.workflowRun.findMany({
    where: { type: def.type, status: 'running' },
    select: { id: true },
    take: 100,
  })
  for (const { id } of stuck) {
    const state = await loadState(id)
    if (state) {
      void execute(def, state).catch((err) =>
        logger.error({ err, workflowId: id }, 'workflow resume crashed')
      )
    }
  }
  return stuck.length
}

/* ─── Core execution loop ──────────────────────────────────── */

async function execute<TCtx extends object>(
  def: WorkflowDef<TCtx>,
  state: WorkflowState
): Promise<void> {
  const log = logger.child({ workflowId: state.id, type: state.type })

  try {
    for (const step of def.steps) {
      const rec = state.steps.find((s) => s.name === step.name)!
      if (rec.status === 'succeeded') continue

      state.currentStep = step.name
      rec.status = 'running'
      rec.startedAt = rec.startedAt ?? new Date()
      await saveState(state)

      const maxAttempts = step.retry?.maxAttempts ?? 3
      const backoffMs = step.retry?.backoffMs ?? 1000

      let lastError: any = null
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        rec.attempts = attempt
        try {
          log.info({ step: step.name, attempt }, 'step starting')
          const out = await step.run(state.context as TCtx)
          if (out && typeof out === 'object') {
            state.context = { ...state.context, ...out }
          }
          rec.status = 'succeeded'
          rec.finishedAt = new Date()
          rec.error = undefined
          await saveState(state)
          log.info({ step: step.name }, 'step succeeded')
          break
        } catch (err: any) {
          lastError = err
          rec.error = err.message
          log.warn({ step: step.name, attempt, err: err.message }, 'step failed')
          if (attempt < maxAttempts) {
            await sleep(backoffMs * Math.pow(2, attempt - 1))
          }
        }
      }

      if (rec.status !== 'succeeded') {
        rec.status = 'failed'
        rec.finishedAt = new Date()
        state.status = 'compensating'
        state.error = `${step.name}: ${lastError?.message || 'unknown error'}`
        await saveState(state)

        // Compensate completed steps in reverse order
        await compensate(def, state, log)
        return
      }
    }

    state.status = 'succeeded'
    state.currentStep = null
    state.finishedAt = new Date()
    await saveState(state)
    log.info('workflow succeeded')
  } catch (err: any) {
    state.status = 'failed'
    state.error = err.message
    state.finishedAt = new Date()
    await saveState(state)
    log.error({ err }, 'workflow crashed')
  }
}

async function compensate<TCtx extends object>(
  def: WorkflowDef<TCtx>,
  state: WorkflowState,
  log: ReturnType<typeof logger.child>
): Promise<void> {
  for (let i = def.steps.length - 1; i >= 0; i--) {
    const step = def.steps[i]
    const rec = state.steps.find((s) => s.name === step.name)
    if (!rec || rec.status !== 'succeeded') continue
    if (!step.compensate) continue
    try {
      log.info({ step: step.name }, 'compensating')
      await step.compensate(state.context as TCtx)
      rec.status = 'compensated'
      await saveState(state)
    } catch (err: any) {
      log.error({ step: step.name, err: err.message }, 'compensation failed')
      // Don't abort compensation; keep going to release as much as possible
    }
  }
  state.status = 'compensated'
  await saveState(state)
}
