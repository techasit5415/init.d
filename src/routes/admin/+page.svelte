<script lang="ts">
	import type { PageData } from './$types';
	import { pbBrowser } from '$lib/pb.client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { LeaseInstance } from '$lib/types';
	import { passionGroupName } from '$lib/types';
	import { untrack } from 'svelte';
	import {
		Cpu,
		MemoryStick,
		HardDrive,
		Radio,
		CheckCircle2,
		Terminal,
		Copy,
		ShieldCheck
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Live list — starts from the SSR snapshot and grows as the realtime
	// subscription fires. The snapshot is captured once on mount; further
	// mutations flow in via the subscription handler.
	let items = $state<LeaseInstance[]>(untrack(() => [...data.items]));
	let connectionState = $state<'connecting' | 'live' | 'offline'>('connecting');
	let expanded = $state<string | null>(null);
	let copied = $state<string | null>(null);

	// Stats derived from the live list.
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
				// access to every row. The realtime stream emits
				// create/update/delete events which we fold into our list.
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

	const portsFor = (s: string | undefined) =>
		(s ?? '')
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);

	const fmt = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

	async function copyToClipboard(value: string, key: string) {
		try {
			await navigator.clipboard.writeText(value);
			copied = key;
			setTimeout(() => (copied = copied === key ? null : copied), 1500);
		} catch {
			/* clipboard blocked */
		}
	}
</script>

<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
	<div>
		<p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// admin</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">Lease queue</h1>
		<p class="mt-1 text-sm text-secondary-app">
			Realtime stream of every lease request. Provision it in Proxmox / OPNsense, then mark it
			resolved.
		</p>
	</div>

	<div
		class="inline-flex items-center gap-2 rounded-md border border-app bg-surface px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-secondary-app"
	>
		<Radio
			class="h-3.5 w-3.5 {connectionState === 'live'
				? 'text-accent'
				: connectionState === 'connecting'
					? 'text-muted-app'
					: 'text-(--danger)'}"
		/>
		<span>{connectionState}</span>
	</div>
</header>

