export async function load({ url }) {
	// reading the search makes every write rerun this load
	void url.search;
	await new Promise((resolve) => setTimeout(resolve, 200));
}
