<script context="module" lang="ts">
    import "../app.css"
    import Sun from "lucide-svelte/icons/sun"
    import Moon from "lucide-svelte/icons/moon"
    import { resetMode, setMode, ModeWatcher } from "mode-watcher"
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js"
    import { Button } from "$lib/components/ui/button/index.js"
</script>
<div class="mb-1">
    <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
            <Button builders={[builder]} variant="outline" size="icon">
            <Sun
                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            />
            <Moon
                class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            />
            <span class="sr-only">Toggle theme</span>
            </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
            <DropdownMenu.Item on:click={() => setMode("light")}
            >Light</DropdownMenu.Item
            >
            <DropdownMenu.Item on:click={() => setMode("dark")}>Dark</DropdownMenu.Item>
            <DropdownMenu.Item on:click={() => resetMode()}>System</DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</div>
<ModeWatcher />
<div class="w-full h-full flex flex-col justify-content items-center">
    <slot></slot>
</div>