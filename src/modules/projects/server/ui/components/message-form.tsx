import { Button } from "@/components/ui/button"
import { Form, FormField } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from "sonner"
import z from "zod"

interface Props {
    projectId: string
}

const formScheme = z.object({
    value: z.string()
        .min(1, { message: 'Value is required' })
        .max(10000,{message:'Value is too long'})
})
const MessageForm = ({ projectId }: Props) => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const form = useForm<z.infer<typeof formScheme>>({
        resolver: zodResolver(formScheme),
        defaultValues: {
            value:''
        }
    })
    const createMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess: () => {
            form.reset()
            queryClient.invalidateQueries(
                trpc.messages.getMany.queryOptions({projectId})
            )
        },
        onError: (err) => {
            toast.error(err.message)
        }
    }))

    const onSubmit = async (values: z.infer<typeof formScheme>) => {
        // console.log('=>',values)
        await createMessage.mutateAsync({
            value: values.value,
            projectId
        })
    }
    const [isFocused, setIsFocused] = useState(false)
    const isPending = createMessage.isPending
    const isButtonDisabled = isPending || !form.formState.isValid
    const showUsage = false


  return (
      <Form {...form} >
          <form onSubmit={form.handleSubmit(onSubmit)}
              className={cn('relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all',
                  isFocused && 'shadow-xs',
              showUsage && 'rounded-t-none'
          )}>
              <FormField
              control={form.control}
              name='value'
                  render={({ field }) => (
                      <TextareaAutosize {...field}
                        disabled={isPending}
                        minRows={2}
                        maxRows={8}
                          className="pt4
                         resize-none border-none w-full outline-none bg-transparent"
                          placeholder="What would you like to build?"
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault()
                                  form.handleSubmit(onSubmit)(e)
                              }
                          }}
                          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
              )}
              />
              <div className="flex gap-x-2 items-end justify-between pt-2">
                  <div className="text-[10px] text-muted-foreground font-mono">
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          <span>&#8984;</span>Enter
                      </kbd>
                      &nbsp;to submit
                  </div>
                  <Button className={cn('size-8 rounded-full',isButtonDisabled&&'bg-muted-foreground border')} disabled={isButtonDisabled}>
                      {isPending ? (
                          <Loader2Icon className="size-4 animate-spin" />
                    ):
                      (<ArrowUpIcon />)}
                  </Button>
              </div>
          </form>
      </Form>
  )
}

export default MessageForm