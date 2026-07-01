<script lang="ts">
	import type { PageData } from './$types';
	import { pbBrowser } from '$lib/pb/client';
	import type { LeaseInstance } from '$lib/types';
	import { untrack } from 'svelte';
	import AdminStats from '$lib/components/admin/AdminStats.svelte';

	let { data, form }: { data: PageData; form: { error?: string; id?: string; recordId?: string } | null } = $props();

	// Live list — starts from the SSR snapshot and grows as the realtime
	// subscription fires.
	let items = $state<LeaseInstance[]>(untrack(() => [...data.items]));
	let connectionState = $state<'connecting' | 'live' | 'offline'>('connecting');
	let provisioningFor = $state<string | null>(null);
	let provisioningNode = $state('pve3');
	let provisioningNetwork = $state('vmbr0');
	let provisioningId = $state('');

	function openProvision(item: LeaseInstance) {
		provisioningFor = item.id;
		provisioningNode = 'pve3';
		provisioningNetwork = item.network_type === 'public' ? 'vmbr0' : 'vmbr1';
		provisioningId = '';
	}

	function cancelProvision() {
		provisioningFor = null;
		provisioningNode = 'pve3';
		provisioningNetwork = 'vmbr1';
		provisioningId = '';
	}

	const stats = $derived({
		total: items.length,
		pending: items.filter((i) => i.status === 'pending').length,
		completed: items.filter((i) => i.status === 'completed').length
	});

	$effect(() => {
		const pb = pbBrowser();
		let unsub: (() => void) | null = null;

		(async () => {
			try {
				// Subscribe to the whole collection — admins have listRule
				// access to every row.
				const col = (pb as unknown as {
					collection(name: string): {
						subscribe(
							topic: string,
							cb: (e: { action: string; record: { id: string } & Record<string, unknown> }) => void,
							opts?: { expand?: string }
						): Promise<() => void>;
					};
				}).collection('instances');
				unsub = await col.subscribe(
					'*',
					(event) => {
						if (event.action === 'create') {
							const rec = event.record as unknown as LeaseInstance;
							items = [rec, ...items.filter((i) => i.id !== rec.id)];
						} else if (event.action === 'update') {
							const rec = event.record as unknown as LeaseInstance;
							items = items.map((i) => (i.id === rec.id ? rec : i));
						} else if (event.action === 'delete') {
							const id = event.record.id;
							items = items.filter((i) => i.id !== id);
						}
					},
					{ expand: 'passion_group' }
				);
				connectionState = 'live';
			} catch (err) {
				console.error('admin subscribe failed', err);
				connectionState = 'offline';
			}
		})();

		return () => {
			try {
				unsub?.();
			} catch {
				/* noop */
			}
		};
	});
</script>

