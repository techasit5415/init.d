<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { untrack } from 'svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Suffix shown next to the DNS prefix input. The full DNS is built
	// client-side and sent via a hidden input so the form payload still
	// matches the server's `dns_name` schema field.
	const DNS_SUFFIX = '.cskmitl.com';

	// Today / +30 days, in YYYY-MM-DD (the wire format <input type="date">
	// expects). Computed once so the form has sensible defaults instead
	// of starting empty.
	const today = new Date().toISOString().slice(0, 10);
	const inThirtyDays = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

	// Live form state. Mirrors the rendered inputs so the preview pane
	// can re-derive on every keystroke. Initial values are seeded from the
	// server-side defaults — the server stays the source of truth on
	// validation re-renders (see $effect below). We use `untrack` because
	// the form fields are intentionally a one-time copy of `data.defaults`;
	// the user's typing should not be invalidated by reactive prop churn.
	let passion_group = $state('');
	let type = $state<'vm' | 'container'>(untrack(() => data.defaults.type));
	let hostname = $state('');
	let os_template = $state(untrack(() => 'ubuntu-24.04'));
	let cpu = $state(untrack(() => data.defaults.cpu));
	let ram = $state(untrack(() => data.defaults.ram));
	let disk = $state(untrack(() => data.defaults.disk));
	let network_type = $state<'local' | 'public'>(untrack(() => data.defaults.network_type));
	let dnsPrefix = $state('');
	let ports = $state('');
	let purpose_notes = $state('');
	let start_date = $state(untrack(() => today));
	let end_date = $state(untrack(() => inThirtyDays));
	let quantity = $state(untrack(() => data.defaults.quantity));

	// Compose the full DNS for the hidden form field. If the user clears
	// the prefix, we send an empty string — the server treats empty DNS
	// as "no DNS requested".
	const dns_name = $derived(dnsPrefix.trim() ? `${dnsPrefix.trim()}${DNS_SUFFIX}` : '');

	// If the server returned previous values (validation error), restore them.
	$effect(() => {
		const v = form?.values;
		if (!v) return;
		if (v.passion_group) passion_group = v.passion_group;
		if (v.type) type = v.type;
		if (v.hostname) hostname = v.hostname;
		if (v.os_template) os_template = v.os_template;
		if (v.specs?.cpu) cpu = v.specs.cpu;
		if (v.specs?.ram) ram = v.specs.ram;
		if (v.specs?.disk) disk = v.specs.disk;
		if (v.network_type) network_type = v.network_type;
		if (v.dns_name) {
			// Strip the suffix to restore just the editable prefix.
			if (v.dns_name.endsWith(DNS_SUFFIX)) {
				dnsPrefix = v.dns_name.slice(0, -DNS_SUFFIX.length);
			} else {
				dnsPrefix = v.dns_name;
			}
		}
		if (v.ports) ports = v.ports;
		if (v.purpose_notes) purpose_notes = v.purpose_notes;
		if (v.start_date) start_date = v.start_date;
		if (v.end_date) end_date = v.end_date;
		if (v.quantity) quantity = v.quantity;
	});

	// Derived values for the right-hand preview pane.
	const portsList = $derived(
		ports
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean)
	);
	const errors = $derived<Record<string, string>>(form?.errors ?? {});

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
	const fmtDate = (d: string) => {
		if (!d) return '—';
		const dt = new Date(d);
		return `${dt.getDate()} ${TH_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
	};
	const leaseDays = $derived.by(() => {
		if (!start_date || !end_date) return null;
		const ms = new Date(end_date).getTime() - new Date(start_date).getTime();
		return Math.max(0, Math.ceil(ms / 86_400_000));
	});
	const pad3 = (n: number) => String(n).padStart(3, '0');
	const passionGroupName = $derived(
		data.passionGroups.find((g) => g.id === passion_group)?.name ?? '—'
	);
</script>

<form
	method="POST"
	class="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16"
>
	<!-- LEFT: form fields (~70%) -------------------------------------------- -->
	<div class="space-y-10 lg:col-span-2">
		<!-- Header -->
		<div class="space-y-2">
			<h1 class="font-mono-app text-xl font-medium tracking-tight text-app">
				// PROVISION_NEW_INSTANCE
			</h1>
			<p class="text-sm text-secondary-app">
				ระบุข้อมูลสเปคระบบ ช่วงเวลา และวัตถุประสงค์เพื่อบันทึกคำขอลง PocketBase
			</p>
		</div>

		<!-- Section 1: Ownership & Environment Type -->
		<div class="space-y-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						Creator
					</label>
					<input
						type="email"
						value={data.email}
						disabled
						class="w-full cursor-not-allowed rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-muted-app focus:outline-none"
					/>
				</div>
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						Passion Group
					</label>
					<select
						name="passion_group"
						bind:value={passion_group}
						required
						class="w-full appearance-none rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-app focus:border-strong-app focus:outline-none"
					>
						<option value="" disabled>— pick a group —</option>
						{#each data.passionGroups as group (group.id)}
							<option value={group.id}>{group.name}</option>
						{/each}
					</select>
					{#if errors.passion_group}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.passion_group}</p>
					{/if}
				</div>
			</div>

			<!-- Environment Type toggle (VM / Container) -->
			<div class="space-y-2">
				<label
					class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
				>
					Environment Type
				</label>
				<div class="flex max-w-xs rounded-lg border border-app bg-surface p-1">
					<button
						type="button"
						onclick={() => (type = 'vm')}
						class="flex-1 rounded-md py-1.5 font-mono-app text-xs font-medium transition {type ===
						'vm'
							? 'border border-strong-app bg-elevated text-accent shadow-sm'
							: 'text-muted-app hover:text-app'}"
					>
						Virtual Machine
					</button>
					<button
						type="button"
						onclick={() => (type = 'container')}
						class="flex-1 rounded-md py-1.5 font-mono-app text-xs font-medium transition {type ===
						'container'
							? 'border border-strong-app bg-elevated text-accent shadow-sm'
							: 'text-muted-app hover:text-app'}"
					>
						Container
					</button>
				</div>
				<!-- Buttons don't submit values, so the toggle state rides on a hidden input. -->
				<input type="hidden" name="type" value={type} />
			</div>
		</div>

		<!-- Section 2: Hardware Resources -->
		<div class="space-y-6 border-t border-app pt-4">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						Hostname
					</label>
					<input
						type="text"
						name="hostname"
						bind:value={hostname}
						class="w-full rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-app focus:border-strong-app focus:outline-none"
						placeholder="web-01"
						pattern="[a-z0-9-]+"
						required
					/>
					{#if errors.hostname}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.hostname}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						OS Template
					</label>
					<input
						type="text"
						name="os_template"
						bind:value={os_template}
						class="w-full rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-app focus:border-strong-app focus:outline-none"
						placeholder="e.g. ubuntu-24.04"
						required
					/>
					{#if errors.os_template}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.os_template}</p>
					{/if}
				</div>
			</div>

			<!-- Spec sliders — 1..16 / 1..64 / 10..500 keeps the UI focused
			     on typical workloads; the server still accepts up to its own
			     higher caps if a payload arrives from another path. -->
			<div class="space-y-5 pt-2">
				<div class="space-y-2">
					<div class="flex justify-between font-mono-app text-xs">
						<span class="text-muted-app">CPU Cores</span>
						<span class="font-bold text-accent">{cpu} Cores</span>
					</div>
					<input
						type="range"
						name="cpu"
						min="1"
						max="16"
						bind:value={cpu}
						style="accent-color: var(--accent)"
						class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-elevated"
						required
					/>
				</div>
				<div class="space-y-2">
					<div class="flex justify-between font-mono-app text-xs">
						<span class="text-muted-app">Memory (RAM)</span>
						<span class="font-bold text-accent">{ram} GB</span>
					</div>
					<input
						type="range"
						name="ram"
						min="1"
						max="64"
						bind:value={ram}
						style="accent-color: var(--accent)"
						class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-elevated"
						required
					/>
				</div>
				<div class="space-y-2">
					<div class="flex justify-between font-mono-app text-xs">
						<span class="text-muted-app">Storage (Disk)</span>
						<span class="font-bold text-accent">{disk} GB</span>
					</div>
					<input
						type="range"
						name="disk"
						min="10"
						max="500"
						bind:value={disk}
						style="accent-color: var(--accent)"
						class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-elevated"
						required
					/>
				</div>
			</div>
		</div>

		<!-- Section 3: Networking & Custom Ports -->
		<div class="space-y-6 border-t border-app pt-4">
			<div class="space-y-2">
				<label
					class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
				>
					Network Access
				</label>
				<div class="flex max-w-xs rounded-lg border border-app bg-surface p-1">
					<button
						type="button"
						onclick={() => (network_type = 'local')}
						class="flex-1 rounded-md py-1.5 font-mono-app text-xs font-medium transition {network_type ===
						'local'
							? 'border border-strong-app bg-elevated text-app shadow-sm'
							: 'text-muted-app hover:text-app'}"
					>
						🔒 Local IP
					</button>
					<button
						type="button"
						onclick={() => (network_type = 'public')}
						class="flex-1 rounded-md py-1.5 font-mono-app text-xs font-medium transition {network_type ===
						'public'
							? 'border border-strong-app bg-elevated text-app shadow-sm'
							: 'text-muted-app hover:text-app'}"
					>
						🌐 Public IP
					</button>
				</div>
				<input type="hidden" name="network_type" value={network_type} />
			</div>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						DNS Request
					</label>
					<div
						class="flex items-center rounded-lg border border-app bg-elevated pr-3 transition-colors focus-within:border-strong-app"
					>
						<input
							type="text"
							bind:value={dnsPrefix}
							class="w-full border-0 bg-transparent px-3 py-2 font-mono-app text-sm text-app focus:outline-none"
							placeholder="api-gateway-prod"
						/>
						<span class="whitespace-nowrap font-mono-app text-xs text-muted-app"
							>{DNS_SUFFIX}</span
						>
					</div>
					<!-- Composed DNS rides on a hidden field so the server still
					     sees the full hostname it expects. -->
					<input type="hidden" name="dns_name" value={dns_name} />
				</div>
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						Custom Open Ports
					</label>
					<input
						type="text"
						name="ports"
						bind:value={ports}
						class="w-full rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-app focus:border-strong-app focus:outline-none"
						placeholder="e.g. 8080, 3000"
					/>
					{#if errors.ports}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.ports}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Section 4: Timeline Retention -->
		<div class="space-y-6 border-t border-app pt-4">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						Start Date <span class="text-muted-app">(วันเริ่มใช้)</span>
					</label>
					<input
						type="date"
						name="start_date"
						bind:value={start_date}
						style="color-scheme: dark"
						class="w-full rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-app focus:border-strong-app focus:outline-none"
						required
					/>
					{#if errors.start_date}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.start_date}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<label
						class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
					>
						End Date <span class="text-muted-app">(วันสิ้นสุด)</span>
					</label>
					<input
						type="date"
						name="end_date"
						bind:value={end_date}
						style="color-scheme: dark"
						class="w-full rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm font-bold text-accent focus:border-strong-app focus:outline-none"
						required
					/>
					{#if errors.end_date}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.end_date}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Section 5: Purpose / Notes -->
		<div class="space-y-4 border-t border-app pt-4">
			<div class="space-y-2">
				<label
					class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
				>
					Purpose / Notes <span class="text-muted-app"
						>(อธิบายวัตถุประสงค์เพิ่มเติม)</span
					>
				</label>
				<textarea
					name="purpose_notes"
					bind:value={purpose_notes}
					rows="3"
					class="w-full rounded-lg border border-app bg-elevated px-3 py-2 font-mono-app text-sm text-secondary-app focus:border-strong-app focus:outline-none"
					placeholder="ระบุเหตุผลในการขอใช้เครื่อง เช่น ใช้เป็น API Gateway สเปคสำหรับโปรเจกต์ AuthWeb คอนฟิก VLAN 10..."
					required
				></textarea>
				{#if errors.purpose_notes}
					<p class="mt-1 text-xs" style="color: var(--danger)">{errors.purpose_notes}</p>
				{/if}
			</div>
		</div>

		<!-- Section 6: Quantity & Submit -->
		<div
			class="flex flex-col items-center justify-between gap-4 border-t border-app pt-6 sm:flex-row"
		>
			<div class="flex items-center gap-4">
				<label
					class="text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
				>
					Quantity
				</label>
				<input
					type="number"
					name="quantity"
					bind:value={quantity}
					min="1"
					max="10"
					class="w-16 rounded-lg border border-app bg-elevated p-1.5 text-center font-mono-app text-sm font-bold text-accent focus:border-strong-app focus:outline-none"
					required
				/>
			</div>
			<button
				type="submit"
				class="w-full rounded-lg bg-accent px-6 py-3 font-mono-app text-xs font-bold uppercase tracking-wider text-zinc-950 shadow-md transition hover:opacity-90 sm:w-auto"
			>
				Execute_Deploy ({pad3(quantity)})
			</button>
		</div>
	</div>

	<!-- RIGHT: Live Summary Sidebar (~30%) ----------------------------------- -->
	<aside class="space-y-8 font-mono-app text-xs lg:col-span-1 lg:border-l lg:border-app lg:pl-12">
		<div class="space-y-1">
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-app">
				System Preview
			</div>
			<div class="font-sans text-sm font-bold text-app">{hostname || '—'}</div>
		</div>

		<div class="space-y-4">
			<div class="flex justify-between border-b border-app/50 pb-2">
				<span class="text-muted-app">Node Type:</span>
				<span class="font-bold text-accent"
					>{type === 'vm' ? 'VM (KVM)' : 'Container (LXC)'}</span
				>
			</div>
			<div class="flex justify-between border-b border-app/50 pb-2">
				<span class="text-muted-app">Template:</span>
				<span class="text-secondary-app">{os_template || '—'}</span>
			</div>
			<div class="flex justify-between border-b border-app/50 pb-2">
				<span class="text-muted-app">Group:</span>
				<span class="text-secondary-app">{passionGroupName}</span>
			</div>
		</div>

		<div class="space-y-2 rounded-lg border border-app/60 bg-elevated/10 p-4">
			<div class="text-[10px] font-bold uppercase tracking-wider text-muted-app">
				Allocated Specs
			</div>
			<div class="flex justify-between">
				<span>• CPU:</span><span class="font-bold text-app">{cpu} Cores</span>
			</div>
			<div class="flex justify-between">
				<span>• RAM:</span><span class="font-bold text-app">{ram} GB</span>
			</div>
			<div class="flex justify-between">
				<span>• Disk:</span><span class="font-bold text-app">{disk} GB</span>
			</div>
		</div>

		<div class="space-y-2 rounded-lg border border-app/60 bg-elevated/10 p-4">
			<div class="text-[10px] font-bold uppercase tracking-wider text-muted-app">
				Network & Ports
			</div>
			<div class="flex justify-between">
				<span>Access:</span>
				<span class="text-secondary-app">{network_type === 'local' ? 'LOCAL' : 'PUBLIC'}</span>
			</div>
			<div class="flex justify-between gap-2">
				<span>DNS:</span>
				<span class="text-secondary-app">{dns_name || '—'}</span>
			</div>
			<div class="flex justify-between gap-2">
				<span>Open Ports:</span>
				<span class="font-bold text-accent">
					{portsList.length ? portsList.join(', ') : 'None'}
				</span>
			</div>
		</div>

		<div class="space-y-2 rounded-lg border border-app/60 bg-elevated/10 p-4">
			<div class="text-[10px] font-bold uppercase tracking-wider text-muted-app">
				Lease Duration
			</div>
			<div class="flex justify-between">
				<span>Start Date:</span><span class="text-secondary-app">{fmtDate(start_date)}</span>
			</div>
			<div class="flex justify-between">
				<span>End Date:</span><span class="font-bold text-accent">{fmtDate(end_date)}</span>
			</div>
			<div class="flex justify-between">
				<span>Duration:</span><span class="text-secondary-app">{leaseDays ?? '—'} days</span>
			</div>
		</div>

		<div
			class="rounded-lg border p-3 text-center"
			style="background-color: var(--accent-soft); border-color: color-mix(in oklab, var(--accent) 30%, transparent);"
		>
			<span class="text-muted-app">Instance Count:</span>
			<span class="ml-1 font-mono-app text-sm font-bold text-accent">{pad3(quantity)}</span>
		</div>
	</aside>
</form>