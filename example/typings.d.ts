declare module "*.mdx" {
  let MDXComponent: (props: any) => JSX.Element // eslint-disable-line @typescript-eslint/no-explicit-any
  export default MDXComponent
}
declare module "@mdx-js/react" {
  import * as React from "react"
  type ComponentType =
    | "p"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "thematicBreak"
    | "blockquote"
    | "ul"
    | "ol"
    | "li"
    | "table"
    | "tr"
    | "td"
    | "pre"
    | "code"
    | "em"
    | "strong"
    | "delete"
    | "inlineCode"
    | "hr"
    | "a"
    | "img"
  type HeadingType = React.ComponentType<{ id: string | undefined; children: React.ReactNode }>
  export type Components = {
    h1: HeadingType
    h2: HeadingType
    h3: HeadingType
    h4: HeadingType
    h5: HeadingType
    h6: HeadingType
    [key in ComponentType]?: React.ComponentType<{ children: React.ReactNode }>
  }
  export interface MDXProviderProps {
    children: React.ReactNode
    components?: Components
  }
  export class MDXProvider extends React.Component<MDXProviderProps> {}
}
declare module "react-lorem-ipsum"
declare module "ace-builds/src-noconflict/ace"
