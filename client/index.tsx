import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from "react"
import PropTypes from "prop-types"

import ReconnectingWebSocket from "reconnecting-websocket"
import { PingWS } from "@cs125/pingpongws"

import { v4 as uuidv4 } from "uuid"
import queryString from "query-string"
import { throttle, debounce } from "throttle-debounce"

import "intersection-observer"

import { ConnectionQuery, UpdateMessage, ElementTree, LoginMessage } from "../types"

export interface ElementTrackerContext {
  elements: Element[] | undefined
}
export const ElementTrackerContext = createContext<ElementTrackerContext>({
  elements: undefined,
})

const getElements = () => Array.from(document.querySelectorAll("[data-et]")) || []

export interface ElementTrackerProps {
  server?: string
  googleToken?: string
  updateInterval?: number
  reportInterval?: number
  children: React.ReactNode
}
export const ElementTracker: React.FC<ElementTrackerProps> = ({
  server,
  googleToken,
  updateInterval = 100,
  reportInterval = 1000,
  children,
}) => {
  const connection = useRef<ReconnectingWebSocket | undefined>(undefined)
  const browserId = useRef<string>((window && localStorage.getItem("element-tracker:id")) || uuidv4())
  const tabId = useRef<string>((window && sessionStorage.getItem("element-tracker:id")) || uuidv4())

  const [tracked, setTracked] = useState<Element[]>(getElements())
  const [elements, setElements] = useState<Element[]>(getElements())
  useEffect(() => {
    if (!googleToken) {
      return
    }
    const login = LoginMessage.check({
      type: "login",
      googleToken,
    })
    connection.current?.send(JSON.stringify(login))
  }, [connection, googleToken])

  // Passing an inline function here does not work.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const report = useCallback(
    throttle(reportInterval, (es: Element[]) => {
      const elements = es.map(element => {
        const { tagName } = element
        const { top, bottom } = element.getBoundingClientRect()
        const id = element.getAttribute("data-et-id") || element.id
        const text = element.textContent
        return {
          tagName: tagName.toLowerCase(),
          top,
          bottom,
          ...(id && { id }),
          ...(text && { text }),
        }
      })
      const update = UpdateMessage.check({
        type: "update",
        browserId: browserId.current,
        tabId: tabId.current,
        location: window.location.href,
        width: window.innerWidth,
        height: window.innerHeight,
        elements,
      })
      connection.current?.send(JSON.stringify(update))
    }),
    [reportInterval]
  )

  // Passing an inline function here does not work.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateElements = useCallback(
    throttle(updateInterval, () => {
      const newElements = getElements()
      setElements(newElements)
      report(newElements)
    }),
    [report]
  )

  useEffect(() => {
    const mutationObserver = new MutationObserver(() => setTracked(getElements()))
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    return (): void => {
      mutationObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const delayedUpdateElements = debounce(100, updateElements)
    window.addEventListener("scroll", delayedUpdateElements)
    window.addEventListener("resize", delayedUpdateElements)
    return (): void => {
      window.removeEventListener("scroll", delayedUpdateElements)
      window.removeEventListener("resize", delayedUpdateElements)
    }
  }, [updateElements])

  useEffect(() => {
    const intersectionObserver = new IntersectionObserver(updateElements)
    tracked.forEach(element => intersectionObserver.observe(element))
    return (): void => {
      intersectionObserver.disconnect()
    }
  }, [tracked, updateElements])

  useEffect(() => {
    connection.current?.close()
    if (!server) {
      connection.current = undefined
      return
    }
    const connectionQuery = ConnectionQuery.check({ browserId: browserId.current, tabId: tabId.current })
    connection.current = PingWS(
      new ReconnectingWebSocket(`${server}?${queryString.stringify(connectionQuery)}`, [], { startClosed: true })
    )
    connection.current.reconnect()
    return (): void => {
      connection.current?.close()
      connection.current = undefined
    }
  }, [server])

  useEffect(() => {
    connection.current?.addEventListener("open", updateElements)
    return (): void => {
      connection.current?.removeEventListener("open", updateElements)
    }
  }, [updateElements])

  return <ElementTrackerContext.Provider value={{ elements }}>{children}</ElementTrackerContext.Provider>
}
ElementTracker.propTypes = {
  server: PropTypes.string,
  googleToken: PropTypes.string,
  updateInterval: PropTypes.number,
  reportInterval: PropTypes.number,
  children: PropTypes.node.isRequired,
}
ElementTracker.defaultProps = {
  updateInterval: 100,
  reportInterval: 1000,
}

