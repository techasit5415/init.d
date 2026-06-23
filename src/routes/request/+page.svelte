<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Cpu, MemoryStick, HardDrive, Send } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Live form state. Mirrors the rendered inputs so the preview pane
	// can re-derive on every keystroke.
	let passion_group = $state(data.defaults.passion_group ?? '');
	let type = $state<'vm' | 'container'>(data.defaults.type);
	let hostname = $state('');
	let os_template = $state('');
	let cpu = $state(data.defaults.cpu);
	let ram = $state(data.defaults.ram);
	let disk = $state(data.defaults.disk);
	let network_type = $state<'local' | 'public'>(data.defaults.network_type);
	let dns_name = $state('');
	let ports = $state('');
	let purpose_notes = $state('');
	let start_date = $state('');
	let end_date = $state('');
	let quantity = $state(data.defaults.quantity);

	// If the server returned previous values (validation error), restore them.
	$effect(() => {
		if (form?.values) {
			passion_group = form.values.passion_group ?? passion_group;
			type = form.values.type ?? type;
			hostname = form.values.hostname ?? hostname;
			os_template = form.values.os_template ?? os_template;
			cpu = form.values.specs?.cpu ?? cpu;
			ram = form.values.specs?.ram ?? ram;
			disk = form.values.specs?.disk ?? disk;
			network_type = form.values.network_type ?? network_type;
			dns_name = form.values.dns_name ?? dns_name;
			ports = form.values.ports ?? ports;
			purpose_notes = form.values.purpose_notes ?? purpose_notes;
			start_date = form.values.start_date ?? start_date;
			end_date = form.values.end_date ?? end_date;
			quantity = form.values.quantity ?? quantity;
		}
	});

	const portsList = $derived(
		ports
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean)
	);

	const errors = $derived(form?.errors ?? {});
	const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '—');
	const leaseDays = $derived(() => {
		if (!start_date || !end_date) return null;
		const ms = new Date(end_date).getTime() - new Date(start_date).getTime();
		return Math.max(0, Math.ceil(ms / 86_400_000));
	});
</script>

<header class="mb-8 flex items-end justify-between gap-4">
	<div>
		<p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// new lease</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">Request infrastructure</h1>
		<p class="mt-1 text-sm text-secondary-app">
			Fill the spec, define the lease window, file it. The cluster team picks it up from the
			queue.
		</p>
	</div>
</header>

