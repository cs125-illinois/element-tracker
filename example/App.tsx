import React from "react"
import { hot } from "react-hot-loader"

import { GoogleLoginProvider, WithGoogleTokens } from "@cs125/react-google-login"

import { ElementTracker, ElementTrackerContext } from "../client/"

import components from "./components"

const App: React.FC = () => (
  // @ts-ignore
  <ElementTracker server={'ws://localhost:8888/'} googleToken={'idToken'} components={["h1", "h2", "h3", "h4"]}>
    <h1>My Header 1</h1>
    <br />
    <br />
    <br />
    <h2>My Header 2</h2>
    <br />
    <br />
    <br />
    <h2>My Header 2</h2>
    <br />
    <br />
    <br />
    <h3>My Header 3</h3>
    <br />
    <br />
    <br />
    <h4>My Header 4</h4>
    <br />
    <br />
    <br />
    <h3>My Header 3</h3>
    <br />
    <br />
    <br />
    <h4>My Header 4</h4>
    <br />
    <br />
    <br />
    <h4>My Header 4</h4>
    <br />
    <br />
    <br />
    <h2>My Header 2</h2>
    <br />
    <br />
    <br />
    <h1>My Header 1</h1>
    <br />
    <br />
    <br />
    <h2>My Header 2</h2>
    <br />
    <br />
    <br />
  </ElementTracker>
)
export default hot(module)(App)
