import { UsernameRegex } from "@dartagnan/api/user"
import { CodeRegex } from "@dartagnan/api/code"

const usernameInput = document.querySelector<HTMLInputElement>("#username")!
const roomCodeInput = document.querySelector<HTMLInputElement>("#room-code")!
const joinButton = document.querySelector<HTMLButtonElement>("#join")!
const createButton = document.querySelector<HTMLButtonElement>("#create")!

usernameInput.pattern = UsernameRegex.source
roomCodeInput.pattern = CodeRegex.source

const updateButton = () => {
    joinButton.disabled = !usernameInput.checkValidity() || !roomCodeInput.checkValidity()
    createButton.disabled = !usernameInput.checkValidity()
}

usernameInput.addEventListener("input", updateButton)
roomCodeInput.addEventListener("input", updateButton)
updateButton()

joinButton.addEventListener("click", () => {
    const username = usernameInput.value
    const roomCode = roomCodeInput.value
    window.location.href = `/game?username=${username}&&code=${roomCode}`
})

createButton.addEventListener("click", () => {
    const username = usernameInput.value
    window.location.href = `/game?username=${username}`
})