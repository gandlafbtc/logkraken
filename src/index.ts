import cors from "@elysiajs/cors";
import Elysia from "elysia";
import { ElysiaWS } from "elysia/dist/ws";
import { log, setUpLogger } from "../logger";
let connections = new Map<string, Socket>()
const decoder = new TextDecoder()

const app = new Elysia()
  .use(cors())
  .get('/', (req) => {
    log.info`GET /`
    req.request
    req.set.headers = {
      'Content-Type': 'application/json',
    }
    return {
      name: `logkraken`,
    }
  })
  .ws('/', {
    idleTimeout: 240,
    open(ws) {
      log.info`Received new connection: ${ws.id}`
      const relay = new Socket(ws)
      connections.set(ws.id, relay)
    },
    message(ws, message: object) {
      connections.get(ws.id)?.handle(message)
    },
    close(ws) {
      connections.delete(ws.id)
      log.info`client [${ws.id}] disconnected`
    },
    error(e) {
      log.error('Error on socket: {e}', { e })
    }
  })
  .listen(3333)

setUpLogger().then(() => {
  log.info`listening on port ${3333}`

})
class Socket {
  private _socket: ElysiaWS
  constructor(socket: ElysiaWS) {
    this._socket = socket
  }

  handle(chunk: object) {
    const view = new Uint8Array(Object.values(chunk));
    const message = decoder.decode(view);
    if (message.includes('\\n')) {
      message.split('\\n').forEach((l)=>{
        log.debug(l)
      })      
    }
    else {
      log.debug(message)
    }
  }
}