import { SANDBOX_TIMEOUT } from '@/types'
import { Sandbox } from '@e2b/code-interpreter'
import { AgentResult, TextMessage } from '@inngest/agent-kit'

export const getSandbox = async (sandboxId: string) => {
  const sandbox = await Sandbox.connect(sandboxId)
  await sandbox.setTimeout(SANDBOX_TIMEOUT)
  return sandbox
}

export const lastAssistantTextMessageContent = (result: AgentResult) => {
  const lastAssistantTextMessageindex = result.output.findLastIndex(
    (msg) => msg.role === 'assistant'
  )
  const msg = result.output[lastAssistantTextMessageindex] as
    | TextMessage
    | undefined

  return msg?.content
    ? typeof msg.content === 'string'
      ? msg.content
      : msg.content.map((c) => c.text).join('')
    : undefined
}
