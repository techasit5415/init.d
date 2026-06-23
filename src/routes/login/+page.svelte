<script lang="ts">
	import { LogIn, AlertCircle } from '@lucide/svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto max-w-md">
	<header class="mb-8">
		<p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// sign in</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">Access LEASE</h1>
		<p class="mt-2 text-sm text-secondary-app">
			Authenticate against the operator directory. Only members of the cluster team can request
			or provision leases.
		</p>
	</header>

	<form method="POST" class="space-y-4 rounded-lg border border-app bg-surface p-6">
		<label class="block">
			<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
				>Email</span
			>
			<input
				type="email"
				name="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
				class="w-full font-mono-app"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
				>Password</span
			>
			<input
				type="password"
				name="password"
				autocomplete="current-password"
				required
				class="w-full font-mono-app"
			/>
		</label>

		{#if form?.error}
			<p
				class="flex items-start gap-2 rounded-md border border-app bg-elevated p-3 text-sm"
				style="color: var(--danger)"
			>
				<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
				<span>{form.error}</span>
			</p>
		{/if}

		<button
			type="submit"
			class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 font-mono text-xs uppercase tracking-widest text-app transition-colors duration-300 hover:bg-accent-soft hover:text-accent"
		>
			<LogIn class="h-4 w-4" />
			Sign in
		</button>
	</form>
</div>
