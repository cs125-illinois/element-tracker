import { Record, Partial, Number, Static, String, Array, Literal, Union, Boolean, Lazy } from "runtypes"

export const Component: Record<any, false> = Lazy(() => Record({
  tagName: String,
  visible: Boolean,
  id: String,
  children: Array(Component)
}))
export type Component = {
  tagName: string,
  visible: boolean,
  id: string,
  children: Component[]
}

export const UpdateMessage = Record({
  type: Literal("update"),
  editorId: String,
  // updateId: String,
  data: Array(Component),
})
export type UpdateMessage = Static<typeof UpdateMessage>

export const ConnectionQuery = Record({
  browserId: String,
}).And(
  Partial({
    googleToken: String,
  })
)
export type ConnectionQuery = Static<typeof ConnectionQuery>

export const ClientId = Record({
  browserId: String,
  origin: String,
}).And(
  Partial({
    email: String,
  })
)
export type ClientId = Static<typeof ClientId>

export const ServerStatus = Record({
  started: String.withConstraint((s) => Date.parse(s) !== NaN),
  version: String,
  commit: String,
  counts: Record({
    client: Number,
    save: Number,
    get: Number,
  }),
  googleClientIDs: Array(String),
})
export type ServerStatus = Static<typeof ServerStatus>