<div class="space-y-12">
	<!-- Header — INFRASTRUCTURE_QUEUE -->
	<div
		class="flex flex-col items-start justify-between gap-4 border-b border-app pb-6 sm:flex-row sm:items-center"
	>
		<div class="space-y-1">
			<h1 class="font-mono-app text-xl font-medium tracking-tight text-app">
				// INFRASTRUCTURE_QUEUE
			</h1>
			<p class="text-sm text-secondary-app">
				รายการคิวสเปค ระยะเวลา และพอร์ตที่ขอใช้งานเซิร์ฟเวอร์จาก PocketBase
			</p>
		</div>

		<div
			class="flex items-center gap-2 rounded-full border border-app bg-elevated px-3 py-1 font-mono-app text-xs text-secondary-app"
		>
			<span
				class="h-1.5 w-1.5 animate-pulse rounded-full {connectionState === 'live'
					? 'bg-accent'
					: connectionState === 'connecting'
						? 'bg-muted-app'
						: ''}"
				style={connectionState === 'offline' ? 'background-color: var(--danger)' : ''}
			></span>
			<span
				>PB_STREAM: {connectionState === 'live'
					? 'ACTIVE'
					: connectionState === 'connecting'
						? 'SYNCING'
						: 'OFFLINE'}</span
			>
		</div>
	</div>

	<!-- Mini Dashboard Analytics -->
	<AdminStats {stats} />

	<div class="grid gap-4">
		{#each items as item (item.id)}
			{@const isPending = item.status === 'pending'}
			<article class="rounded-xl border p-4 shadow-2xl {isPending ? 'border-accent/40 bg-accent-soft' : 'border-app bg-surface'}">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div class="space-y-2">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="font-mono-app text-sm font-semibold {isPending ? 'text-app' : 'text-muted-app'}">{item.hostname}</h2>
							<span class="rounded border border-app bg-elevated px-1.5 py-0.5 font-mono-app text-[10px] uppercase {isPending ? 'text-secondary-app' : 'text-muted-app'}">
								{item.type === 'vm' ? 'VM' : 'CT'}
							</span>
							<span class="rounded border border-app bg-elevated px-1.5 py-0.5 font-mono-app text-[10px] font-bold {isPending ? 'text-accent' : 'text-muted-app'}">
								{item.status}
							</span>
						</div>
						<div class="font-mono-app text-xs {isPending ? 'text-secondary-app' : 'text-muted-app'}">
							{item.os_template} | {item.specs.cpu} Cores | {item.specs.ram} GB RAM | {item.specs.disk} GB Disk
						</div>
						<div class="font-mono-app text-xs {isPending ? 'text-secondary-app' : 'text-muted-app'}">Network: {item.network_type} | Quantity: x{item.quantity}</div>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						{#if provisioningFor === item.id}
							<button
								type="button"
								onclick={cancelProvision}
								class="rounded border border-app bg-surface px-3 py-1.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-secondary-app transition hover:bg-elevated hover:text-app"
							>
								Cancel
							</button>
						{:else}
							<button
								type="button"
								onclick={() => openProvision(item)}
								class="rounded-lg px-3 py-1.5 font-mono-app text-xs font-bold uppercase tracking-wider shadow-md transition {isPending ? 'bg-accent text-zinc-950 hover:opacity-90' : 'border border-app bg-surface text-secondary-app hover:bg-elevated hover:text-app'}"
							>
								Resolve
							</button>
						{/if}
					</div>
				</div>

				{#if provisioningFor === item.id}
					<form method="POST" action="?/create" class="mt-4 space-y-3 rounded-lg border border-app bg-elevated p-3">
						<input type="hidden" name="recordId" value={item.id} />
						<div class="grid gap-3 md:grid-cols-3">
							<label class="space-y-1">
								<span class="font-mono-app text-[10px] uppercase tracking-wider text-muted-app">node</span>
								<input
									name="node"
									bind:value={provisioningNode}
									required
									class="w-full rounded border border-app bg-surface px-2 py-1 font-mono-app text-xs text-app focus:border-accent focus:outline-none"
									placeholder="pve3"
								/>
							</label>
							<label class="space-y-1">
								<span class="font-mono-app text-[10px] uppercase tracking-wider text-muted-app">network</span>
								<input
									name="network"
									bind:value={provisioningNetwork}
									required
									class="w-full rounded border border-app bg-surface px-2 py-1 font-mono-app text-xs text-app focus:border-accent focus:outline-none"
									placeholder="vmbr0"
								/>
							</label>
							<label class="space-y-1">
								<span class="font-mono-app text-[10px] uppercase tracking-wider text-muted-app">id</span>
								<input
									name="id"
									type="number"
									min="1"
									bind:value={provisioningId}
									required
									class="w-full rounded border border-app bg-surface px-2 py-1 font-mono-app text-xs text-app focus:border-accent focus:outline-none"
									placeholder="101"
								/>
							</label>
						</div>
						<div class="flex justify-end gap-2">
							<button
								type="button"
								onclick={cancelProvision}
								class="rounded border border-app bg-surface px-3 py-1.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-secondary-app transition hover:bg-elevated hover:text-app"
							>
								Back
							</button>
							<button
								type="submit"
								class="rounded bg-accent px-3 py-1.5 font-mono-app text-xs font-bold uppercase tracking-wider text-zinc-950 shadow-md transition hover:opacity-90"
							>
								Create
							</button>
						</div>
					</form>
				{/if}

				{#if form?.error && form?.recordId === item.id}
					<p class="mt-3 font-mono-app text-[10px]" style="color: var(--danger)">{form.error}</p>
				{/if}
			</article>
		{/each}
	</div>
</div>

