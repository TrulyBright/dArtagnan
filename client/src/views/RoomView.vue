<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { type Drift } from "@dartagnan/api/drift"
import { type Cmd } from "@dartagnan/api/cmd"

const WS = reactive(new WebSocket(`ws://${location.host}/game`))

const drift = ref<Drift>(0)
const message = ref<string>('')
const driftText = computed(() => drift.value === 1 ? "증가" : drift.value === -1 ? "감소" : "유지")
const driftColor = computed(() => drift.value === 1 ? "text-green-400" : drift.value === -1 ? "text-red-400" : "text-yellow-400")

const sendCmd = (c: Cmd) => WS.send(JSON.stringify(c))

const onMessageInputEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.isComposing) speak()
}
const onMessageInput = (e: InputEvent) => {
    message.value = (e.target as HTMLInputElement).value
}
const speak = () => {
    message.value = message.value.trim()
    if (!message.value) return
    sendCmd({ tag: "Speak", message: message.value })
}
const toggleDrift = () => {
    drift.value = drift.value === 1 ? -1 : drift.value === -1 ? 0 : 1
    sendCmd({ tag: "SetDrift", drift: drift.value })
}
</script>
<template>
    <div class="flex flex-col items-center">
        <div><small>방 코드: <span>{{ $route.query.code }}</span></small></div>
        <div class="size-96 border-2 object-center">게임판</div>
        <div>
            <div class="flex flex-row">
                <button type="button" class="grow text-xs break-keep" @click="toggleDrift">
                    <div>
                        <p>
                            명중률이 대체로 <strong :class="driftColor">{{ driftText }}</strong>
                            <span v-if="drift === 0">됩</span><span v-else>합</span>니다.
                        </p>
                        <p>누르면 경향세가 바뀝니다.</p>
                    </div>
                </button>
                <button type="button" disabled class="grow text-xs break-keep disabled:opacity-75 disabled:cursor-not-allowed">
                    <p>누르면 <strong class="text-blue-400">보험</strong> 카드를 사용합니다.</p>
                    <p><strong class="text-blue-400">보험</strong>: 10달러를 지불합니다. 사망 시 80달러를 얻습니다.</p>
                </button>
            </div>
            <div class="flex">
                <input type="text" class="grow p-1 rounded-md" placeholder="여기에 할 말 입력..." :value="message" maxlength="80" @input="onMessageInput" @keydown="onMessageInputEnter" />
                <button type="button" class="p-1 rounded-md" @click="speak">전송</button>
            </div>
        </div>
    </div>
</template>