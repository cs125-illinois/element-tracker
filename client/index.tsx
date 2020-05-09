import React, { useRef, useState, useEffect, useCallback, useContext, createContext } from "react"

import ReconnectingWebSocket from "reconnecting-websocket"
import { PingWS, filterPingPongMessages } from "@cs125/pingpongws"

import { v4 as uuidv4 } from "uuid"
import queryString from "query-string"

import { Delta, SaveMessage, ConnectionQuery, UpdateMessage, GetMessage, Component } from "../types"

interface IProps {
  server: string
  components: string[]
  children: JSX.Element
}

interface ElementTrackerContext {
  connected: boolean
}

const ElementTrackerContext = createContext<ElementTrackerContext>({
  connected: false
})

const ElementTracker: React.FC<IProps> = ({ server, components, children }) => {
  const [connected, setConnected] = useState(false)
  const connection: React.MutableRefObject<ReconnectingWebSocket | undefined> = useRef(undefined)
  const browserId = useRef(localStorage.getItem("browserId") || uuidv4())

  const calculateActiveSection = useCallback(() => {
    const componentsFlattened: Component[] = (Array.from(document.querySelectorAll(components.join(', '))))
      .map((componentNode) => {
        const { height } = document.body.getBoundingClientRect();
        const { tagName, id } = componentNode;
        const { top, bottom } = componentNode.getBoundingClientRect()
        const visible = top >= -10 && bottom <= height + 10

        return { tagName, id, visible, children: [] }
      })

    // Creates the tree
    const structuredComponents: Component[] = []
    let componentLogger: string[] = []

    componentsFlattened.forEach(component => {
      if (structuredComponents.length == 0) {
        structuredComponents.push(component)
      } else {
        let level = componentLogger.indexOf(component.tagName)
        if (level == -1) {
          level = componentLogger.length
        } else {
          componentLogger = componentLogger.slice(0, level)
        }
        const getChildrenArray = (arr: Component[], depth: number): Component[] => {
          if (depth == 0) return arr
          else return getChildrenArray(arr[arr.length - 1].children, depth - 1)
        }
        getChildrenArray(structuredComponents, level).push(component)
      }
      componentLogger.push(component.tagName)
    })
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", calculateActiveSection)

    return (): void => {
      window.removeEventListener("scroll", calculateActiveSection)
    }
  }, [calculateActiveSection])

  const connect = useCallback(() => {
    connection.current?.close()

    if (!server) return

    const connectionQuery: ConnectionQuery = ConnectionQuery.check({
      browserId: browserId.current
      // googleToken: this.props.googleToken,
    });

    connection.current = PingWS(
      new ReconnectingWebSocket(`${server}?${queryString.stringify(connectionQuery)}`)
    )

    connection.current.addEventListener("open", () => {
      setConnected(true)
    })

    connection.current.addEventListener("close", () => {
      setConnected(false)
    })
  }, [browserId, connection, setConnected])

  const update = useCallback(({ data }: { data: Component[] }) => {
    if (server) {
      // TODO: Implement save id
      const update: UpdateMessage = UpdateMessage.check({
        type: "update",
        browserId: browserId.current,
        // updateId: message.saveId,
        data
      })
      connection.current?.send(JSON.stringify(update))
      return
    }
    if (!connection.current || !connected) {
      throw new Error("server not connected")
    }
  }, [connection, connected])

  // Connects to server on mount and reconnects each time the google user changes
  useEffect(() => {
    connect()
    // add google dependency
  }, [])

  // Disconnects from the server when the component unmounts
  useEffect(() => {
    return () => {
      connection.current?.close()
    }
  }, [])

  return <ElementTrackerContext.Provider value={{ connected }} >{children}</ElementTrackerContext.Provider>
}

export { ElementTracker, ElementTrackerContext }
