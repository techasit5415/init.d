<script lang="ts">
	import { page } from '$app/state';
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import { Server, FilePlus2, Activity, ShieldCheck, LogOut, LogIn } from '@lucide/svelte';

	let user = $derived(page.data.user);
	const isAdmin = $derived(user?.role === 'admin');

	const links = $derived([
		...(user ? [{ href: '/request', label: 'Request', icon: FilePlus2 }] : []),
		...(user ? [{ href: '/status', label: 'Status', icon: Activity }] : []),
		...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : [])
	]);
</script>

<header
	class="sticky top-0 z-30 border-b border-app bg-app/80 backdrop-blur transition-colors duration-300"
>
	<div class="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-6 px-6">
		<a href="/" class="flex items-center gap-2 font-mono text-sm tracking-tight text-app">
			<Server class="h-4 w-4 text-accent" />
			<span class="font-semibold">LEASE</span>
			<span class="text-muted-app">/ infrastructure provisioning</span>
		</a>

		<nav class="flex items-center gap-1">
			{#each links as link (link.href)}
				{@const active = page.url.pathname.startsWith(link.href)}
				<a
					href={link.href}
					class="inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-mono text-xs uppercase tracking-widest transition-colors duration-200 {active
						? 'bg-elevated text-app'
						: 'text-secondary-app hover:bg-elevated hover:text-app'}"
				>
					<link.icon class="h-3.5 w-3.5 {active ? 'text-accent' : ''}" />
					{link.label}
				</a>
			{/each}

			<div class="ml-2 flex items-center gap-2">
				<ThemeSwitcher />
				{#if user}
					<form action="/logout" method="POST">
						<button
							type="submit"
							class="inline-flex h-9 items-center gap-1.5 rounded-md border border-app bg-surface px-3 font-mono text-xs uppercase tracking-widest text-secondary-app transition-colors duration-200 hover:border-strong-app hover:text-app"
							title={user.email}
						>
							<LogOut class="h-3.5 w-3.5" />
							<span>Sign out</span>
						</button>
					</form>
				{:else}
					<a
						href="/login"
						class="inline-flex h-9 items-center gap-1.5 rounded-md border border-app bg-surface px-3 font-mono text-xs uppercase tracking-widest text-secondary-app transition-colors duration-200 hover:border-strong-app hover:text-app"
					>
						<LogIn class="h-3.5 w-3.5" />
						<span>Sign in</span>
					</a>
				{/if}
			</div>
		</nav>
	</div>
</header>
