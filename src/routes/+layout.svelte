<script lang="ts">
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { installLogBrewBrowser } from '@logbrew/browser';
	import { setLogBrewContext } from '@logbrew/svelte';

	let { children } = $props();

	if (browser && env.PUBLIC_LOGBREW_CLIENT_KEY) {
		const environment = env.PUBLIC_LOGBREW_ENVIRONMENT || 'production';
		const release =
			env.PUBLIC_LOGBREW_RELEASE || 'sveltekit-search-params@unversioned';
		setLogBrewContext(
			installLogBrewBrowser({
				clientKey: env.PUBLIC_LOGBREW_CLIENT_KEY,
				context: {
					schemaVersion: 1,
					resource: {
						deployment: { environment, release },
						service: { name: 'sveltekit-search-params-web' },
					},
				},
				environment,
				release,
				runtime: 'browser',
				service: 'sveltekit-search-params-web',
			}),
		);
	}
</script>

{@render children()}
