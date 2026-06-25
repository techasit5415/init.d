// Admin dashboard server logic:
//   1. Guards non-admins.
//   2. Loads the initial snapshot of lease requests.
//   3. Exposes a `resolve` action that flips status to "completed".

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { LeaseInstance } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required.');

	try {
		const list = await locals.pb.collection('instances').getList<LeaseInstance>(1, 500, {
			sort: '-created',
			expand: 'passion_group'
		});
		return { items: list.items };
	} catch (e) {
		console.error('admin load failed', e);
		return { items: [] };
	}
};

export const actions: Actions = {
	resolve: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Admin only.');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing id.' });

		try {
			await locals.pb.collection('instances').update(id, { status: 'completed' });
			return { ok: true, id };
		} catch (e) {
			console.error('resolve failed', e);
			return fail(500, { error: 'Could not update instance.' });
		}
	},
	reply: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Admin only.');

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const clear = fd.get('clear') === '1';
		const reply = String(fd.get('reply') ?? '').trim();

		if (!id) return fail(400, { error: 'Missing id.' });

		// Clearing empties both fields. Sending empty `reply` without the
		// `clear` flag is treated as a no-op rather than a save — the
		// textarea would otherwise wipe a real reply if the user clicked
		// Save with an empty field by mistake.
		const patch = clear
			? { admin_reply: '', admin_reply_at: null }
			: reply.length > 0
				? { admin_reply: reply, admin_reply_at: new Date().toISOString() }
				: null;
		if (!patch) return fail(400, { error: 'Reply is empty.' });
		if (!clear && reply.length > 4096) return fail(400, { error: 'Reply too long.' });

		try {
			await locals.pb.collection('instances').update(id, patch);
			return { ok: true, id, cleared: clear };
		} catch (e) {
			console.error('reply failed', e);
			return fail(500, { error: 'Could not save reply.' });
		}
	}
};
