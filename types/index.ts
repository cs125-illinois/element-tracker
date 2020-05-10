import {
  Record,
  Partial,
  Static,
  String,
  Array,
  Literal,
  Boolean,
  Lazy,
  Runtype,
  Union,
  InstanceOf,
  Number,
} from "runtypes"

export const Component = Record({
  tag: String,
  visible: Boolean,
  top: Number,
  bottom: Number,
  height: Number,
}).And(
  Partial({
    id: String,
    text: String,
  })
)
export type Component = Static<typeof Component>

export const ComponentTree: Runtype<ComponentTree> = Lazy(() =>
  Component.And(
    Record({
      children: Array(ComponentTree),
    })
  )
)
export type ComponentTree = Component & { children: ComponentTree[] }

export const ConnectionQuery = Record({
  browserId: String,
  tabId: String,
}).And(
  Partial({
    googleToken: String,
  })
)
export type ConnectionQuery = Static<typeof ConnectionQuery>

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
    timestamp: InstanceOf(Date),
  })
)
export type ConnectionSave = Static<typeof ConnectionSave>

export const UpdateMessage = Record({
  type: Literal("update"),
  location: String,
  components: Array(Component),
})
export type UpdateMessage = Static<typeof UpdateMessage>

export const UpdateSave = Union(
  ConnectionLocation,
  UpdateMessage,
  Record({
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
  ConnectionLocation,
  Record({
    type: Literal("login"),
    timestamp: InstanceOf(Date),
    email: String,
  })
)
export type LoginSave = Static<typeof LoginSave>
