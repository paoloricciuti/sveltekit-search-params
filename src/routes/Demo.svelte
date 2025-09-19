<script>
	import { queryParameters, ssp } from "$lib";

    const params = queryParameters({
        q: ssp.string(),
        page: ssp.number(1)
    })

    let parsed = $derived(params.$parsed());
</script>

Defined: {JSON.stringify(parsed)}<br>
All: {JSON.stringify(params.toJSON())}
<br><br>
<input bind:value={params.q}/><br>
<button disabled={params.page < 2} onclick={() => params.page--}>Previous</button>
<button onclick={() => params.page++}>Next</button><br>
<br>