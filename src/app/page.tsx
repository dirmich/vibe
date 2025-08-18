'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

// import { caller } from "@/trpc/server"

const Page = () => {
  const [value,setValue]=useState('')
  const trpc = useTRPC()
  const {data:messages}=useQuery(trpc.messages.getMany.queryOptions())
  const invoke = useMutation(trpc.messages.create.mutationOptions({
    onSuccess: () => {
      // toast.success('Background job started')
      toast.success('Message created')
    }
  }))
  // trpc.createAI.queryOptions({text:"Hello"})
  // trpc.createAI.queryOptions({text:123})
  // const { data } = useQuery(trpc.createAI.queryOptions({ text: "highmaru" }))
  // console.log('->',data)
  return (
    <div className="p-4 max-w-7xl mx-auto ">
      <Input value={value} onChange={(e)=>setValue(e.target.value)}/>
      <Button variant='new' disabled={invoke.isPending} onClick={()=>invoke.mutate({value})}>
        Invoke Background job
      </Button>
      {JSON.stringify(messages,null,2)}
    </div>
  )
 }


// const Page = async () => {
//   const data = await caller.createAI({ text: 'highmaru' })
//   console.log('->', data)
//   return (
//     <div>Hello</div>
//   )
// }

export default Page 
