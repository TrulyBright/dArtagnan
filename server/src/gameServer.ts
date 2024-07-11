import { WebSocketServer } from "ws"
import { dispatch, isUserCommand } from "./action"
import { User } from "./user"
import { isUsername } from "@api/user"
import { isCode } from "@api/code"
import { Hub } from "./hub"
import { Action } from "@api/action"

export class GameServer {
    readonly connectedWss = new Set<WebSocketServer>()
    constructor(private hub: Hub) {}
    connect(wss: WebSocketServer) {
        wss.on('connection', ws => {
            if (!this.hub) return
            const url = new URL(ws.url)
            const name = url.searchParams.get('name')
            const code = url.searchParams.get('code')
            if (!isUsername(name)) return
            if (!isCode(code) && code !== null) return
            const user = new User(name)
            this.hub.addUser(user, code)
            ws
            .on('message', (data) => {
                const parsed: Action = JSON.parse(data.toString())
                const cmd = dispatch(parsed)
                if (isUserCommand(cmd)) cmd.exec(user)
                else if (user.player) cmd.exec(user.player)
            })
            .once('close', () => {
                user.room?.removeUser(user)
            })
        })
        this.connectedWss.add(wss)
        return this
    }
}