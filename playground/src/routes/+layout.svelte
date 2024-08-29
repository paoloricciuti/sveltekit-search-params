<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		document.body.setAttribute('data-kit-started', '');
	});
</script>

<slot />
