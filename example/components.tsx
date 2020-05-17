import React, { useState, useMemo, useLayoutEffect, useRef } from "react"
import PropTypes from "prop-types"
import styled from "styled-components"

import { useElementTracker, Component } from "@cs125/element-tracker"
import { List } from "semantic-ui-react"

export const UpdateHash: React.FC<{ tags: string[] }> = ({ tags }) => {
  const hash = useRef<string>("#")
  const { components } = useElementTracker()

  useMemo(() => {
    if ((document.documentElement.scrollTop || document.body.scrollTop) === 0 && hash.current !== "#") {
      hash.current = "#"
      history.replaceState({}, "", "#")
      return
    }
    const firstVisible = components?.find((c) => c.top > 0 && c.bottom < c.height && c.id && tags.includes(c.tag))
    if (firstVisible) {
      const newHash = `#${firstVisible.id}`
      if (hash.current !== newHash) {
        hash.current = newHash
        history.replaceState({}, "", `#${firstVisible.id}`)
      }
    }
  }, [components])

  return null
}

const HoverItem = styled(List.Item)`
  :hover {
    cursor: pointer;
  }
`

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
    if (onScreenHeaders.length > 0 && onScreenHeaders[0].bottom < onScreenHeaders[0].height) {
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
        const headerLocation = `${location.href.split("#")[0]}#${header.id}`
        return (
          <HoverItem
            onClick={(): void => {
              window.location.href = headerLocation
            }}
            key={i}
          >
            {header.active ? <strong>{header.text}</strong> : <span>{header.text}</span>}
          </HoverItem>
        )
      })}
    </List>
  )
}

import { LoremIpsum as LI } from "lorem-ipsum"
const lorem = new LI()

export const LoremIpsum: React.FC<{ p: number }> = ({ p }) => {
  const paragraphs = []
  for (let i = 0; i < p; i++) {
    paragraphs.push(<p key={i}>{lorem.generateParagraphs(1)}</p>)
  }
  return <React.Fragment>{paragraphs}</React.Fragment>
}
LoremIpsum.propTypes = {
  p: PropTypes.number.isRequired,
}
