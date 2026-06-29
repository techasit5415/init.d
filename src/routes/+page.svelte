<script lang="ts">
	import {
		FilePlus2,
		Activity,
		ShieldCheck,
		Server,
		ArrowRight,
	} from "@lucide/svelte";
	import { page } from "$app/state";

	const user = $derived(page.data.user);
	const isAdmin = $derived(user?.role === "admin");

	const features = $derived([
		{
			href: "/request",
			icon: FilePlus2,
			title: "Request Provisioning",
			body: "Submit requests for new virtual machines or container instances with custom compute, storage, and networking configurations.",
		},
		{
			href: "/status",
			icon: Activity,
			title: "Instance Status",
			body: "Track active provisioning status, lease queue placement, and retrieve access credentials for your active instances.",
		},
		...(isAdmin
			? [
					{
						href: "/admin",
						icon: ShieldCheck,
						title: "Admin Dashboard",
						body: "Manage pending leases, review system resource allocations, issue replies, and oversee active system queue.",
					},
				]
			: []),
	]);
</script>

<section class="py-12 sm:py-20 text-center max-w-2xl mx-auto">
	<h1
		class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--accent)] bg-clip-text text-transparent leading-tight pb-1"
	>
		Infrastructure Provisioning
	</h1>

	{#if !user}
		<a
			href="/login"
			class="group mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 font-mono text-xs uppercase tracking-widest text-zinc-950 font-bold shadow-md transition-all duration-300 hover:gap-3 hover:shadow-[0_0_30px_0_var(--accent)] hover:scale-[1.02]"
		>
			<Server class="h-4 w-4" />
			Sign in to start
			<ArrowRight
				class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
			/>
		</a>
	{/if}
</section>

<!-- Features Grid -->
<section
	class="mt-4 grid gap-6 grid-cols-1 {features.length === 3
		? 'md:grid-cols-3'
		: 'md:grid-cols-2'}"
>
	{#each features as feature (feature.href)}
		{@const Icon = feature.icon}
		<a
			href={feature.href}
			class="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-app bg-surface p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-strong-app hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_0_24px_-10px_var(--accent)]"
		>
			<!-- Card Border Accent Light effect -->
			<span
				class="absolute inset-x-0 top-0 h-[2px] w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				aria-hidden="true"
			></span>

			<div class="space-y-6">
				<!-- Icon Container -->
				<div
					class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-zinc-950"
				>
					<Icon class="h-6 w-6" />
				</div>

				<div class="space-y-2">
					<h3
						class="font-mono text-xs font-semibold uppercase tracking-wider text-app transition-colors duration-300 group-hover:text-accent"
					>
						{feature.title}
					</h3>
					<p
						class="text-sm leading-relaxed text-secondary-app transition-colors duration-300 group-hover:text-app"
					>
						{feature.body}
					</p>
				</div>
			</div>

			<div
				class="mt-8 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent opacity-80 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
			>
				<span>Access Dashboard</span>
				<ArrowRight class="h-3.5 w-3.5" />
			</div>
		</a>
	{/each}
</section>
