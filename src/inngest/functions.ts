import prisma from '@/lib/prisma'
import { parseAgentOutput } from '@/lib/utils'
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/prompt'
import { SANDBOX_TIMEOUT } from '@/types'
import { Sandbox } from '@e2b/code-interpreter'
import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  gemini,
  type Message,
  type Tool,
} from '@inngest/agent-kit'
import z from 'zod'
import { inngest } from './client'
import { getSandbox, lastAssistantTextMessageContent } from './utils'

interface AgentState {
  summary: string
  files: { [path: string]: string }
}

const AIMODEL = gemini({
  model: 'gemini-2.0-flash-lite',
})

// const AIMODEL = openai({
//   model: 'gpt-4o',
//   // defaultParameters: { temperature: 0.1 },
// })
// const AIMODEL = openai({
//   model: 'glm-4.5-flash',
//   // baseUrl: 'https://api.z.ai/api/anthropic',
//   // baseUrl: 'https://api.z.ai/api/paas/v4/chat/completions',
//   baseUrl: 'https://api.z.ai/api/v1/agents',
//   apiKey: 'f97bdbf215fb47f9b297889a335c670a.UPOKvFIQkeheTXwv',
//   // defaultParameters: { temperature: 0.1 },
// })
// const AIMODEL = openai({
//   model: 'k2',
//   baseUrl: 'https://api.moonshot.ai/anthropic'
//   // defaultParameters: { temperature: 0.1 },
// })

