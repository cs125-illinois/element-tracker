import _ from "lodash"

import Koa from "koa"
import Router from "koa-router"
import bodyParser from "koa-bodyparser"
import cors from "@koa/cors"
import websocket from "koa-easy-ws"

import { MongoClient as mongo } from "mongodb"
import mongodbUri from "mongodb-uri"

import { OAuth2Client } from "google-auth-library"

import WebSocket from "ws"
import { PongWS, filterPingPongMessages } from "@cs125/pingpongws"

import { ConnectionQuery, UpdateMessage, ClientId, } from "../types"

import { Array, String } from "runtypes"

const app = new Koa()
const router = new Router<{}, { ws: () => Promise<WebSocket> }>()
// const googleClientIDs = process.env.GOOGLE_CLIENT_IDS && Array(String).check(process.env.GOOGLE_CLIENT_IDS?.split(",").map((s) => s.trim()))
// const googleClient = googleClientIDs && googleClientIDs.length > 0 && new OAuth2Client(googleClientIDs[0])

const { database } = mongodbUri.parse(process.env.MONGODB as string)
// console.log(process.env)
const client = mongo.connect(process.env.MONGODB as string, { useNewUrlParser: true, useUnifiedTopology: true })
const elementTrackerCollection = client.then((c) => c.db(database).collection(process.env.MONGODB_COLLECTION || "elementTracker"))

// const serverStatus: ServerStatus = ServerStatus.check({
//     started: new Date().toISOString(),
//     version: process.env.npm_package_version,
//     commit: process.env.GIT_COMMIT,
//     counts: {
//         client: 0,
//         save: 0,
//         get: 0,
//     },
//       googleClientIDs,
// })

const serverStatus: any = {
  started: new Date().toISOString(),
  version: process.env.npm_package_version,
  commit: process.env.GIT_COMMIT,
  counts: {
    client: 0,
    save: 0,
    get: 0,
  }
}
const websocketsForClient: Record<string, WebSocket[]> = {}

function websocketIdFromClientId(clientId: ClientId): string {
  return `${clientId.origin}/${clientId.email || clientId.browserId}`
}

async function doUpdate(clientId: ClientId, updateMessage: UpdateMessage): Promise<void> {

  const { data } = updateMessage

  await (await elementTrackerCollection).insertOne({
    timestamp: new Date(),
    ...clientId,
    data
  })
}

// async function doSave(clientId: ClientId, saveMessage: SaveMessage): Promise<void> {
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const { type, ...savedContent } = saveMessage

//   await (await maceCollection).insertOne({
//     timestamp: new Date(),
//     ...clientId,
//     saved: savedContent,
//   })
//   await doUpdate(clientId, saveMessage)
// }

function terminate(clientId: string, ws: WebSocket): void {
  try {
    ws.terminate()
  } catch (err) { }
  _.remove(websocketsForClient[clientId], ws)
  if (websocketsForClient[clientId].length === 0) {
    delete websocketsForClient[clientId]
  }
  serverStatus.counts.client = _.keys(websocketsForClient).length
}

router.get("/", async (ctx) => {
  if (!ctx.ws) {
    ctx.body = serverStatus
    return
  }

  const connectionQuery = ConnectionQuery.check(ctx.request.query)
  const { browserId } = connectionQuery

  // const { googleToken: idToken } = connectionQuery
  // let email
  // if (idToken && googleClient) {
  //   try {
  //     email = (
  //       await googleClient.verifyIdToken({
  //         idToken,
  //         audience: googleClientIDs || [],
  //       })
  //     ).getPayload()?.email
  //   } catch (err) { }
  // }

  const clientId = ClientId.check({ browserId, origin: ctx.headers.origin })
  const websocketId = websocketIdFromClientId(clientId)

  const ws = PongWS(await ctx.ws())
  if (websocketsForClient[websocketId]) {
    websocketsForClient[websocketId].push(ws)
  } else {
    websocketsForClient[websocketId] = [ws]
  }

  serverStatus.counts.client = _.keys(websocketsForClient).length

  ws.addEventListener(
    "message",
    filterPingPongMessages(async ({ data }) => {
      const message = JSON.parse(data.toString())
      if (UpdateMessage.guard(message)) {
        // if (message.value.length > maxEditorSize) {
        //   return ctx.throw(400, "Content too large")
        // }
        await doUpdate(clientId, message)
        // serverStatus.counts.save++
        // } else if (GetMessage.guard(message)) {
        //   serverStatus.counts.get++
        //   await doGet(clientId, message)
        // } else {
        console.error(`Bad message: ${JSON.stringify(message, null, 2)}`)
      }
    })
  )
  ws.addEventListener("close", () => {
    terminate(websocketId, ws)
  })
})

elementTrackerCollection.then(async (c) => {
  console.log(JSON.stringify(serverStatus, null, 2))

  await c.createIndex({ clientId: 1, editorId: 1, timestamp: 1 })

  const validDomains = process.env.VALID_DOMAINS && process.env.VALID_DOMAINS.split(",").map((s) => s.trim)
  const port = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT) : 8888
  app
    .use(
      cors({
        origin: (ctx) => {
          if (validDomains && validDomains.includes(ctx.headers.origin)) {
            return false
          }
          return ctx.headers.origin
        },
      })
    )
    .use(bodyParser())
    .use(websocket())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(port)
})


process.on("uncaughtException", (err) => {
  console.error(err)
})
