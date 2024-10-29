import { WebSocketServer } from "ws"
import { GameServer } from "#gameServer"
import { Hub } from "#hub"

const H = new Hub()
const GS = new GameServer(H)
const WSS = new WebSocketServer({ port: 8080 })

GS.connect(WSS)
