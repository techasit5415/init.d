<script lang="ts">
	let { stats }: { stats: { total: number; pending: number; completed: number } } = $props();

	const pad3 = (n: number) => String(n).padStart(3, '0');
</script>

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
