<script lang="ts">
	import type { Preset } from '$lib/presets';
	import { TriangleAlert, Search, X } from '@lucide/svelte';

	let {
		presets = [],
		selectedPreset = $bindable(''),
		onSelect,
		onClear
	}: {
		presets: Preset[];
		selectedPreset: string;
		onSelect: (slug: string) => void;
		onClear: () => void;
	} = $props();

	let presetQuery = $state('');
	let presetDropdownOpen = $state(false);
	let acknowledgedDevelopSlug = $state('');

	const filteredPresets = $derived.by(() => {
		const q = presetQuery.trim().toLowerCase();
		if (!q) return presets;
		return presets.filter(
			(p) =>
				p.name.toLowerCase().includes(q) ||
				p.slug.toLowerCase().includes(q)
		);
	});

	const presetDisplayValue = $derived.by(() => {
		if (selectedPreset) {
			return (
				presets.find((p) => p.slug === selectedPreset)?.name ??
				presetQuery
			);
		}
		return presetQuery;
	});

	function selectPreset(slug: string) {
		selectedPreset = slug;
		const match = slug
			? presets.find((p) => p.slug === slug)
			: undefined;
		presetQuery = match?.name ?? '';
		presetDropdownOpen = false;
		onSelect(slug);
	}

	function clearPreset() {
		selectedPreset = '';
		presetQuery = '';
		presetDropdownOpen = false;
		onClear();
	}

	function handleWindowPointerDown(e: PointerEvent) {
		if (!presetDropdownOpen) return;
		const target = e.target as HTMLElement | null;
		if (target?.closest('.preset-combobox')) return;
		presetDropdownOpen = false;
	}
</script>

<svelte:window onpointerdown={handleWindowPointerDown} />

