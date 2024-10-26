<script setup lang="ts">
import { ref } from 'vue'
import { type Username, UsernameRegex } from "@dartagnan/api/user"
import { type Code, CodeRegex } from "@dartagnan/api/code"
import LabeledInput from '@/components/LabeledInput.vue'
import { RouterLink } from "vue-router"

const username = ref<Username>()
const roomCode = ref<Code>()
const usernameValid = ref(false)
const roomCodeValid = ref(false)
</script>

<template>
  <LabeledInput label="1. 사용할 이름을 입력해주세요." placeholder="이름" :maxlength="8" :required="true" :pattern="UsernameRegex" v-model:value="username" v-model:valid="usernameValid" />
  <LabeledInput label="2. 입장할 방의 코드를 입력해주세요." placeholder="방 코드" :maxlength="8" :required="true" :pattern="CodeRegex" v-model:value="roomCode" v-model:valid="roomCodeValid" />
  <div class="my-1">
    <p class="text-sm mb-1">3. 입장합시다!</p>
    <RouterLink
      class="text-inherit hover:text-inherit"
      :to="`/room?username=${username}&code=${roomCode}`">
      <button type="button"
        class="disabled:opacity-75 disabled:cursor-not-allowed"
        :disabled="!usernameValid || !roomCodeValid"
      >{{ roomCode }}<span v-if="roomCode">번 방에 </span>입장</button>
    </RouterLink>
  </div>
  <div class="my-1">
    <p class="text-sm mb-1">4. 아니면, 방을 직접 만드세요.</p>
    <RouterLink
      class="text-inherit hover:text-inherit"
      :to="`/room?username=${username}`">
      <button type="button"
        class="disabled:opacity-75 disabled:cursor-not-allowed"
        :disabled="!usernameValid"
      >방 만들기</button>
    </RouterLink>
  </div>
</template>
