import { sleep } from '@/shared/utils/sleep'

export class MockApiError extends Error {
  constructor(message = 'Simulated API failure') {
    super(message)
    this.name = 'MockApiError'
  }
}

export async function mockRequest<T>(
  fn: () => T,
  opts = { delay: 2000, failureRate: 0.1 }
): Promise<T> {
  await sleep(opts.delay)
  if (Math.random() < opts.failureRate) throw new MockApiError()
  return fn()
}