<div class="mb-6 grid gap-px overflow-hidden rounded-lg border border-app bg-app sm:grid-cols-3">
	{#each [{ label: 'total', value: stats.total }, { label: 'pending', value: stats.pending, accent: true }, { label: 'completed', value: stats.completed }] as stat (stat.label)}
		<div class="bg-surface p-5 transition-colors duration-300">
			<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">{stat.label}</p>
			<p class="mt-1 font-mono-app text-3xl {stat.accent ? 'text-accent' : 'text-app'}">
				{stat.value}
			</p>
		</div>
	{/each}
</div>

{#if items.length === 0}
	<div
		class="rounded-lg border border-dashed border-app bg-surface p-12 text-center transition-colors duration-300"
	>
		<ShieldCheck class="mx-auto h-8 w-8 text-muted-app" />
		<p class="mt-3 font-mono text-xs uppercase tracking-widest text-muted-app">Queue is empty</p>
		<p class="mt-1 text-sm text-secondary-app">New requests will slide in here the moment they are filed.</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each items as item (item.id)}
			{@const isOpen = expanded === item.id}
			<article
				class="rounded-lg border border-app bg-surface transition-colors duration-300"
			>
				<header class="flex flex-wrap items-center gap-4 px-5 py-4">
					<button
						type="button"
						onclick={() => (expanded = isOpen ? null : item.id)}
						class="flex flex-1 items-center gap-4 text-left"
					>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline gap-2">
								<h2 class="truncate font-mono-app text-sm text-app">{item.hostname}</h2>
								<span class="font-mono text-[10px] uppercase tracking-widest text-muted-app">
									{item.type}
								</span>
							</div>
							<p class="mt-0.5 truncate font-mono text-xs text-muted-app">
								{item.creator_email} · {passionGroupName(item)} · {item.os_template}
							</p>
						</div>

						<dl
							class="hidden items-center gap-4 font-mono-app text-xs text-secondary-app md:flex"
						>
							<div class="flex items-center gap-1">
								<Cpu class="h-3 w-3 text-muted-app" />
								<span class="text-accent">{item.specs.cpu}</span>
							</div>
							<div class="flex items-center gap-1">
								<MemoryStick class="h-3 w-3 text-muted-app" />
								<span class="text-accent">{item.specs.ram}G</span>
							</div>
							<div class="flex items-center gap-1">
								<HardDrive class="h-3 w-3 text-muted-app" />
								<span class="text-accent">{item.specs.disk}G</span>
							</div>
							<div>
								{fmt(item.start_date)} → {fmt(item.end_date)}
							</div>
						</dl>

						<StatusBadge status={item.status} />
					</button>

					<form method="POST" action="?/resolve" class="shrink-0">
						<input type="hidden" name="id" value={item.id} />
						<button
							type="submit"
							disabled={item.status === 'completed'}
							class="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-mono text-[11px] uppercase tracking-widest transition-colors duration-300 {item.status ===
							'completed'
								? 'border-app bg-elevated text-muted-app'
								: 'border-app bg-accent text-app hover:bg-accent-soft hover:text-accent'}"
						>
							<CheckCircle2 class="h-3.5 w-3.5" />
							{item.status === 'completed' ? 'Resolved' : 'Resolve'}
						</button>
					</form>
				</header>

				{#if isOpen}
					<div
						class="space-y-6 border-t border-app bg-elevated px-5 py-5 transition-colors duration-300"
					>
						<!-- Copy-able spec block — operators paste this into Proxmox -->
						<div>
							<div class="mb-2 flex items-center gap-2">
								<Terminal class="h-3.5 w-3.5 text-accent" />
								<p
									class="font-mono text-[11px] uppercase tracking-widest text-muted-app"
								>
									Proxmox spec
								</p>
								<button
									type="button"
									onclick={() =>
										copyToClipboard(
											`hostname=${item.hostname}\nos=${item.os_template}\ncpu=${item.specs.cpu}\nram=${item.specs.ram}G\ndisk=${item.specs.disk}G\nnetwork=${item.network_type}\nquantity=${item.quantity}`,
											item.id
										)}
									class="ml-auto inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-app hover:text-app"
								>
									<Copy class="h-3 w-3" />
									{copied === item.id ? 'copied' : 'copy'}
								</button>
							</div>
							<pre
								class="overflow-x-auto rounded border border-app bg-surface p-3 font-mono-app text-xs text-app">hostname={item.hostname}
os={item.os_template}
cpu={item.specs.cpu}
ram={item.specs.ram}G
disk={item.specs.disk}G
network={item.network_type}
quantity={item.quantity}</pre>
						</div>

						<div class="grid gap-6 sm:grid-cols-3">
							<div>
								<p
									class="font-mono text-[11px] uppercase tracking-widest text-muted-app"
								>
									DNS
								</p>
								<p class="mt-1 font-mono-app text-sm text-app">
									{item.dns_name || '—'}
								</p>
							</div>
							<div>
								<p
									class="font-mono text-[11px] uppercase tracking-widest text-muted-app"
								>
									Open ports
								</p>
								<p class="mt-1 flex flex-wrap gap-1.5 font-mono-app text-sm">
									{#each portsFor(item.ports) as port (port)}
										<span
											class="rounded border border-app bg-surface px-2 py-0.5 text-accent"
										>
											{port}
										</span>
									{:else}
										<span class="text-secondary-app">—</span>
									{/each}
								</p>
							</div>
							<div>
								<p
									class="font-mono text-[11px] uppercase tracking-widest text-muted-app"
								>
									Lease window
								</p>
								<p class="mt-1 font-mono-app text-sm text-app">
									{fmt(item.start_date)} → {fmt(item.end_date)}
								</p>
								<p class="mt-0.5 text-xs text-muted-app">×{item.quantity}</p>
							</div>
						</div>

						<div>
							<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
								Purpose notes
							</p>
							<p
								class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-secondary-app"
							>
								{item.purpose_notes}
							</p>
						</div>
					</div>
				{/if}
			</article>
		{/each}
	</div>
{/if}
