import {useEffect, useState} from 'react'
import {deploymentState, getRecentDeployments, nextDeploymentPollDelay} from './deployment'
import type {DeploymentRun, DeploymentTarget} from './deployment'

export interface DeploymentPollingOptions {
  referenceTimestamp: string
  pendingCount: number
  workflowFile?: string
  target?: DeploymentTarget
  missingReferenceError?: unknown
}

export interface DeploymentPollingResult {
  runs: DeploymentRun[]
  error: unknown
}

// Shared by the staging and production release panels in EditorialDashboard
// (previously two ~45-line copy-pasted useEffects). GitHub Actions changes
// independently from Sanity, so this polls immediately, then quickly while a
// post-publication run is expected, then slowly once the state is terminal.
// Cleanup aborts both the in-flight request and the pending timer.
export function useDeploymentPolling({
  referenceTimestamp,
  pendingCount,
  workflowFile,
  target,
  missingReferenceError,
}: DeploymentPollingOptions): DeploymentPollingResult {
  const [runs, setRuns] = useState<DeploymentRun[]>([])
  const [error, setError] = useState<unknown>(missingReferenceError)

  useEffect(() => {
    if (!referenceTimestamp) {
      setRuns([])
      setError(missingReferenceError)
      return undefined
    }

    const controller = new AbortController()
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const nextRuns = await getRecentDeployments(controller.signal, workflowFile)
        if (cancelled) return
        setRuns(nextRuns)
        setError(undefined)
        const nextState = deploymentState({
          runs: nextRuns,
          publishedAt: referenceTimestamp,
          pendingCount,
          target,
        })
        const elapsedMs = Math.max(0, Date.now() - new Date(referenceTimestamp).getTime())
        timer = setTimeout(
          () => void load(),
          nextDeploymentPollDelay({elapsedMs, terminal: nextState.terminal, firstPoll: false}),
        )
      } catch (reason) {
        if (cancelled || (reason instanceof DOMException && reason.name === 'AbortError')) return
        setError(reason)
        timer = setTimeout(() => void load(), 5 * 60_000)
      }
    }

    timer = setTimeout(
      () => void load(),
      nextDeploymentPollDelay({elapsedMs: 0, terminal: false, firstPoll: true}),
    )
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceTimestamp, pendingCount, workflowFile, target])

  return {runs, error}
}
