import { convertFilesToTreeItems } from "@/lib/utils"
import { CopyCheckIcon, CopyIcon, EllipsisIcon } from "lucide-react"
import { Fragment, useCallback, useMemo, useState } from "react"
import CodeView from "./code"
import Hint from "./hint"
import TreeView from "./tree-view"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"
import { Button } from "./ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable"

type FileCollection = {[path:string]:string}

const getLanguageFromExt = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    return ext || 'text'
}

interface FileBreadcrumbProps {
    filePath: string
}
const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
    const pathSegments = filePath.split('/')
    const maxSegments = 4
    const renderItems = () => {
        if (pathSegments.length < maxSegments) {
            return pathSegments.map((seg, idx) => {
                const isLast = idx === pathSegments.length - 1
                
                return (
                    <Fragment key={idx}>
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage className="font-medium">
                                    {seg}
                            </BreadcrumbPage>
                            ) : (
                                    <span className="text-muted-foreground">
                                        {seg}
                                </span>
                            ) }
                        </BreadcrumbItem>
                        {!isLast&&<BreadcrumbSeparator />}
                    </Fragment>
                )
            })
        } else {
            const first = pathSegments[0]
            const last = pathSegments[pathSegments.length-1]

            return (
                <>
                    <BreadcrumbItem>
                        <span className="text-muted-foreground">{first}</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <span className="text-muted-foreground">
                            <EllipsisIcon />
                        </span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <span className="font-medium">{last}</span>
                    </BreadcrumbItem>
                </>
            )
        }
    }
    return (
        <Breadcrumb>
            <BreadcrumbList>
            {renderItems()}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

    
interface Props {
    files: FileCollection
}

const FileExplorer = ({ files }: Props) => {
    const [copied,setCopied]=useState(false)
    const [selectedFile, setSelectedFile] = useState<string | null>(() => {
        const fileKeys = Object.keys(files)
        return fileKeys.length>0?fileKeys[0]:null
    })

    const treeData = useMemo(() => { 
        return convertFilesToTreeItems(files)
    },[files])

    const handleFileSelect = useCallback((filePath:string) => {
        if (files[filePath]) {
            setSelectedFile(filePath)
        }
    }, [files])
    
    const handleCopy = useCallback(() => {
        if (selectedFile) {
            navigator.clipboard.writeText(files[selectedFile])
            setCopied(true)
            setTimeout(() => {
                setCopied(false)
            },2000)
        }
    },[selectedFile,files])
  return (
      <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
              <TreeView
                data={treeData}
                value={selectedFile}
                onSelect={handleFileSelect}
              />
          </ResizablePanel>
          <ResizableHandle className="hover:bg-primary transition-colors" />
          <ResizablePanel defaultSize={70} minSize={50} className="bg-sidebar">
              {selectedFile && files[selectedFile] ? (
                  <div className="h-full w-full flex flex-col">
                      <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
                          <FileBreadcrumb filePath={selectedFile } />
                          <Hint text='Copy to clipboard' side='bottom'>
                              <Button variant='outline' size='icon'
                                
                                  className="ml-auto" onClick={handleCopy} disabled={copied}>
                                  {copied ? <CopyCheckIcon /> : <CopyIcon />}
                                  </Button>
                          </Hint>
                      </div>
                      <div className="flex-1">
                          <CodeView
                          code={files[selectedFile]}
                          lang={getLanguageFromExt(selectedFile)}
                          />
                      </div>
               </div>   
            ):(<div className="flex h-full items-center justify-center text-muted-foreground">Select a file to view it&apos;s content</div>)}          
          </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default FileExplorer