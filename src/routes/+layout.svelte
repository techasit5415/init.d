<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>init.d — infrastructure provisioning</title>
</svelte:head>

<div class="min-h-screen bg-app text-app transition-colors duration-300">
	<Navbar />
	<main class="mx-auto max-w-[1400px] px-6 py-10">
		{@render children()}
	</main>
</div>
