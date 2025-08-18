import prisma from '@/lib/prisma'
import { PROMPT } from '@/prompt'
import { Sandbox } from '@e2b/code-interpreter'
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  type Tool,
} from '@inngest/agent-kit'
import z from 'zod'
import { inngest } from './client'
import { getSandbox, lastAssistantTextMessageContent } from './utils'

interface AgentState {
  summary: string
  files: { [path: string]: string }
}

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
      return sandbox.sandboxId
    })
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
      model: openai({
        model: 'gpt-4o',
        defaultParameters: { temperature: 0.1 },
      }),
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

    const result = await network.run(event.data.value)

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
            content: 'Something went wrong. Please try again',
            role: 'ASSISTANT',
            type: 'ERROR',
          },
        })
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl,
              title: 'Fragment',
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
