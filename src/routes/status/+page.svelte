<script lang="ts">
	import type { PageData } from './$types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { passionGroupName } from '$lib/types';
	import { pbBrowser } from '$lib/pb.client';
	import type { LeaseInstance } from '$lib/types';
	import { untrack } from 'svelte';
	import {
		Inbox,
		Cpu,
		MemoryStick,
		HardDrive,
		Calendar,
		ChevronDown,
		ChevronRight,
		MessageSquareText
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let expanded = $state<string | null>(null);

	// Live list — starts from the SSR snapshot and grows as the realtime
	// subscription fires. The viewRule on `instances` already restricts
	// realtime events to rows the user can see (their own), so we just
	// merge everything we receive — no client-side creator filter needed.
	let items = $state<LeaseInstance[]>(untrack(() => [...data.items]));

	$effect(() => {
		const pb = pbBrowser();
		let unsub: (() => void) | null = null;

		(async () => {
			try {
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
						const rec = event.record as unknown as LeaseInstance;
						if (event.action === 'create') {
							items = [rec, ...items.filter((i) => i.id !== rec.id)];
						} else if (event.action === 'update') {
							items = items.map((i) => (i.id === rec.id ? rec : i));
						} else if (event.action === 'delete') {
							const id = rec.id;
							items = items.filter((i) => i.id !== id);
							if (expanded === id) expanded = null;
						}
					},
					{ expand: 'passion_group' }
				);
			} catch (err) {
				console.error('status subscribe failed', err);
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
</script>

<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
	<div>
		<p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// init.d</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">Status</h1>
		<p class="mt-1 text-sm text-secondary-app">
			Everything you have requested, scoped to
			<span class="font-mono-app text-app">{data.email}</span>.
		</p>
	</div>
	<a
		href="/request"
		class="inline-flex h-9 items-center gap-1.5 rounded-md border border-app bg-surface px-3 font-mono text-xs uppercase tracking-widest text-secondary-app transition-colors duration-300 hover:border-strong-app hover:text-app"
	>
		+ new request
	</a>
</header>

{#if items.length === 0}
	<div
		class="rounded-lg border border-dashed border-app bg-surface p-8 text-center transition-colors duration-300 sm:p-12"
	>
		<Inbox class="mx-auto h-8 w-8 text-muted-app" />
		<p class="mt-3 font-mono text-xs uppercase tracking-widest text-muted-app">
			No requests yet
		</p>
		<p class="mt-1 text-sm text-secondary-app">
			Once you file a lease it will appear here in real time.
		</p>
		<a
			href="/request"
			class="mt-6 inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-4 font-mono text-xs uppercase tracking-widest text-app transition-colors duration-300 hover:bg-accent-soft hover:text-accent"
		>
			File a lease
		</a>
	</div>
{:else}
	<!-- Mobile cards (below md) — same data as the table but stacked.
	     Easier to read on a phone than a horizontally-scrolled table. -->
	<div class="space-y-3 md:hidden">
		{#each items as item (item.id)}
			{@const isOpen = expanded === item.id}
			<div class="rounded-lg border border-app bg-surface transition-colors duration-300">
				<button
					type="button"
					onclick={() => (expanded = isOpen ? null : item.id)}
					aria-expanded={isOpen}
					class="flex w-full items-start gap-3 p-4 text-left"
				>
					<div class="mt-0.5 text-muted-app">
						{#if isOpen}
							<ChevronDown class="h-4 w-4" />
						{:else}
							<ChevronRight class="h-4 w-4" />
						{/if}
					</div>
					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex items-start justify-between gap-2">
							<span class="truncate font-mono-app text-sm text-app">{item.hostname}</span>
							<StatusBadge status={item.status} />
						</div>
						<div class="font-mono-app text-xs text-muted-app">{item.os_template}</div>
						<div class="flex flex-wrap gap-x-3 gap-y-1 font-mono-app text-xs">
							<span class="inline-flex items-center gap-1 text-app">
								<Cpu class="h-3 w-3 text-muted-app" />
								<span class="text-accent">{item.specs.cpu}</span>C
							</span>
							<span class="inline-flex items-center gap-1 text-app">
								<MemoryStick class="h-3 w-3 text-muted-app" />
								<span class="text-accent">{item.specs.ram}</span>G
							</span>
							<span class="inline-flex items-center gap-1 text-app">
								<HardDrive class="h-3 w-3 text-muted-app" />
								<span class="text-accent">{item.specs.disk}</span>G
							</span>
							<span class="text-muted-app">×{item.quantity}</span>
						</div>
					</div>
				</button>
				{#if isOpen}
					<div class="space-y-4 border-t border-app p-4 text-xs">
						{#if item.admin_reply}
							<div
								class="rounded-md border border-app bg-elevated p-3"
							>
								<div
									class="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent"
								>
									<MessageSquareText class="h-3 w-3" />
									ตอบกลับจากแอดมิน
								</div>
								<p
									class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-app"
								>
									{item.admin_reply}
								</p>
								{#if item.admin_reply_at}
									<p
										class="mt-1.5 font-mono-app text-[10px] text-muted-app"
									>
										{fmt(item.admin_reply_at)}
									</p>
								{/if}
							</div>
						{/if}
						<div>
							<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
								Type
							</p>
							<p class="mt-0.5 font-mono-app text-app">
								{item.type} · {item.network_type}
							</p>
						</div>
						<div>
							<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
								Lease
							</p>
							<p class="mt-0.5 flex items-center gap-1 font-mono-app text-app">
								<Calendar class="h-3 w-3 text-muted-app" />
								{fmt(item.start_date)} → {fmt(item.end_date)}
							</p>
						</div>
						{#if item.dns_name}
							<div>
								<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
									Network
								</p>
								<p class="mt-0.5 break-all font-mono-app text-secondary-app">
									{item.dns_name}
								</p>
							</div>
						{/if}
						<div>
							<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
								Open ports
							</p>
							<p class="mt-1 flex flex-wrap gap-1.5 font-mono-app">
								{#each portsFor(item.ports) as port (port)}
									<span class="rounded border border-app bg-surface px-2 py-0.5 text-accent">
										{port}
									</span>
								{:else}
									<span class="text-secondary-app">—</span>
								{/each}
							</p>
						</div>
						<div>
							<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
								Group
							</p>
							<p class="mt-0.5 font-mono-app text-app">{passionGroupName(item)}</p>
						</div>
						<div>
							<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
								Purpose notes
							</p>
							<p class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-secondary-app">
								{item.purpose_notes}
							</p>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Table for md and up. The wrapper carries overflow-x-auto so
	     extra-wide cells (long hostnames, long DNS) scroll inside the
	     card rather than blowing out the page layout. -->
	<div
		class="hidden overflow-x-auto rounded-lg border border-app bg-surface transition-colors duration-300 md:block"
	>
		<table class="w-full min-w-[860px] text-left">
			<thead>
				<tr class="border-b border-app text-muted-app">
					<th class="w-8"></th>
					<th class="px-4 py-3 font-mono text-[11px] uppercase tracking-widest">hostname</th>
					<th class="px-4 py-3 font-mono text-[11px] uppercase tracking-widest">type</th>
					<th class="px-4 py-3 font-mono text-[11px] uppercase tracking-widest">specs</th>
					<th class="px-4 py-3 font-mono text-[11px] uppercase tracking-widest">lease</th>
					<th class="px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-right"
						>status</th
					>
				</tr>
			</thead>
			<tbody>
				{#each items as item (item.id)}
					{@const isOpen = expanded === item.id}
					<tr
						class="border-b border-app align-top transition-colors duration-200 hover:bg-elevated"
					>
						<td class="pl-4 pt-4">
							<button
								type="button"
								onclick={() => (expanded = isOpen ? null : item.id)}
								aria-label="Toggle details"
								class="text-muted-app hover:text-app"
							>
								{#if isOpen}
									<ChevronDown class="h-4 w-4" />
								{:else}
									<ChevronRight class="h-4 w-4" />
								{/if}
							</button>
						</td>
						<td class="px-4 py-4">
							<div class="font-mono-app text-sm text-app">{item.hostname}</div>
							<div class="mt-0.5 font-mono-app text-xs text-muted-app">
								{item.os_template}
							</div>
						</td>
						<td class="px-4 py-4 font-mono-app text-sm text-app">
							{item.type}
							<div class="mt-0.5 text-xs text-muted-app">{item.network_type}</div>
						</td>
						<td class="px-4 py-4 font-mono-app text-sm">
							<div class="flex items-center gap-3 text-app">
								<span class="inline-flex items-center gap-1">
									<Cpu class="h-3 w-3 text-muted-app" />
									<span class="text-accent">{item.specs.cpu}</span>
								</span>
								<span class="inline-flex items-center gap-1">
									<MemoryStick class="h-3 w-3 text-muted-app" />
									<span class="text-accent">{item.specs.ram}G</span>
								</span>
								<span class="inline-flex items-center gap-1">
									<HardDrive class="h-3 w-3 text-muted-app" />
									<span class="text-accent">{item.specs.disk}G</span>
								</span>
							</div>
							<div class="mt-0.5 text-xs text-muted-app">
								ports: {portsFor(item.ports).join(', ') || '—'}
							</div>
						</td>
						<td class="px-4 py-4 font-mono-app text-sm">
							<div class="flex items-center gap-1 text-app">
								<Calendar class="h-3 w-3 text-muted-app" />
								{fmt(item.start_date)} → {fmt(item.end_date)}
							</div>
							<div class="mt-0.5 text-xs text-muted-app">×{item.quantity}</div>
						</td>
						<td class="px-4 py-4 text-right">
							<StatusBadge status={item.status} />
						</td>
					</tr>
					{#if isOpen}
						<tr class="border-b border-app bg-elevated transition-colors duration-200">
							<td></td>
							<td colspan="5" class="px-4 py-5">
								{#if item.admin_reply}
									<div
										class="mb-5 flex gap-3 rounded-md border border-app bg-surface p-4"
									>
										<MessageSquareText class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
										<div class="min-w-0 flex-1">
											<div
												class="font-mono text-[10px] font-bold uppercase tracking-widest text-accent"
											>
												ตอบกลับจากแอดมิน
											</div>
											<p
												class="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-app"
											>
												{item.admin_reply}
											</p>
											{#if item.admin_reply_at}
												<p
													class="mt-2 font-mono-app text-[10px] text-muted-app"
												>
													{fmt(item.admin_reply_at)}
												</p>
											{/if}
										</div>
									</div>
								{/if}
								<div class="grid gap-6 sm:grid-cols-3">
									<div>
										<p
											class="font-mono text-[11px] uppercase tracking-widest text-muted-app"
										>
											Network
										</p>
										<p class="mt-1 font-mono-app text-sm text-app">
											{item.network_type}
										</p>
										<p class="mt-1 break-all font-mono-app text-sm text-secondary-app">
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
											Group
										</p>
										<p class="mt-1 font-mono-app text-sm text-app">
											{passionGroupName(item)}
										</p>
									</div>
								</div>
								<div class="mt-5">
									<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
										Purpose notes
									</p>
									<p
										class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-secondary-app"
									>
										{item.purpose_notes}
									</p>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
{/if}
