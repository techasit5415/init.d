<script lang="ts">
	import { FilePlus2, Activity, ShieldCheck, Server } from '@lucide/svelte';
	import { page } from '$app/state';

	const user = $derived(page.data.user);
	const isAdmin = $derived(user?.role === 'admin');

	const features = [
		{
			href: '/request',
			icon: FilePlus2,
			title: 'Request',
			body: 'Define hostnames, resources, ports and a lease window. We file the ticket; ops builds it.'
		},
		{
			href: '/status',
			icon: Activity,
			title: 'Status',
			body: 'A live read-out of every instance you have requested, scoped strictly to your email.'
		},
		...(isAdmin
			? [
					{
						href: '/admin',
						icon: ShieldCheck,
						title: 'Admin',
						body: 'A realtime stream of incoming lease requests. Resolve them once Proxmox/OPNsense is provisioned.'
					}
				]
			: [])
	];
</script>

<section class="py-12">
	<p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// LEASE</p>
	<h1 class="mt-3 text-4xl font-semibold tracking-tight text-app">
		Infrastructure provisioning, written down before it is built.
	</h1>
	<p class="mt-4 max-w-2xl text-secondary-app">
		Submit a lease request, watch it move through the queue, and let the operators wire it up. No
		tickets, no chat messages — just a single source of truth that lives between you and the
		hypervisor.
	</p>

	{#if !user}
		<a
			href="/login"
			class="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-5 font-mono text-xs uppercase tracking-widest text-app transition-colors duration-300 hover:bg-accent-soft hover:text-accent"
		>
			<Server class="h-4 w-4" />
			Sign in to start
		</a>
	{/if}
</section>

<section class="mt-12 grid gap-px overflow-hidden rounded-lg border border-app bg-app sm:grid-cols-2">
	{#each features as feature (feature.href)}
		<a
			href={feature.href}
			class="group flex flex-col gap-3 bg-surface p-6 transition-colors duration-300 hover:bg-elevated"
		>
			<div class="flex items-center gap-2">
				<feature.icon class="h-4 w-4 text-accent" />
				<span class="font-mono text-xs uppercase tracking-widest text-app">{feature.title}</span>
			</div>
			<p class="text-sm text-secondary-app">{feature.body}</p>
		</a>
	{/each}
</section>
