<script>
	import Lock from 'svelte-material-icons/Lock.svelte';
	export let title = 'Title';
	export let url = '';
</script>

<div class="browser">
	<div class="topbar">
		<button class="close" />
		<button class="minimize" />
		<button class="enlarge" />
		<span class="title">{title}</span>
	</div>
	<div class="url-bar">
		<div class="url">
			<button><Lock /></button>
			{url}
		</div>
	</div>
	<div class="content">
		<slot />
	</div>
</div>

<style>
	button {
		display: flex;
		margin-bottom: 0;
	}

	.browser {
		width: var(--width);
		aspect-ratio: 9 / 6;
		background-color: #222;
		border-radius: 0.5rem;
		overflow: hidden;
		--gap: 0.7%;
		--padding: 1%;
		font-family: sans-serif;
	}

	.topbar {
		display: flex;
		gap: var(--gap);
		padding: var(--padding);
		background: var(--topbar, #555);
		color: var(--topbar-color, white);
		align-items: center;
		position: relative;
		font-size: 1.8vw;
	}

	.topbar > :where(button) {
		border: 0;
		aspect-ratio: 1;
		width: 1.6%;
		background-color: #ff605c;
		border-radius: 50%;
	}

	.minimize {
		background-color: #ffbd44;
	}

	.enlarge {
		background-color: #00ca4e;
	}

	.title {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-weight: 600;
	}

	.url-bar {
		background: var(--url-bar, #555);
		display: flex;
		align-items: center;
		gap: var(--gap);
		padding: var(--padding);
	}

	.url-bar button {
		border: 0;
		background: transparent;
		color: black;
		aspect-ratio: 1;
	}

	.url {
		background: white;
		flex-basis: 100%;
		padding-block: calc(var(--padding) / 2);
		padding-inline: var(--padding);
		border-radius: 50vmax;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: var(--gap);
		overflow: hidden;
		white-space: nowrap;
		color: black;
	}

	.url > button {
		background: transparent;
		border: none;
		align-items: center;
	}

	.content {
		width: 100%;
		height: 100%;
	}
</style>
