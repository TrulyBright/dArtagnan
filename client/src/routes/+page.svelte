<script context="module" lang="ts">
    import UserComponent from "$lib/components/user.svelte"
    import { calculatePositions } from "$lib/utils"
</script>
<script lang="ts">
    let userCount = 0
    $: positions = calculatePositions(200, 200, userCount)
</script>

<input type="number" bind:value={userCount} min="0" max="8" />

{#each positions as { x, y }, index}
    <UserComponent id={index} name={String(index)} index={index} userCount={userCount} left={x} top={y} />
{/each}