<script context="module" lang="ts">
    import { whichSprite } from "$lib/utils"
</script>
<script lang="ts">
    import User from "$lib/user"
    import type { Username } from "@dartagnan/api/user"
    export let id: number
    export let name: Username
    export let index: number
    export let userCount: number
    export let left: number
    export let top: number
    const U = new User(id, name, index)
    $: image_url = `sprites/Idle${whichSprite(index, userCount)}.png`
</script>

<div class="user" style="left: {left}px; top: {top}px; background-image: url({image_url});">{U.name}</div>

<style>
    .user {
        position: absolute;
        width: 128px;
        height: 128px;
        background-repeat: no-repeat;
        background-origin: 0 0;
        background-size: auto 128px;
        animation: play 2s steps(20) infinite;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    @keyframes play {
        to {
            background-position: -2560px;
        }
    }
</style>