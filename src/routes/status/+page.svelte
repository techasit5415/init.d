<script lang="ts">
	import type { PageData } from './$types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { passionGroupName } from '$lib/types';
	import { Inbox, Cpu, MemoryStick, HardDrive, Calendar, ChevronDown, ChevronRight } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let expanded = $state<string | null>(null);

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

{#if data.items.length === 0}
	<div
		class="rounded-lg border border-dashed border-app bg-surface p-12 text-center transition-colors duration-300"
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
	<div class="overflow-hidden rounded-lg border border-app bg-surface transition-colors duration-300">
		<table class="w-full text-left">
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
				{#each data.items as item (item.id)}
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
										<p class="mt-1 font-mono-app text-sm text-secondary-app">
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