export const codeAgentFunction = inngest.createFunction(
  { id: 'code-agent' },
  { event: 'code-agent/run' },
  async ({ event, step }) => {
    // await step.sleep('1st step', '5s')
    // const writer = createAgent({
    //   name: 'writer',
    //   system:
    //     'You are an expert writer. You write readable, concise, simple content.',
    //   model: openai({ model: 'gpt-4o' }),
    // })
    const sandboxId = await step.run('get-sandbox-id', async () => {
      const sandbox = await Sandbox.create('vibe-nextjs-test1-2')
      await sandbox.setTimeout(SANDBOX_TIMEOUT)
      return sandbox.sandboxId
    })

    const previousMessages = await step.run(
      'get-previous-messages',
      async () => {
        const formattedMessage: Message[] = []
        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        })
        for (const message of messages) {
          formattedMessage.push({
            type: 'text',
            role: message.role === 'ASSISTANT' ? 'assistant' : 'user',
            content: message.content,
          })
        }
        return formattedMessage.reverse()
      }
    )
    const state = createState<AgentState>(
      {
        summary: '',
        files: {},
      },
      {
        messages: previousMessages,
      }
    )
    // const summarizer = createAgent({
    //   name: 'summarizer',
    //   system: 'You are an expert summarizer. You summarize in 2 words.',
    //   model: openai({ model: 'gpt-4o' }),
    // })
    // const { output } = await summarizer.run(
    //   `Summarize the following text: ${event.data.value}`
    // )
    const codeAgent = createAgent<AgentState>({
      name: 'code-agent',
      description: 'An expert coding agent',
      system:
        // 'You are an expert next.js developer. You write readable, maintainable code. You write simple Next.js & React snippets.',
        PROMPT,
      // model: openai({
      //   model: 'gpt-4o',
      //   defaultParameters: { temperature: 0.1 },
      // }),
      model: AIMODEL,
      tools: [
        createTool({
          name: 'terminal',
          description: 'Use the terminal to run commands',
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run('terminal', async () => {
              const buf = { stdout: '', stderr: '' }

              try {
                const sandbox = await getSandbox(sandboxId)
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buf.stdout += data
                  },
                  onStderr: (data: string) => {
                    buf.stderr += data
                  },
                })
                return result.stdout
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buf.stdout}\nstderr: ${buf.stderr}`
                )
                return `Command failed: ${e} \nstdout: ${buf.stdout}\nstderr: ${buf.stderr}`
              }
            })
          },
        }),
        createTool({
          name: 'createOrUpdateFiles',
          description: 'Create or Update files in the sandbox',
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              'createOrUpdateFiles',
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {}
                  const sandbox = await getSandbox(sandboxId)
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content)
                    updatedFiles[file.path] = file.content
                  }
                  return updatedFiles
                } catch (e) {
                  return 'Error:' + e
                }
              }
            )
            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles
            }
          },
        }),
        createTool({
          name: 'readFiles',
          description: 'Read files from the sandbox',
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            const newFiles = await step?.run('readFiles', async () => {
              try {
                const contents = []
                const sandbox = await getSandbox(sandboxId)
                for (const file of files) {
                  const content = await sandbox.files.read(file)
                  contents.push({ path: file, content })
                }
                return JSON.stringify(contents)
              } catch (e) {
                return 'Error:' + e
              }
            })
            return newFiles
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result)
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes('<task_summary>')) {
              network.state.data.summary = lastAssistantMessageText
            }
          }
          return result
        },
      },
    })

    const network = createNetwork<AgentState>({
      name: 'coding-agent-network',
      agents: [codeAgent],
      defaultState: state,
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary
        if (summary) {
          return
        }
        return codeAgent
      },
    })
    // const { output } = await codeAgent.run(
    //   `Write the following snippet: ${event.data.value}`
    // )

    const result = await network.run(event.data.value, { state })

    const fragmentTitleGenerator = createAgent({
      name: 'fragment-title-generator',
      description: 'A fragment title generator',
      system:
        // 'You are an expert next.js developer. You write readable, maintainable code. You write simple Next.js & React snippets.',
        FRAGMENT_TITLE_PROMPT,
      // model: openai({
      //   model: 'gpt-4o',
      //   // defaultParameters: { temperature: 0.1 },
      // }),
      model: AIMODEL,
    })

    const responseGenerator = createAgent({
      name: 'response-generator',
      description: 'A fragment title generator',
      system:
        // 'You are an expert next.js developer. You write readable, maintainable code. You write simple Next.js & React snippets.',
        RESPONSE_PROMPT,
      // model: openai({
      //   model: 'gpt-4o',
      //   // defaultParameters: { temperature: 0.1 },
      // }),
      model: AIMODEL,
    })
    const { output: fragmentTitle } = await fragmentTitleGenerator.run(
      result.state.data.summary
    )

    // const generatedFragmentTitle = (): string => {
    //   if (fragmentTitle[0].type !== 'text') return 'Fragment'
    //   if (Array.isArray(fragmentTitle[0].content)) {
    //     return fragmentTitle[0].content.map((txt) => txt).join('')
    //   } else {
    //     return fragmentTitle[0].content
    //     // return 'Fragment'
    //   }
    // }
    const generatedFragmentTitle = parseAgentOutput(fragmentTitle, 'Fragment')

    const { output: response } = await responseGenerator.run(
      result.state.data.summary
    )
    // const generatedResponse = (): string => {
    //   if (response[0].type !== 'text') return 'Here you go'
    //   if (Array.isArray(response[0].content)) {
    //     return response[0].content.map((txt) => txt).join('')
    //   } else {
    //     return response[0].content
    //     // return 'Fragment'
    //   }
    // }
    const generatedResponse = parseAgentOutput(response, 'Here you go')
    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0

    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId)
      const host = sandbox.getHost(3000)
      return `https://${host}`
    })

    await step.run('save-result', async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: 'Something went wrong. Please try again',
            role: 'ASSISTANT',
            type: 'ERROR',
          },
        })
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generatedResponse, //result.state.data.summary,
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl,
              title: generatedFragmentTitle,
              files: result.state.data.files,
            },
          },
        },
      })
    })
    // console.log('->', event.data.value)
    return {
      // output,
      url: sandboxUrl,
      title: 'Fragment',
      files: result.state.data.files,
      summary: result.state.data.summary,
    }
    // console.log(output)
    // return { message: `Hello ${event.data.value}!` }
  }
)
