import Koa from "koa"
import Router from "koa-router"
import bodyParser from "koa-bodyparser"
import cors from "@koa/cors"
import websocket from "koa-easy-ws"
import WebSocket from "ws"
import { PongWS, filterPingPongMessages } from "@cs125/pingpongws"

import { MongoClient as mongo } from "mongodb"
import mongodbUri from "mongodb-uri"

import { OAuth2Client } from "google-auth-library"

import {
  ConnectionQuery,
  ConnectionLocation,
  ConnectionSave,
  UpdateMessage,
  UpdateSave,
  LoginMessage,
  LoginSave,
} from "../types"

import { String, Array } from "runtypes"

const versions = {
  commit: String.check(process.env.GIT_COMMIT),
  server: String.check(process.env.npm_package_version),
}

const MONGODB = String.check(process.env.MONGODB)
const MONGODB_COLLECTION = String.check(process.env.MONGODB_COLLECTION || "elementTracker")

const app = new Koa()
const router = new Router<Record<string, unknown>, { ws: () => Promise<WebSocket> }>()

const googleClientIDs =
  process.env.GOOGLE_CLIENT_IDS && Array(String).check(process.env.GOOGLE_CLIENT_IDS?.split(",").map((s) => s.trim()))
const googleClient = googleClientIDs && googleClientIDs.length > 0 && new OAuth2Client()

const { database } = mongodbUri.parse(MONGODB)
const client = mongo.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
const elementTrackerCollection = client.then((c) => c.db(database).collection(MONGODB_COLLECTION))

router.get("/", async (ctx) => {
  if (!ctx.ws) {
    ctx.body = {}
    return
  }

  const connectionQuery = ConnectionQuery.check(ctx.request.query)
  const { browserId, tabId } = connectionQuery

  const connectionLocation = ConnectionLocation.check({
    origin: ctx.headers.origin,
    browserId,
    tabId,
  })

  let email: string | undefined
  const ws = PongWS(await ctx.ws())
  await (await elementTrackerCollection).insertOne(
    ConnectionSave.check({ versions, type: "connected", ...connectionLocation, timestamp: new Date() })
  )
  ws.addEventListener(
    "message",
    filterPingPongMessages(async ({ data }) => {
      const message = JSON.parse(data.toString())
      if (UpdateMessage.guard(message)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const savedUpdate = UpdateSave.check({
          versions,
          ...connectionLocation,
          ...message,
          ...(email && { email }),
          timestamp: new Date(),
        })
        await (await elementTrackerCollection).insertOne(savedUpdate)
      } else if (LoginMessage.guard(message)) {
        if (googleClient) {
          const { googleToken: idToken } = message
          try {
            email = (
              await googleClient.verifyIdToken({
                idToken,
                audience: googleClientIDs || [],
              })
            ).getPayload()?.email
            const savedLogin = LoginSave.check({
              versions,
              ...connectionLocation,
              type: "login",
              email,
              timestamp: new Date(),
            })
            await (await elementTrackerCollection).insertOne(savedLogin)
          } catch (err) {}
        }
      } else {
        console.error(`Bad message: ${JSON.stringify(message, null, 2)}`)
      }
    })
  )
  ws.addEventListener("close", async () => {
    await (await elementTrackerCollection).insertOne(
      ConnectionSave.check({ versions, type: "disconnected", ...connectionLocation, timestamp: new Date() })
    )
  })
})

elementTrackerCollection.then(async (c) => {
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
