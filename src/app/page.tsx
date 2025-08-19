'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

// import { caller } from "@/trpc/server"

const Page = () => {
  const [value,setValue]=useState('')
  const trpc = useTRPC()
  const router = useRouter()
  // const {data:messages}=useQuery(trpc.messages.getMany.queryOptions())
  // const invoke = useMutation(trpc.messages.create.mutationOptions({
  //   onSuccess: () => {
  //     // toast.success('Background job started')
  //     toast.success('Message created')
  //   }
  // }))
  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess: (data) => {
      // toast.success('Background job started')
      // toast.success('Project created')
      router.push(`/projects/${data.id}`)
    },
    onError: (err) => {
      toast.error(err.message)
    }
  }))
  // trpc.createAI.queryOptions({text:"Hello"})
  // trpc.createAI.queryOptions({text:123})
  // const { data } = useQuery(trpc.createAI.queryOptions({ text: "highmaru" }))
  // console.log('->',data)
  return (
    <div className="h-screen w-screen flex items-center justify-center">
    <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center">
      <Input value={value} onChange={(e)=>setValue(e.target.value)}/>
      <Button  disabled={createProject.isPending} onClick={()=>createProject.mutate({value})}>
        Submit
      </Button>
      {/* {JSON.stringify(messages,null,2)} */}
    </div>
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