export const useElementTracker = (): ElementTrackerContext => {
  return useContext(ElementTrackerContext)
}

export const elementListToTree = (elements: Element[]): ElementTree[] => {
  const elementTree: ElementTree[] = []
  let elementLogger: string[] = []
  elements.forEach(e => {
    const element = { ...e, descendants: [] } as ElementTree
    if (elementTree.length == 0) {
      elementTree.push(element)
    } else {
      let level = elementLogger.indexOf(element.tagName)
      if (level == -1) {
        level = elementLogger.length
      } else {
        elementLogger = elementLogger.slice(0, level)
      }
      const getChildrenArray = (tree: ElementTree[], depth: number): ElementTree[] => {
        if (depth == 0) return tree
        else return getChildrenArray(tree[tree.length - 1].descendants, depth - 1)
      }
      getChildrenArray(elementTree, level).push(element)
    }
    elementLogger.push(element.tagName)
  })
  return elementTree
}

export { ElementTree } from "../types"

export const atTop = (): boolean => (document.documentElement.scrollTop || document.body.scrollTop) === 0
export function atBottom(): boolean {
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  )
  return (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight === documentHeight
}

export function active<T extends Element>(elements: Array<T>, windowTop = 0): T | undefined {
  if (elements.length === 0) {
    return undefined
  } else if (elements.length === 1) {
    return elements[0]
  }

  if (atBottom() && window.location.hash) {
    const hashedComponent = elements.find(e => e.id && e.id === window.location.hash.substring(1))
    if (hashedComponent && hashedComponent.getBoundingClientRect().top >= windowTop) {
      return hashedComponent
    }
  }

  const visible: T[] = []
  const above: T[] = []
  const below: T[] = []
  elements.forEach(e => {
    const { top, bottom } = e.getBoundingClientRect()
    if (top >= windowTop && top < window.innerHeight && bottom >= windowTop && bottom < innerHeight) {
      visible.push(e)
    } else if (bottom < windowTop) {
      above.push(e)
    } else {
      below.push(e)
    }
  })
  if (visible.length > 0) {
    return visible[0]
  } else if (above.length > 0) {
    return above[above.length - 1]
  } else {
    return below[0]
  }
}

export interface UpdateHashProps {
  filter?: (element: Element) => boolean
  top?: number
}
export const UpdateHash: React.FC<UpdateHashProps> = ({ filter = (): boolean => true, top = 0 }) => {
  const hash = useRef<string>((typeof window !== `undefined` && window.location.hash) || " ")

  const setHash = useRef((newHash: string) => {
    if (hash.current !== newHash) {
      hash.current = newHash
      window.history.replaceState({}, "", newHash)
    }
  })

  const { elements } = useElementTracker()
  useEffect(() => {
    if (atTop() && !atBottom()) {
      setHash.current(" ")
      return
    }
    const activeHash =
      elements &&
      active(
        elements.filter(c => filter(c)),
        top
      )
    if (!activeHash) {
      return
    }
    const id = activeHash.getAttribute("data-et-id") || activeHash.id
    id && setHash.current(`#${id}`)
  }, [filter, elements, top])

  useEffect(() => {
    const hashListener = (): void => {
      hash.current = window.location.hash || " "
    }
    window.addEventListener("hashchange", hashListener)
    return (): void => {
      window.removeEventListener("hashchange", hashListener)
    }
  }, [])

  return null
}
UpdateHash.propTypes = {
  filter: PropTypes.func,
}
UpdateHash.defaultProps = {
  filter: () => true,
}
