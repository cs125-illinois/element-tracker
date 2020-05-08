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
  save: (message: any) => void
  register: () => void
}

const ElementTrackerContext = createContext<ElementTrackerContext>({
  connected: false,
  register: () => { },
  save: () => { }
})

const ElementTracker: React.FC<IProps> = ({ server, components, children }) => {
  const [connected, setConnected] = useState(false)
  const connection: React.MutableRefObject<ReconnectingWebSocket | undefined> = useRef(undefined)
  const browserId: React.MutableRefObject<string | undefined> = useRef(undefined)

  const calculateActiveSection = () => {
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

    // if (section && section.getBoundingClientRect()?.y < 10) {
    //   if (activeSectionId != i) {
    //     setActiveSectionId(i)
    //   }
    //   return
    // }

    // if (activeSectionId != -1) {
    //   setActiveSectionId(-1)
    // }
  }

  useEffect(() => {
    window.addEventListener("scroll", calculateActiveSection)

    return (): void => {
      window.removeEventListener("scroll", calculateActiveSection)
    }
  }, [calculateActiveSection])

  // Sets the browser id
  useEffect(() => {
    browserId.current = localStorage.getItem("browserId") || uuidv4()
    localStorage.setItem("browserId", browserId.current)
  }, [browserId])

  // Connect function
  const connect = useCallback(() => {
    if (connection.current) {
      connection.current.close()
    }
    // TODO: Dont connect if there isnt a server passed into it
    // if (!this.props.server) {
    //   return
    // }
    // TODO: Check if it's valid :(
    const connectionQuery = {
      browserId: browserId,
      // googleToken: this.props.googleToken,
    };

    connection.current = PingWS(
      // Fix url
      new ReconnectingWebSocket(`${server}?${queryString.stringify(connectionQuery)}`)
    )

    connection.current.addEventListener("open", () => {
      setConnected(true)
      //   TODO: on connect logic
      //   Object.keys(this.editorUpdaters).forEach((editorId) => {
      //     const message = GetMessage.check({ type: "get", editorId })
      //     this.connection?.send(JSON.stringify(message))
      //   })
    })

    connection.current.addEventListener("close", () => {
      setConnected(false)
    })

    // TODO: Might not actually need this
    // connection.current.addEventListener(
    //   "message",
    //   filterPingPongMessages(({ data }) => {
    //     const message = JSON.parse(data)
    //     if (UpdateMessage.guard(message)) {
    //       this.update(message)
    //     }
    //   })
    // )
  }, [connection, setConnected])

  // TODO: Set up types for message
  const save = useCallback((message: any) => {
    if (server) {
      // TODO: Validate message
      const update = UpdateMessage.check({
        type: "update",
        browserId: message.editorId,
        saveId: message.saveId,
        value: message.value,
        cursor: message.cursor,
      })
      // this.update(update)
      return
    }
    if (!connection.current || !connected) {
      throw new Error("server not connected")
    }
    // Validate the message somehow
    // SaveMessage.check(message)
    connection.current?.send(JSON.stringify(message))
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

  return <ElementTrackerContext.Provider value={{ connected, save, register: () => { } }} >{children}</ElementTrackerContext.Provider>
}

export { ElementTracker, ElementTrackerContext }
