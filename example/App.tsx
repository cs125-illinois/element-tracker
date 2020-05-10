import React, { useRef } from "react"
import { hot } from "react-hot-loader"

import { GoogleLoginProvider, WithGoogleTokens } from "@cs125/react-google-login"

import { Container, Ref, Responsive, Segment, Rail, Sticky } from "semantic-ui-react"

import { MDXProvider } from "@mdx-js/react"
import Content from "./index.mdx"

import { components, SidebarMenu } from "./components"

import { ElementTracker } from "@cs125/element-tracker"

import { String } from "runtypes"
const ET_SERVER = String.check(process.env.ET_SERVER)

const App: React.FC = () => {
  const contextRef = useRef()

  return (
    <GoogleLoginProvider
      // eslint-disable-next-line @typescript-eslint/camelcase
      clientConfig={{ client_id: process.env.GOOGLE_CLIENT_IDS as string }}
    >
      <WithGoogleTokens>
        {({ idToken }): JSX.Element => {
          return (
            <ElementTracker server={ET_SERVER} tags={["h1", "h2", "h3", "h4"]} googleToken={idToken}>
              <Container text>
                <Ref innerRef={contextRef}>
                  <Segment basic>
                    <Responsive minWidth={1200}>
                      <Rail position="right">
                        <Sticky context={contextRef}>
                          <Segment basic style={{ paddingTop: 64 }}>
                            <SidebarMenu />
                          </Segment>
                        </Sticky>
                      </Rail>
                    </Responsive>
                    <MDXProvider components={components}>
                      <Content />
                    </MDXProvider>
                  </Segment>
                </Ref>
              </Container>
            </ElementTracker>
          )
        }}
      </WithGoogleTokens>
    </GoogleLoginProvider>
  )
}
export default hot(module)(App)
