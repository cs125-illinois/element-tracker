import React, { useState, useMemo, useLayoutEffect } from "react"
import PropTypes from "prop-types"

import Children from "react-children-utilities"
import slugify from "slugify"

import { LoremIpsum } from "react-lorem-ipsum"
import { useElementTracker, Component } from "@cs125/element-tracker"
import { List } from "semantic-ui-react"

import PrismLight from "react-syntax-highlighter/dist/esm/prism-light"
import style from "react-syntax-highlighter/dist/esm/styles/prism/tomorrow"
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
PrismLight.registerLanguage("bash", bash)
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx"
PrismLight.registerLanguage("tsx", tsx)

export const UpdateHash: React.FC<{ component: string }> = () => {
  const { components } = useElementTracker()

  useMemo(() => {
    const firstVisible = components?.find((c) => c.visible)
    if (firstVisible) {
      history.replaceState(null, "", `#${firstVisible.id}`)
    }
  }, [components])

  return null
}

export const SidebarMenu: React.FC = () => {
  const { components } = useElementTracker()
  const [headers, setHeaders] = useState<(Component & { active: boolean })[]>([])

  useLayoutEffect(() => {
    if (!components) {
      setHeaders([])
      return
    }
    const newHeaders = components
      .filter((c) => c.tag === "h2")
      .map((c) => {
        return { ...c, active: false }
      })
    if (newHeaders.length === 0) {
      setHeaders([])
      return
    }
    const onScreenHeaders = newHeaders.filter((c) => c.top >= 0)
    const offScreenHeaders = newHeaders.filter((c) => c.top < 0)
    if (onScreenHeaders.length > 0 && onScreenHeaders[0].visible) {
      onScreenHeaders[0].active = true
    } else if (offScreenHeaders.length > 0) {
      offScreenHeaders[offScreenHeaders.length - 1].active = true
    } else {
      newHeaders[0].active = true
    }
    setHeaders(newHeaders)
  }, [components])

  return (
    <List size="large">
      {headers.map((header, i) => {
        const headerLocation = `${location.href.replace(location.hash, "")}#${header.id}`
        return (
          <List.Item
            onClick={(): void => {
              window.location.href = headerLocation
            }}
            key={i}
          >
            {header.active ? <strong>{header.text}</strong> : <span>{header.text}</span>}
          </List.Item>
        )
      })}
    </List>
  )
}
interface HeadingProps {
  id?: string
  children: React.ReactNode
}
const Heading = (tag: string): React.FC<HeadingProps> => {
  const WrappedHeading: React.FC<HeadingProps> = (props) => {
    const { children } = props
    const id = props.id || slugify(Children.onlyText(children), { lower: true })
    return React.createElement(tag, { id }, children)
  }
  WrappedHeading.propTypes = {
    id: PropTypes.string,
    children: PropTypes.node.isRequired,
  }
  return WrappedHeading
}

interface CodeBlockProps {
  className?: string
  children: React.ReactNode
}
const CodeBlock: React.FC<CodeBlockProps> = (props) => {
  const { className, children } = props
  const language = className?.replace(/language-/, "") || ""
  const contents = Children.onlyText(children).trim()
  return (
    <PrismLight style={style} language={language} customStyle={{ fontSize: "0.9rem" }}>
      {contents}
    </PrismLight>
  )
}
CodeBlock.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
}
CodeBlock.defaultProps = {
  className: "",
}

export const components = {
  h1: Heading("h1"),
  h2: Heading("h2"),
  h3: Heading("h3"),
  h4: Heading("h4"),
  h5: Heading("h5"),
  h6: Heading("h6"),
  code: CodeBlock,
}

export class FakeContent extends React.PureComponent {
  render(): React.ReactNode {
    return (
      <React.Fragment>
        <components.h2>First</components.h2>
        <LoremIpsum p={2} />
        <components.h3>First First</components.h3>
        <LoremIpsum p={1} />
        <components.h3>First Second</components.h3>
        <LoremIpsum p={3} />
        <components.h4>First Second First</components.h4>
        <LoremIpsum p={3} />
        <components.h2>Second</components.h2>
        <LoremIpsum p={4} />
        <components.h3>Second First</components.h3>
        <LoremIpsum p={1} />
        <components.h4>Second First First</components.h4>
        <LoremIpsum p={1} />
      </React.Fragment>
    )
  }
}
