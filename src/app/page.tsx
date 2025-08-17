// 'use client'
// import { Button } from "@/components/ui/button"
// import { useTRPC } from "@/trpc/client"
// import { useQuery } from "@tanstack/react-query"

import { caller } from "@/trpc/server"

// const Page = () => {
//   const trpc = useTRPC()
//   // trpc.createAI.queryOptions({text:"Hello"})
//   // trpc.createAI.queryOptions({text:123})
//   const { data } = useQuery(trpc.createAI.queryOptions({ text: "highmaru" }))
//   console.log('->',data)
//   return (
//     <div>
//       <Button variant='new'>
//         Click me
//       </Button>
//     </div>
//   )
//  }


const Page = async () => {
  const data = await caller.createAI({ text: 'highmaru' })
  console.log('->', data)
  return (
    <div>Hello</div>
  )
}

export default Page 
