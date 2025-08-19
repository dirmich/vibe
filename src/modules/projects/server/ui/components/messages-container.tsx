import { Fragment } from "@/generated/prisma"
import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import MessageCard from "./message-card"
import MessageForm from "./message-form"
import MessageLoading from "./message-loading"

interface Props {
    projectId: string,
    activeFragment:Fragment|null,
    setActiveFragment:(fragment:Fragment|null)=>void
}
const MessagesContainer = ({ projectId,activeFragment,setActiveFragment}:Props) => {
    const trpc = useTRPC()
    const bottomRef = useRef<HTMLDivElement>(null)
    const { data: messages } = useSuspenseQuery(trpc.messages.getMany.queryOptions({
        projectId
    },{refetchInterval:5000}))
    useEffect(() => {
        const lastAssistantMessage = messages.findLast((msg) => msg.role === 'ASSISTANT'&&!!msg.fragment)
        if (lastAssistantMessage) {
            setActiveFragment(lastAssistantMessage.fragment)
        }
     },[messages,setActiveFragment])
    useEffect(() => { 
        bottomRef.current?.scrollIntoView()
    }, [messages.length])
    const lastMessage = messages[messages.length - 1]
    const isLastMessageUser = lastMessage?.role==='USER'
  return (
      <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="pt-2 pr-1">
                  {messages.map((msg) => (
                      <MessageCard key={msg.id} msg={msg} fragment={msg.fragment} isActiveFragment={activeFragment?.id===msg.fragment?.id} onFragmentClick={() => setActiveFragment(msg.fragment)}/>
                  ))}
                  {isLastMessageUser && <MessageLoading />}
                  <div ref={bottomRef} />
              </div>
          </div>
          {/* {JSON.stringify(messages)} */}
          <div className="relative p-3 pt-1">
            <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none"/>
              <MessageForm projectId={projectId} />
          </div>
    </div>
  )
}

export default MessagesContainer