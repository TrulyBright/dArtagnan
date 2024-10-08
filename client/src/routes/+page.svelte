<script context="module" lang="ts">
    import UserComponent from "$lib/components/user.svelte"
    import { calculatePositions } from "$lib/utils"
</script>
<script lang="ts">
    let userCount = 0
    $: positions = calculatePositions(userCount)
</script>

<div class="game-box">
    <input type="number" bind:value={userCount} min="0" max="8" />
    <div class="user-circle">
        {#each positions as { x, y }, index}
            <UserComponent
                id={index}
                name={String(index)}
                index={index}
                userCount={userCount}
                pos={[x, y]}
            />
        {/each}
    </div>
</div>
<style>
    .game-box {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .user-circle {
        position: relative;
        margin-top: 30%;
        width: 80vw;
        height: 80vw;
        border: 1px solid black;
        border-radius: 100%;
    }
</style>