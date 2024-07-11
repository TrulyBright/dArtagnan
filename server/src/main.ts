import { WebSocketServer } from "ws"
import { Hub } from "./hub"
import { GameServer } from "./gameServer"

const H = new Hub()
const GS = new GameServer(H)
const WSS = new WebSocketServer()

GS.connect(WSS)