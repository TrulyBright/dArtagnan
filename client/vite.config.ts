import { resolve } from "path"
import { defineConfig } from "vite"

export default defineConfig({
    root: "src",
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, "src/index.html"),
                game: resolve(__dirname, "src/game.html"),
            },
        },
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: true,
    }
})