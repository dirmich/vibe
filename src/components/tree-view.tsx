import { TreeItem } from '@/types'
import { ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarProvider } from './ui/sidebar'

interface TreeProps {
  item: TreeItem
  selectedValue?: string | null
  onSelect?: (val: string) => void
  parentPath: string
}

const Tree = ({item,selectedValue,onSelect,parentPath }: TreeProps) => {
  const [name, ...items] = Array.isArray(item) ? item : [item]
  const currentPath = parentPath ? `${parentPath}/${name}` : name
  
  if (!items.length) {
    const isSelected = selectedValue === currentPath
    return (
      <SidebarMenuButton
      isActive={isSelected}
      className='data-[active=true]:bg-primary/70 data-[active=true]:text-secondary cursor-pointer'
      onClick={()=>onSelect?.(currentPath)}
      >
        <FileIcon />
        <span className='truncate'>
          {name}
        </span>
      </SidebarMenuButton>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className='group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90 cursor-pointer'
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className='transition-transform' />
            <FolderIcon />
            <span className='truncate'>{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subitem, idx) => (
              <Tree
                key={idx}
                item={subitem}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

interface Props {
    data: TreeItem[],
    value?:string|null,
    onSelect?:(value:string)=>void
}
const TreeView = ({ data,value,onSelect}:Props) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible='none' className='w-full'>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, idx) => (
              <Tree
                key={idx}
                item={item}
                selectedValue={value}
                onSelect={onSelect}
                parentPath=''
              />
            ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

export default TreeView