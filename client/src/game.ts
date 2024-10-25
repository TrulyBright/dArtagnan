const urlParams = new URLSearchParams(window.location.search)
const username = urlParams.get("username")!
const code = urlParams.get("code")
const wsParam = code ? `?name=${username}&code=${code}` : `?name=${username}`
const WS = new WebSocket(`ws://${window.location.host}/game${wsParam}`)
WS.onopen = () => {
    console.log("Connected")
}
WS.onclose = () => {
    console.log("Disconnected")
}
WS.onmessage = event => {
    console.log(event.data)
}
WS.onerror = event => {
    console.error(event)
}

const codeDisplay = document.getElementById("code")!
codeDisplay.textContent = code!