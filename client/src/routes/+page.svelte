<script context="module" lang="ts">
    import { Button } from "$lib/components/ui/button"
    import { Input } from "$lib/components/ui/input"
    import { Label } from "$lib/components/ui/label"
    import { UsernameRegex, type Username } from "@dartagnan/api/user"
    import { CodeRegex, type Code } from "@dartagnan/api/code"
</script>
<script lang="ts">
    let username: Username
    let roomCode: Code
    $: usernameValid = UsernameRegex.test(username)
    $: roomCodeValid = CodeRegex.test(roomCode)
    $: valid = usernameValid && roomCodeValid
</script>
<div class="flex w-fit max-w-sm flex-col gap-1.5">
    <Label for="username">Username</Label>
    <Input type="text" id="username" placeholder="Username" pattern={UsernameRegex.source} bind:value={username} maxlength={8} required />
    <p class="text-muted-foreground text-sm">Username is up to 8 characters long.</p>
    <Label for="room-code">Room Code</Label>
    <Input type="text" id="room-code" placeholder="Room Code" pattern={CodeRegex.source} bind:value={roomCode} maxlength={8} required />
    <Button disabled={!valid}>Play</Button>
</div>