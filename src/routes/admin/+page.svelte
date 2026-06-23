<script lang="ts">
	import type { PageData } from './$types';
	import { pbBrowser } from '$lib/pb.client';
	import type { LeaseInstance } from '$lib/types';
	import { passionGroupName } from '$lib/types';
	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Live list — starts from the SSR snapshot and grows as the realtime
	// subscription fires. The snapshot is captured once on mount; further
	// mutations flow in via the subscription handler.
	let items = $state<LeaseInstance[]>(untrack(() => [...data.items]));
	let connectionState = $state<'connecting' | 'live' | 'offline'>('connecting');

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

	// Thai short month names with the Christian year (e.g. "23 มิ.ย. 2026")
	// — toLocaleDateString('th-TH') would render the Buddhist year.
	const TH_MONTHS = [
		'ม.ค.',
		'ก.พ.',
		'มี.ค.',
		'เม.ย.',
		'พ.ค.',
		'มิ.ย.',
		'ก.ค.',
		'ส.ค.',
		'ก.ย.',
		'ต.ค.',
		'พ.ย.',
		'ธ.ค.'
	];
	const fmt = (iso: string) => {
		const d = new Date(iso);
		return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
	};

	const pad3 = (n: number) => String(n).padStart(3, '0');
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
	<div class="grid grid-cols-2 gap-6 font-mono-app md:grid-cols-4">
		<div class="space-y-1">
			<div class="text-[10px] font-bold uppercase tracking-wider text-muted-app">
				Total Nodes Req
			</div>
			<div class="text-xl font-bold text-app">{pad3(stats.total)} Nodes</div>
		</div>
		<div class="space-y-1">
			<div class="text-[10px] font-bold uppercase tracking-wider text-muted-app">
				Pending Sync
			</div>
			<div class="text-xl font-bold text-accent">
				{pad3(stats.pending)} Ticket{stats.pending === 1 ? '' : 's'}
			</div>
		</div>
	</div>

	<!-- Data Table -->
	{#if items.length === 0}
		<div
			class="rounded-xl border border-dashed border-app bg-surface p-12 text-center"
		>
			<p class="font-mono-app text-xs uppercase tracking-widest text-muted-app">
				Queue is empty
			</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-xl border border-app bg-surface shadow-2xl">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr
						class="border-b border-app bg-elevated font-mono-app text-xs uppercase tracking-wider text-muted-app"
					>
						<th class="p-4 font-medium">Instance Specs & Details</th>
						<th class="p-4 font-medium">Group / Requester</th>
						<th class="p-4 font-medium">Network & Firewall (Ports)</th>
						<th class="p-4 text-right font-medium">Action</th>
					</tr>
				</thead>
				<tbody>
					{#each items as item (item.id)}
						{@const isPending = item.status === 'pending'}
						<tr
							class="border-b border-app transition-colors last:border-0 {isPending
								? 'bg-accent-soft hover:bg-elevated'
								: 'text-muted-app hover:bg-elevated'}"
						>
							<!-- Specs column -->
							<td class="space-y-2 p-4">
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="font-mono-app text-sm font-semibold {isPending
											? 'text-app'
											: 'text-muted-app line-through'}"
									>
										{item.hostname}
									</span>
									<span
										class="rounded border border-app bg-elevated px-1.5 py-0.5 font-mono-app text-[10px] uppercase {isPending
											? 'text-secondary-app'
											: 'text-muted-app'}"
									>
										{item.type === 'vm' ? 'VM' : 'CT'}
									</span>
									<span
										class="rounded border border-app bg-elevated px-1.5 py-0.5 font-mono-app text-[10px] font-bold {isPending
											? 'text-accent'
											: 'text-muted-app'}"
									>
										x{item.quantity}
									</span>
								</div>
								<div class="font-mono-app text-xs text-muted-app">
									{item.os_template} | {item.specs.cpu} Cores | {item.specs.ram} GB RAM
									| {item.specs.disk} GB Disk
								</div>
								{#if isPending}
									<div
										class="max-w-md rounded border border-app bg-elevated p-2"
									>
										<div
											class="font-mono-app text-[10px] font-bold uppercase text-muted-app"
										>
											Purpose / Notes:
										</div>
										<div
											class="mt-0.5 font-mono-app text-xs leading-relaxed text-secondary-app"
										>
											{item.purpose_notes}
										</div>
									</div>
								{:else}
									<div class="font-mono-app text-[11px] text-muted-app">
										Purpose: {item.purpose_notes}
									</div>
								{/if}
							</td>

							<!-- Group / Requester column -->
							<td class="space-y-3 p-4">
								<div>
									<div class="text-sm {isPending ? 'text-app' : 'text-muted-app'}">
										{passionGroupName(item)}
									</div>
									<div class="font-mono-app text-xs text-muted-app">
										{item.creator_email}
									</div>
								</div>
								<div class="space-y-0.5 font-mono-app text-[11px] text-muted-app">
									<div>
										Start: <span class="text-secondary-app">{fmt(item.start_date)}</span>
									</div>
									<div>
										{isPending ? 'Expire' : 'Expired'}: <span
											class={isPending ? 'text-accent' : 'text-muted-app'}
											>{fmt(item.end_date)}</span
										>
									</div>
								</div>
							</td>

							<!-- Network & Firewall column -->
							<td class="space-y-1.5 p-4 font-mono-app text-xs">
								<div>
									Zone: <span
										class="font-bold {isPending ? 'text-app' : 'text-muted-app'}"
										>{item.network_type === 'local' ? 'LOCAL IP' : 'PUBLIC'}</span
									>
								</div>
								{#if item.dns_name}
									<div class="max-w-[180px] truncate text-muted-app">
										DNS: <span
											class="{isPending
												? 'text-secondary-app underline'
												: 'text-muted-app'}">{item.dns_name}</span
										>
									</div>
								{/if}
								<div class={isPending ? 'text-secondary-app' : 'text-muted-app'}>
									Custom Ports:
									{#if portsFor(item.ports).length > 0}
										<span
											class="ml-1 rounded border border-app bg-accent-soft px-1.5 py-0.5 font-bold text-accent"
										>
											{portsFor(item.ports).join(', ')}
										</span>
									{:else}
										<span class="text-muted-app">Default Only</span>
									{/if}
								</div>
							</td>

							<!-- Action column -->
							<td class="p-4 text-right">
								{#if isPending}
									<form method="POST" action="?/resolve" class="inline">
										<input type="hidden" name="id" value={item.id} />
										<button
											type="submit"
											class="rounded-lg bg-accent px-3 py-1.5 font-mono-app text-xs font-bold uppercase tracking-wider text-zinc-950 shadow-md transition hover:opacity-90"
										>
											Resolve
										</button>
									</form>
								{:else}
									<span
										class="inline-flex items-center rounded-md border border-app bg-elevated px-2.5 py-1 font-mono-app text-xs text-muted-app"
									>
										Synced_Ok
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
