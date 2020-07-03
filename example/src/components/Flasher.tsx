import React, { useState, useRef, useEffect } from "react"

import { H2, P } from "@cs125/gatsby-theme-cs125/src/material-ui"

import { LoremIpsum as LI } from "lorem-ipsum"

const lorem = new LI()
const Flasher: React.FC = () => {
  const content = useRef(lorem.generateParagraphs(1))
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(!visible)
    }, 1000)
    return (): void => {
      clearTimeout(timer)
    }
  })
  return visible ? (
    <>
      <H2 data-et="true" data-et-id="flasher">
        Flasher
      </H2>
      <P>{content.current}</P>
    </>
  ) : null
}
export default Flasher
