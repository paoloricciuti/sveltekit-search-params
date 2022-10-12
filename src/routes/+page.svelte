<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { ssp, createSearchParamsStore } from "sveltekit-search-params";

    const store = createSearchParamsStore(page, goto, {
        name: ssp.string(),
        count: ssp.number(),
        bool: ssp.boolean(),
        obj: ssp.object(),
        arr: ssp.array(),
        lz: ssp.lz(),
    });
</script>

Test
<section>
    <pre>{JSON.stringify($store, null, 2)}</pre>
    <hr />
    <input
        value={$store.name}
        on:input={(e) => {
            $store.name = e.currentTarget.value;
        }}
    />
    <hr />
    <input
        value={$store.count}
        on:input={(e) => {
            $store.count = e.currentTarget.valueAsNumber;
        }}
        type="number"
    />
    <hr />
    <input
        checked={$store.bool}
        on:change={(e) => {
            $store.bool = e.currentTarget.checked;
        }}
        type="checkbox"
    />
    <hr />
    <pre>{JSON.stringify($store.obj, null, 2)}</pre>
    <hr />
    <button
        on:click={() => {
            $store.arr = [...($store.arr ?? []), Math.random()];
        }}>Add</button
    >
    {#each $store.arr ?? [] as elem}
        <div>{elem}</div>
    {:else}
        No elements
    {/each}
    <hr />
    {JSON.stringify($store.lz)}
    <input
        value={$store.lz ?? ""}
        on:input={(e) => {
            $store.lz = e.currentTarget.value;
        }}
    />
</section>
