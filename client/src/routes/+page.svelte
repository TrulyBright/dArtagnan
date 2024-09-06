<script context="module">
    import UserComponent from "$lib/components/user.svelte"
</script>
<script lang="ts">
    let userCount = 0
    $: positions = calculatePositions(userCount)

    const calculatePositions = (count: number) => {
        const positions = []
        const radius = 100
        const centerX = 200
        const centerY = 200
        for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI / count) * i + Math.PI / 2
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            positions.push({ x, y })
        }
        return positions
    }
</script>

<input type="number" bind:value={userCount} min="0" max="8" />

{#each positions as { x, y }, index}
    <UserComponent id={index} name={String(index)} index={index} userCount={userCount} left={x} top={y} />
{/each}