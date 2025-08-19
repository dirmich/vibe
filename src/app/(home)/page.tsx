'use client'

import ProjectForm from "@/modules/home/ui/components/project-form"
import ProjectsList from "@/modules/home/ui/components/projects-list"
import Image from "next/image"

// import { caller } from "@/trpc/server"

// const Page = () => {
//   const [value,setValue]=useState('')
//   const trpc = useTRPC()
//   const router = useRouter()
//   // const {data:messages}=useQuery(trpc.messages.getMany.queryOptions())
//   // const invoke = useMutation(trpc.messages.create.mutationOptions({
//   //   onSuccess: () => {
//   //     // toast.success('Background job started')
//   //     toast.success('Message created')
//   //   }
//   // }))
//   const createProject = useMutation(trpc.projects.create.mutationOptions({
//     onSuccess: (data) => {
//       // toast.success('Background job started')
//       // toast.success('Project created')
//       router.push(`/projects/${data.id}`)
//     },
//     onError: (err) => {
//       toast.error(err.message)
//     }
//   }))
//   // trpc.createAI.queryOptions({text:"Hello"})
//   // trpc.createAI.queryOptions({text:123})
//   // const { data } = useQuery(trpc.createAI.queryOptions({ text: "highmaru" }))
//   // console.log('->',data)
//   return (
//     <div className="h-screen w-screen flex items-center justify-center">
//     <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center">
//       <Input value={value} onChange={(e)=>setValue(e.target.value)}/>
//       <Button  disabled={createProject.isPending} onClick={()=>createProject.mutate({value})}>
//         Submit
//       </Button>
//       {/* {JSON.stringify(messages,null,2)} */}
//     </div>
//     </div>
//   )
//  }


const Page = () => {
  // const data = await caller.createAI({ text: 'highmaru' })
  // console.log('->', data)
  return (
    // <div className="h-screen w-screen flex items-center justify-center">
    //   <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center">
    //   </div>
    // </div>
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image src='/logo.svg' alt='Vibe' width={50} height={50} className="hidden md:block"/>
        </div>
        <h1 className="text-2xl md:text-5xl font-bold text-center">
          Build something with Vibe
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-center">
          Create apps and websites by chatting with AI
        </p>
        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  )
}

export default Page 
