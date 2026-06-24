<script lang="ts">
	import { FilePlus2, Activity, ShieldCheck, Server, ArrowRight } from '@lucide/svelte';
	import { page } from '$app/state';

	const user = $derived(page.data.user);
	const isAdmin = $derived(user?.role === 'admin');

	const features = $derived([
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
	]);
</script>

<section class="py-8 sm:py-12">
	<p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// init.d</p>
	<h1 class="mt-3 text-3xl font-semibold tracking-tight text-app sm:text-4xl">
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
			class="group mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-5 font-mono text-xs uppercase tracking-widest text-zinc-950 shadow-sm transition-all duration-300 hover:gap-3 hover:shadow-[0_0_24px_-4px_var(--accent)]"
		>
			<Server class="h-4 w-4" />
			Sign in to start
			<ArrowRight
				class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
			/>
		</a>
	{/if}
</section>

<section class="mt-12 grid gap-px overflow-hidden rounded-lg border border-app bg-app sm:grid-cols-2">
	{#each features as feature (feature.href)}
		<a
			href={feature.href}
			class="group relative flex flex-col gap-3 bg-surface p-6 transition-all duration-300 hover:bg-elevated"
		>
			<!-- Left border accent — invisible at rest, slides in on hover -->
			<span
				class="absolute inset-y-0 left-0 w-0 bg-accent transition-all duration-300 group-hover:w-0.5"
				aria-hidden="true"
			></span>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<feature.icon
						class="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110"
					/>
					<span
						class="font-mono text-xs font-semibold uppercase tracking-widest text-app transition-colors duration-300 group-hover:text-accent"
					>
						{feature.title}
					</span>
				</div>
				<!-- Arrow that slides in from the left on hover -->
				<ArrowRight
					class="h-4 w-4 -translate-x-2 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
				/>
			</div>

			<p
				class="text-sm leading-relaxed text-secondary-app transition-colors duration-300 group-hover:text-app"
			>
				{feature.body}
			</p>
		</a>
	{/each}
</section>