<form method="POST" class="grid grid-cols-1 gap-8 lg:grid-cols-10">
	<!-- LEFT: form fields (~70%) ------------------------------------------ -->
	<div class="space-y-10 lg:col-span-7">
		<!-- Identity -->
		<fieldset class="space-y-4">
			<legend class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
				Identity
			</legend>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Requester email</span
					>
					<input
						class="w-full font-mono-app"
						type="email"
						name="creator_email"
						value={data.email}
						readonly
						disabled
						title="Read-only — pulled from your session"
					/>
				</label>
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Passion group / project</span
					>
					<input
						class="w-full"
						type="text"
						name="passion_group"
						bind:value={passion_group}
						placeholder="e.g. distributed-systems-club"
						required
					/>
					{#if errors.passion_group}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.passion_group}</p>
					{/if}
				</label>
			</div>
		</fieldset>

		<!-- Workload shape -->
		<fieldset class="space-y-4">
			<legend class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
				Workload shape
			</legend>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Type</span
					>
					<select name="type" bind:value={type} class="w-full">
						<option value="vm">virtual machine</option>
						<option value="container">container (LXC)</option>
					</select>
				</label>

				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Hostname</span
					>
					<input
						class="w-full font-mono-app"
						type="text"
						name="hostname"
						bind:value={hostname}
						placeholder="compute-01"
						pattern="[a-z0-9-]+"
						required
					/>
					{#if errors.hostname}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.hostname}</p>
					{/if}
				</label>
			</div>

			<label class="block">
				<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
					>OS template</span
				>
				<input
					class="w-full font-mono-app"
					type="text"
					name="os_template"
					bind:value={os_template}
					placeholder="ubuntu-24.04"
					required
				/>
				{#if errors.os_template}
					<p class="mt-1 text-xs" style="color: var(--danger)">{errors.os_template}</p>
				{/if}
			</label>

			<div class="grid gap-4 sm:grid-cols-3">
				<label class="block">
					<span class="mb-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-muted-app">
						<Cpu class="h-3 w-3" /> CPU cores
					</span>
					<input
						class="w-full font-mono-app"
						type="number"
						name="cpu"
						bind:value={cpu}
						min="1"
						max="128"
						required
					/>
				</label>
				<label class="block">
					<span class="mb-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-muted-app">
						<MemoryStick class="h-3 w-3" /> RAM (GB)
					</span>
					<input
						class="w-full font-mono-app"
						type="number"
						name="ram"
						bind:value={ram}
						min="1"
						max="1024"
						required
					/>
				</label>
				<label class="block">
					<span class="mb-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-muted-app">
						<HardDrive class="h-3 w-3" /> Disk (GB)
					</span>
					<input
						class="w-full font-mono-app"
						type="number"
						name="disk"
						bind:value={disk}
						min="1"
						max="16384"
						required
					/>
				</label>
			</div>
		</fieldset>

		<!-- Network -->
		<fieldset class="space-y-4">
			<legend class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
				Network
			</legend>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Network type</span
					>
					<select name="network_type" bind:value={network_type} class="w-full">
						<option value="local">local-only (VLAN)</option>
						<option value="public">public-facing</option>
					</select>
				</label>
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>DNS name</span
					>
					<input
						class="w-full font-mono-app"
						type="text"
						name="dns_name"
						bind:value={dns_name}
						placeholder="compute-01.lease.internal"
					/>
				</label>
			</div>

			<label class="block">
				<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
					>Custom open ports <span class="text-muted-app">(comma-separated)</span></span
				>
				<input
					class="w-full font-mono-app"
					type="text"
					name="ports"
					bind:value={ports}
					placeholder="22, 80, 443, 5432"
				/>
				{#if errors.ports}
					<p class="mt-1 text-xs" style="color: var(--danger)">{errors.ports}</p>
				{/if}
			</label>
		</fieldset>

		<!-- Lease window -->
		<fieldset class="space-y-4">
			<legend class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
				Lease window
			</legend>
			<div class="grid gap-4 sm:grid-cols-3">
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Start date</span
					>
					<input
						class="w-full font-mono-app"
						type="date"
						name="start_date"
						bind:value={start_date}
						required
					/>
					{#if errors.start_date}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.start_date}</p>
					{/if}
				</label>
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>End date</span
					>
					<input
						class="w-full font-mono-app"
						type="date"
						name="end_date"
						bind:value={end_date}
						required
					/>
					{#if errors.end_date}
						<p class="mt-1 text-xs" style="color: var(--danger)">{errors.end_date}</p>
					{/if}
				</label>
				<label class="block">
					<span class="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-app"
						>Quantity</span
					>
					<input
						class="w-full font-mono-app"
						type="number"
						name="quantity"
						bind:value={quantity}
						min="1"
						max="64"
						required
					/>
				</label>
			</div>
		</fieldset>

		<!-- Purpose -->
		<fieldset class="space-y-4">
			<legend class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
				Purpose notes
			</legend>
			<label class="block">
				<textarea
					name="purpose_notes"
					bind:value={purpose_notes}
					rows="6"
					required
					class="w-full font-mono-app"
					placeholder="What is this lease for? Include workload, expected traffic, dependencies, owners."
				></textarea>
				{#if errors.purpose_notes}
					<p class="mt-1 text-xs" style="color: var(--danger)">{errors.purpose_notes}</p>
				{/if}
			</label>
		</fieldset>

		<div class="flex items-center gap-3 border-t border-app pt-6">
			<button
				type="submit"
				class="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-6 font-mono text-xs uppercase tracking-widest text-app transition-colors duration-300 hover:bg-accent-soft hover:text-accent"
			>
				<Send class="h-4 w-4" />
				File lease request
			</button>
			<a
				href="/status"
				class="font-mono text-xs uppercase tracking-widest text-secondary-app hover:text-app"
			>
				Cancel
			</a>
		</div>
	</div>

	<!-- RIGHT: live preview (~30%) ----------------------------------------- -->
	<aside class="lg:col-span-3">
		<div class="sticky top-20 space-y-6">
			<div>
				<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
					Live preview
				</p>
				<p class="mt-1 text-xs text-secondary-app">
					Re-binds on every keystroke. Not saved until you submit.
				</p>
			</div>

			<div class="rounded-lg border border-app bg-surface p-5 transition-colors duration-300">
				<dl class="space-y-3 font-mono-app text-sm">
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">hostname</dt>
						<dd class="text-right text-app">{hostname || '—'}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">type</dt>
						<dd class="text-right text-app">{type}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">os</dt>
						<dd class="text-right text-app">{os_template || '—'}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">cpu</dt>
						<dd class="text-right text-accent">{cpu} cores</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">ram</dt>
						<dd class="text-right text-accent">{ram} GB</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">disk</dt>
						<dd class="text-right text-accent">{disk} GB</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">network</dt>
						<dd class="text-right text-app">{network_type}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">dns</dt>
						<dd class="text-right text-app">{dns_name || '—'}</dd>
					</div>
				</dl>
			</div>

			<div class="rounded-lg border border-app bg-surface p-5 transition-colors duration-300">
				<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">Open ports</p>
				{#if portsList.length}
					<div class="mt-3 flex flex-wrap gap-1.5">
						{#each portsList as port (port)}
							<span
								class="rounded border border-app bg-elevated px-2 py-0.5 font-mono-app text-xs text-accent"
							>
								{port}
							</span>
						{/each}
					</div>
				{:else}
					<p class="mt-2 font-mono-app text-xs text-muted-app">none</p>
				{/if}
			</div>

			<div class="rounded-lg border border-app bg-surface p-5 transition-colors duration-300">
				<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">Lease window</p>
				<dl class="mt-3 space-y-2 font-mono-app text-sm">
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">start</dt>
						<dd class="text-right text-app">{fmtDate(start_date)}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">end</dt>
						<dd class="text-right text-app">{fmtDate(end_date)}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">duration</dt>
						<dd class="text-right text-accent">{leaseDays() ?? '—'} days</dd>
					</div>
					<div class="flex items-baseline justify-between gap-2">
						<dt class="text-muted-app">quantity</dt>
						<dd class="text-right text-app">{quantity}</dd>
					</div>
				</dl>
			</div>

			<div class="rounded-lg border border-app bg-surface p-5 transition-colors duration-300">
				<p class="font-mono text-[11px] uppercase tracking-widest text-muted-app">
					Purpose notes
				</p>
				<p class="mt-2 whitespace-pre-wrap text-sm text-secondary-app">
					{purpose_notes || '—'}
				</p>
			</div>
		</div>
	</aside>
</form>
