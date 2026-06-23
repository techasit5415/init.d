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
	}
};
