import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from "react"
import PropTypes from "prop-types"

import ReconnectingWebSocket from "reconnecting-websocket"
import { PingWS } from "@cs125/pingpongws"

import { v4 as uuidv4 } from "uuid"
import queryString from "query-string"
import { throttle } from "throttle-debounce"

import { Component, ConnectionQuery, UpdateMessage, ComponentTree, LoginMessage } from "../types"

export interface ElementTrackerContext {
  components: Component[] | undefined
}
export const ElementTrackerContext = createContext<ElementTrackerContext>({
  components: undefined,
})

export interface ElementTrackerProps {
  tags: string[]
  server?: string
  googleToken?: string
  updateDelay?: number
  reportDelay?: number
  children: React.ReactNode
}
const ElementTracker: React.FC<ElementTrackerProps> = ({
  tags,
  server,
  googleToken,
  updateDelay,
  reportDelay,
  children,
}) => {
  const connection = useRef<ReconnectingWebSocket | undefined>(undefined)
  const browserId = useRef<string>(localStorage.getItem("element-tracker:id") || uuidv4())
  const tabId = useRef<string>(sessionStorage.getItem("element-tracker:id") || uuidv4())
  useEffect(() => {
    connection.current?.close()
    connection.current = undefined
    if (!server) {
      return
    }
    const connectionQuery = ConnectionQuery.check({ browserId: browserId.current, tabId: tabId.current })
    connection.current = PingWS(new ReconnectingWebSocket(`${server}?${queryString.stringify(connectionQuery)}`))
    return (): void => {
      connection.current?.close()
      connection.current = undefined
    }
  }, [server])

  const [components, setComponents] = useState<Component[] | undefined>(undefined)
  useEffect(() => {
    if (!connection.current || !googleToken) {
      return
    }
    const login = LoginMessage.check({
      type: "login",
      googleToken,
    })
    connection.current.send(JSON.stringify(login))
  }, [connection.current, googleToken])

  const report = useCallback(
    throttle(reportDelay || 1000, (reportingComponents: Component[]) => {
      if (!connection.current || !reportingComponents) {
        return
      }
      const update = UpdateMessage.check({
        type: "update",
        browserId: browserId.current,
        tabId: tabId.current,
        location: window.location.href,
        components: reportingComponents,
      })
      connection.current.send(JSON.stringify(update))
    }),
    [connection.current]
  )

  const updateVisibleComponents = useCallback(
    throttle(updateDelay || 250, () => {
      const newComponents = Array.from(document.querySelectorAll(tags.join(", "))).map((componentNode) => {
        const { tagName, id } = componentNode
        const { height } = document.body.getBoundingClientRect()
        const text = componentNode.textContent
        const { top, bottom } = componentNode.getBoundingClientRect()
        return {
          tag: tagName.toLowerCase(),
          ...(id && { id }),
          ...(text && { text }),
          top,
          height,
          bottom,
        }
      })
      setComponents(newComponents)
      report(newComponents)
    }),
    [tags]
  )

  useEffect(() => {
    window.addEventListener("load", updateVisibleComponents)
    window.addEventListener("scroll", updateVisibleComponents)
    window.addEventListener("resize", updateVisibleComponents)
    return (): void => {
      window.removeEventListener("scroll", updateVisibleComponents)
      window.removeEventListener("resize", updateVisibleComponents)
    }
  }, [])

  return <ElementTrackerContext.Provider value={{ components }}>{children}</ElementTrackerContext.Provider>
}
ElementTracker.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  server: PropTypes.string,
  googleToken: PropTypes.string,
  updateDelay: PropTypes.number,
  reportDelay: PropTypes.number,
  children: PropTypes.node.isRequired,
}

export { ElementTracker }

export const useElementTracker = (): ElementTrackerContext => {
  return useContext(ElementTrackerContext)
}

export const componentListToTree = (components: Component[]): ComponentTree[] => {
  const componentTree: ComponentTree[] = []
  let componentLogger: string[] = []
  components.forEach((c) => {
    const component = ComponentTree.check({ ...c, children: [] })
    if (componentTree.length == 0) {
      componentTree.push(component)
    } else {
      let level = componentLogger.indexOf(component.tag)
      if (level == -1) {
        level = componentLogger.length
      } else {
        componentLogger = componentLogger.slice(0, level)
      }
      const getChildrenArray = (tree: ComponentTree[], depth: number): ComponentTree[] => {
        if (depth == 0) return tree
        else return getChildrenArray(tree[tree.length - 1].children, depth - 1)
      }
      getChildrenArray(componentTree, level).push(component)
    }
    componentLogger.push(component.tag)
  })
  return componentTree
}

export { Component, ComponentTree } from "../types"
