import { Record, Partial, Static, String, Array, Literal, Union, InstanceOf, Number } from "runtypes"

export interface ElementTree extends Element {
  descendants: ElementTree[]
}

export const ConnectionQuery = Record({
  browserId: String,
  tabId: String,
}).And(
  Partial({
    googleToken: String,
  })
)
export type ConnectionQuery = Static<typeof ConnectionQuery>

export const Versions = Record({
  commit: String,
  server: String,
})
export type Versions = Static<typeof Versions>

export const ConnectionLocation = Record({
  origin: String,
  browserId: String,
  tabId: String,
})
export type ConnectionLocation = Static<typeof ConnectionLocation>

export const ConnectionSave = Union(
  ConnectionLocation,
  Record({
    type: Union(Literal("connected"), Literal("disconnected")),
    versions: Versions,
    timestamp: InstanceOf(Date),
  })
)
export type ConnectionSave = Static<typeof ConnectionSave>

export const UpdateMessage = Record({
  type: Literal("update"),
  location: InstanceOf(Location),
  width: Number,
  height: Number,
  elements: Array(
    Record({
      top: Number,
      bottom: Number,
      tagName: String,
    }).And(Partial({ id: String, text: String }))
  ),
})
export type UpdateMessage = Static<typeof UpdateMessage>

export const UpdateSave = Union(
  Versions,
  ConnectionLocation,
  UpdateMessage,
  Record({
    versions: Versions,
    timestamp: InstanceOf(Date),
  }),
  Partial({
    email: String,
  })
)
export type UpdateSave = Static<typeof UpdateSave>

export const LoginMessage = Record({
  type: Literal("login"),
  googleToken: String,
})
export type LoginMessage = Static<typeof LoginMessage>

export const LoginSave = Union(
  Versions,
  ConnectionLocation,
  Record({
    type: Literal("login"),
    versions: Versions,
    timestamp: InstanceOf(Date),
    email: String,
  })
)
export type LoginSave = Static<typeof LoginSave>
