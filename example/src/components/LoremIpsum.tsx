import React, { useMemo } from "react"
import PropTypes from "prop-types"

import { LoremIpsum as LI } from "lorem-ipsum"

const lorem = new LI()
const LoremIpsum: React.FC<{ p: number }> = ({ p }) => {
  const paragraphs = useMemo(() => {
    const ps = []
    for (let i = 0; i < p; i++) {
      ps.push(<p key={i}>{lorem.generateParagraphs(1)}</p>)
    }
    return ps
  }, [p])
  return <React.Fragment>{paragraphs}</React.Fragment>
}
LoremIpsum.propTypes = {
  p: PropTypes.number.isRequired,
}
export default LoremIpsum
