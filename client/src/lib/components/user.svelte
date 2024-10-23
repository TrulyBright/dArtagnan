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
    export let pos: [number, number]
    const U = new User(id, name, index)
    $: image_url = `/sprites/Idle${whichSprite(index, userCount)}.png`
</script>

<div class="user" style="left: {pos[0]}%; top: {pos[1]}%;">
    <div class="user-bg" style="background-image: url({image_url});">
    </div>
    <div class="user-tag">
        {U.name}
    </div>
</div>

<style>
    .user {
        position: absolute;
        width: 128px;
        height: 64px;
        transform: translate(-50%, -50%);
        overflow: hidden;
    }
    .user-tag {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .user-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 2560px;
        height: 128px;
        background-repeat: repeat-x;
        background-size: 2560px 128px;
        animation: play 2s steps(20) infinite;
    }
    @keyframes play {
        /**
            Don't use background-position. It's resource-intensive.
        */
        to { transform: translateX(-100%); }
    }
</style>