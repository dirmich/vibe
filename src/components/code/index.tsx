import Prism from 'prismjs'
import 'prismjs/components/prism-jsx.js'
import 'prismjs/components/prism-typescript.js'
import 'prismjs/themes/prism-coy.css'
import { useEffect } from 'react'
import './code-theme.css'
interface Props {
    code: string
    lang: string
}
const CodeView = ({ code, lang }: Props) => {
    useEffect(() => { 
        Prism.highlightAll()
    },[code,lang])
  return (
      <pre className='p-2 bg-transparent border-none rounded-none m-0 text-xs '>
          <code className={`language-${lang} `}>
              {code}
          </code>
    </pre>
  )
}

export default CodeView