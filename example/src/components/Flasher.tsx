import React, { useState, useRef, useEffect } from "react"

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
      <h2 id="flasher">Flasher</h2>
      <p>{content.current}</p>
    </>
  ) : null
}
export default Flasher