{#if presets.length > 0}
	{@const selectedPresetRecord = presets.find((p) => p.slug === selectedPreset)}
	{@const showDevelopWarning =
		selectedPresetRecord?.status === 'Develop' &&
		acknowledgedDevelopSlug !== selectedPreset}
	<div class="space-y-4 rounded-lg border border-dashed border-app bg-surface/40 p-5">
		<div class="space-y-2">
			<label
				for="preset-combobox"
				class="block text-xs font-medium uppercase tracking-wider text-secondary-app font-mono-app"
			>
				Quick Preset
				<span class="text-muted-app">
					· optional · auto-fills from catalog ({presets.length}) · type to search
				</span>
			</label>

			<div class="relative preset-combobox">
				<input
					id="preset-combobox"
					type="text"
					role="combobox"
					aria-expanded={presetDropdownOpen}
					aria-autocomplete="list"
					aria-controls="preset-listbox"
					placeholder="Search presets — e.g. nginx, postgres, ubuntu…"
					value={presetDisplayValue}
					oninput={(e) => {
						presetQuery = e.currentTarget.value;
						if (selectedPreset && presetQuery !== presetDisplayValue) {
							selectedPreset = '';
						}
						presetDropdownOpen = true;
					}}
					onfocus={() => (presetDropdownOpen = true)}
					class="w-full rounded-lg border border-app bg-elevated py-2 pl-9 pr-9 font-mono-app text-sm text-app focus:border-strong-app focus:outline-none ml-5"
				/>
				<Search
					class="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-app"
				/>

				{#if selectedPreset}
					<button
						type="button"
						aria-label="Clear preset selection"
						onclick={clearPreset}
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-app transition hover:bg-surface hover:text-app"
					>
						<X class="h-3.5 w-3.5" />
					</button>
				{/if}

				{#if presetDropdownOpen}
					<ul
						id="preset-listbox"
						role="listbox"
						class="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-app bg-elevated shadow-xl"
					>
						<li
							role="option"
							aria-selected={selectedPreset === ''}
							onmousedown={() => selectPreset('')}
							class="cursor-pointer px-3 py-2 font-mono-app text-xs text-muted-app transition hover:bg-surface hover:text-app"
						>
							— blank / start from scratch —
						</li>
						{#if filteredPresets.length === 0}
							<li class="px-3 py-2 font-mono-app text-xs text-muted-app">
								No matches for "{presetQuery}".
							</li>
						{:else}
							{#each filteredPresets as preset (preset.slug)}
								{@const isDevelop = preset.status === 'Develop'}
								<li
									role="option"
									aria-selected={selectedPreset === preset.slug}
									onmousedown={() => selectPreset(preset.slug)}
									class="flex cursor-pointer items-center justify-between gap-2 border-t border-app px-3 py-2 font-mono-app text-xs transition hover:bg-surface"
								>
									<span class="flex flex-col gap-0.5">
										<span class="flex items-center gap-2 text-app">
											{preset.name}
											{#if isDevelop}
												<span
													class="rounded-sm border px-1 py-px text-[9px] font-bold uppercase tracking-wider text-accent"
													style="border-color: var(--accent);"
												>
													dev
												</span>
											{/if}
										</span>
										<span class="text-muted-app">
											{preset.type} · {preset.os_template} · {preset.slug}
										</span>
									</span>
									<span class="shrink-0 text-muted-app">
										{preset.default_cpu}C / {preset.default_ram}G / {preset.default_disk}G
									</span>
								</li>
							{/each}
						{/if}
					</ul>
				{/if}
			</div>
		</div>

		{#if showDevelopWarning}
			<div
				role="alert"
				class="rounded-lg border-2 p-4"
				style="background-color: color-mix(in oklab, var(--accent) 12%, var(--bg-surface)); border-color: var(--accent);"
			>
				<div class="flex items-start gap-3">
					<TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
					<div class="flex-1 space-y-2">
						<p class="font-mono-app text-sm font-bold uppercase tracking-wider text-accent">
							Development script
						</p>
						<p class="text-xs leading-relaxed text-secondary-app">
							This script is in active development and may be unstable, incomplete, or subject to
							breaking changes. It is
							<span class="font-semibold text-app">not recommended for production use</span>.
						</p>
						<button
							type="button"
							onclick={() => (acknowledgedDevelopSlug = selectedPreset)}
							class="rounded-md border-2 px-3 py-1.5 font-mono-app text-[10px] font-bold uppercase tracking-wider text-accent transition hover:bg-accent hover:text-zinc-950"
							style="border-color: var(--accent);"
						>
							I understand — show install command →
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if selectedPresetRecord}
			<div class="space-y-2 border-t border-app pt-3 text-xs">
				<div class="flex items-start justify-between gap-3">
					<p class="flex-1 leading-relaxed text-secondary-app">
						{selectedPresetRecord.description || 'No description provided.'}
					</p>
					{#if selectedPresetRecord.source_url}
						<a
							href={selectedPresetRecord.source_url}
							target="_blank"
							rel="noopener noreferrer"
							class="shrink-0 whitespace-nowrap font-mono-app text-[10px] uppercase tracking-wider text-accent hover:underline"
						>
							community-scripts →
						</a>
					{/if}
				</div>
				<div class="flex flex-wrap gap-x-2 gap-y-1 font-mono-app text-[10px] uppercase tracking-wider text-muted-app">
					<span>type: <span class="text-app">{selectedPresetRecord.type}</span></span>
					<span>·</span>
					<span>os: <span class="text-app">{selectedPresetRecord.os_template}</span></span>
					<span>·</span>
					<span>net: <span class="text-app">{selectedPresetRecord.default_network}</span></span>
					{#if selectedPresetRecord.default_ports}
						<span>·</span>
						<span>port: <span class="text-app">{selectedPresetRecord.default_ports}</span></span>
					{/if}
					{#if selectedPresetRecord.category}
						<span>·</span>
						<span>cat: <span class="text-app">{selectedPresetRecord.category}</span></span>
					{/if}
					{#if selectedPresetRecord.status}
						<span>·</span>
						<span>
							status:
							<span class={selectedPresetRecord.status === 'Develop' ? 'font-bold text-accent' : 'text-app'}>
								{selectedPresetRecord.status}
							</span>
						</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
