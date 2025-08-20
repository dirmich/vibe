import { messagesRouter } from '@/modules/messages/server/procedures'
import { projectsRouter } from '@/modules/projects/server/procedures'
import { usageRouter } from '@/modules/usage/server/procedures'
import { createTRPCRouter } from '../init'
export const appRouter = createTRPCRouter({
  // invoke: baseProcedure
  //   .input(
  //     z.object({
  //       value: z.string(),
  //     })
  //   )
  //   .mutation(async ({ input }) => {
  //     await inngest.send({
  //       name: 'test/hello.world',
  //       data: {
  //         value: input.value,
  //       },
  //     })
  //     return { ok: 'success' }
  //   }),
  // createAI: baseProcedure
  //   .input(
  //     z.object({
  //       text: z.string(),
  //       // text: z.number(),
  //     })
  //   )
  //   .query((opts) => {
  //     return {
  //       greeting: `hello ${opts.input.text}`,
  //     }
  //   }),
  messages: messagesRouter,
  projects: projectsRouter,
  usage: usageRouter,
  // fragments: fragmen,
})
// export type definition of API
export type AppRouter = typeof appRouter
