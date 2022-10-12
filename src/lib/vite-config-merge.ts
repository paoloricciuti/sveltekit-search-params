import type { UserConfig } from "vite";

export function mergeConfig(viteConfig: UserConfig = {}): UserConfig {
    let noExternal: (string | RegExp)[] | true = ["sveltekit-search-params"];
    if (Array.isArray(viteConfig?.ssr?.noExternal)) {
        noExternal.push(...(viteConfig?.ssr?.noExternal ?? []));
    }
    if (viteConfig?.ssr?.noExternal && (typeof viteConfig?.ssr?.noExternal === "string" || viteConfig?.ssr?.noExternal instanceof RegExp)) {
        noExternal.push(viteConfig.ssr.noExternal);
    }
    if (typeof viteConfig?.ssr?.noExternal === "boolean") {
        noExternal = true;
    }
    return {
        ...viteConfig,
        optimizeDeps: {
            ...viteConfig.optimizeDeps,
            exclude: [...(viteConfig?.optimizeDeps?.exclude ?? []), "sveltekit-search-params"],
        },
        ssr: {
            noExternal,
        }
    };
}