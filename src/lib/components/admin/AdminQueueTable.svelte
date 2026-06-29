<script lang="ts">
	import type { LeaseInstance } from '$lib/types';
	import { passionGroupName } from '$lib/types';

	let {
		items = [],
		form
	}: {
		items: LeaseInstance[];
		form: { error?: string; id?: string } | null;
	} = $props();

	// Per-row reply editor state
	let replyOpen = $state<string | null>(null);
	let replyDraft = $state<string>('');

	function openReply(item: LeaseInstance) {
		replyDraft = item.admin_reply ?? '';
		replyOpen = item.id;
	}
	function cancelReply() {
		replyOpen = null;
		replyDraft = '';
	}

	const portsFor = (s: string | undefined) =>
		(s ?? '')
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);

	// Thai short month names with the Christian year (e.g. "23 มิ.ย. 2026")
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
</script>

{#if items.length === 0}
	<div class="rounded-xl border border-dashed border-app bg-surface p-12 text-center">
		<p class="font-mono-app text-xs uppercase tracking-widest text-muted-app">
			Queue is empty
		</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-xl border border-app bg-surface shadow-2xl">
		<table class="w-full min-w-[760px] border-collapse text-left text-sm">
			<thead>
				<tr class="border-b border-app bg-elevated font-mono-app text-xs uppercase tracking-wider text-muted-app">
					<th class="p-4 font-medium">Instance Specs & Details</th>
					<th class="p-4 font-medium">Group / Requester</th>
					<th class="p-4 font-medium">Network & Firewall (Ports)</th>
					<th class="p-4 text-right font-medium">Action</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item (item.id)}
					{@const isPending = item.status === 'pending'}
					{@const isEditing = replyOpen === item.id}
					<tr class="border-b border-app transition-colors last:border-0 {isPending ? 'bg-accent-soft hover:bg-elevated' : 'text-muted-app hover:bg-elevated'}">
						<!-- Specs column -->
						<td class="space-y-2 p-4">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-mono-app text-sm font-semibold {isPending ? 'text-app' : 'text-muted-app line-through'}">
									{item.hostname}
								</span>
								<span class="rounded border border-app bg-elevated px-1.5 py-0.5 font-mono-app text-[10px] uppercase {isPending ? 'text-secondary-app' : 'text-muted-app'}">
									{item.type === 'vm' ? 'VM' : 'CT'}
								</span>
								<span class="rounded border border-app bg-elevated px-1.5 py-0.5 font-mono-app text-[10px] font-bold {isPending ? 'text-accent' : 'text-muted-app'}">
									x{item.quantity}
								</span>
							</div>
							<div class="font-mono-app text-xs text-muted-app">
								{item.os_template} | {item.specs.cpu} Cores | {item.specs.ram} GB RAM | {item.specs.disk} GB Disk
							</div>
							{#if isPending}
								<div class="max-w-md rounded border border-app bg-elevated p-2">
									<div class="font-mono-app text-[10px] font-bold uppercase text-muted-app">
										Purpose / Notes:
									</div>
									<div class="mt-0.5 font-mono-app text-xs leading-relaxed text-secondary-app">
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
									{isPending ? 'Expire' : 'Expired'}: <span class={isPending ? 'text-accent' : 'text-muted-app'}>{fmt(item.end_date)}</span>
								</div>
							</div>
						</td>

						<!-- Network & Firewall column -->
						<td class="space-y-1.5 p-4 font-mono-app text-xs">
							<div>
								Zone: <span class="font-bold {isPending ? 'text-app' : 'text-muted-app'}">{item.network_type === 'local' ? 'LOCAL IP' : 'PUBLIC'}</span>
							</div>
							{#if item.dns_name}
								<div class="max-w-[180px] truncate text-muted-app">
									DNS: <span class="{isPending ? 'text-secondary-app underline' : 'text-muted-app'}">{item.dns_name}</span>
								</div>
							{/if}
							<div class={isPending ? 'text-secondary-app' : 'text-muted-app'}>
								Custom Ports:
								{#if portsFor(item.ports).length > 0}
									<span class="ml-1 rounded border border-app bg-accent-soft px-1.5 py-0.5 font-bold text-accent">
										{portsFor(item.ports).join(', ')}
									</span>
								{:else}
									<span class="text-muted-app">Default Only</span>
								{/if}
							</div>
						</td>

						<!-- Action column -->
						<td class="space-y-3 p-4 text-right">
							<div class="text-left">
								{#if !isEditing && item.admin_reply}
									<div class="rounded border border-app bg-elevated p-2">
										<div class="font-mono-app text-[10px] font-bold uppercase text-muted-app">
											Reply_Sent
										</div>
										<div class="mt-0.5 whitespace-pre-wrap font-mono-app text-xs leading-relaxed text-secondary-app">
											{item.admin_reply}
										</div>
										{#if item.admin_reply_at}
											<div class="mt-1 font-mono-app text-[10px] text-muted-app">
												{fmt(item.admin_reply_at)}
											</div>
										{/if}
									</div>
									<div class="mt-1 flex justify-end gap-1.5">
										<button
											type="button"
											onclick={() => openReply(item)}
											class="rounded border border-app bg-surface px-2 py-0.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-secondary-app transition hover:bg-elevated hover:text-app"
										>
											Edit
										</button>
										<form method="POST" action="?/reply" class="inline">
											<input type="hidden" name="id" value={item.id} />
											<input type="hidden" name="clear" value="1" />
											<button
												type="submit"
												class="rounded border border-app bg-surface px-2 py-0.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-secondary-app transition hover:bg-elevated hover:text-app"
											>
												Clear
											</button>
										</form>
									</div>
								{:else if isEditing}
									<form method="POST" action="?/reply" class="space-y-1.5">
										<input type="hidden" name="id" value={item.id} />
										<textarea
											name="reply"
											bind:value={replyDraft}
											rows="3"
											maxlength="4096"
											placeholder="พิมพ์ข้อความถึงผู้ขอ เช่น กำลังเตรียม VM อยู่ คาดว่าพร้อมใช้ภายใน 1 ชม."
											class="w-full rounded border border-app bg-surface p-2 font-mono-app text-xs text-app placeholder:text-muted-app focus:border-accent focus:outline-none"
										></textarea>
										<div class="flex justify-end gap-1.5">
											<button
												type="button"
												onclick={cancelReply}
												class="rounded border border-app bg-surface px-2 py-0.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-secondary-app transition hover:bg-elevated hover:text-app"
											>
												Cancel
											</button>
											<button
												type="submit"
												disabled={replyDraft.trim().length === 0}
												class="rounded bg-accent px-2 py-0.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
											>
												{item.admin_reply ? 'Update' : 'Send'}
											</button>
										</div>
									</form>
								{:else}
									<button
										type="button"
										onclick={() => openReply(item)}
										class="rounded border border-app bg-surface px-2.5 py-1 font-mono-app text-[10px] font-bold uppercase tracking-wider text-secondary-app transition hover:bg-elevated hover:text-app"
									>
										Reply
									</button>
								{/if}
							</div>

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
								<span class="inline-flex items-center rounded-md border border-app bg-elevated px-2.5 py-1 font-mono-app text-xs text-muted-app">
									Synced_Ok
								</span>
							{/if}

							{#if form?.error && form?.id === item.id}
								<p class="text-right font-mono-app text-[10px]" style="color: var(--danger)">
									{form.error}
								</p>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
