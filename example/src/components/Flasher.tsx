import React, { useState, useRef, useEffect } from "react"

import { LoremIpsum as LI } from "lorem-ipsum"

const lorem = new LI()
const Flasher: React.FC = () => {
  const content = useRef(lorem.generateParagraphs(1))
  const [visible, setVisible] = useState(false)
  const timer = useRef(
    setTimeout(() => {
      setVisible(!visible)
    }, 1000)
  )
  useEffect(() => {
    return (): void => {
      clearTimeout(timer.current)
    }
  })
  return visible ? (
    <>
      <h2 id="flasher">Flasher</h2>
      <p>{content.current}</p>
    </>
  ) : null
}
export default Flasher
