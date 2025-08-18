import { Sandbox } from '@e2b/code-interpreter'
import { AgentResult, TextMessage } from '@inngest/agent-kit'

export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId)
  return sandbox
}

export function lastAssistantTextMessageContent(result: AgentResult) {
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
