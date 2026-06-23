// Status page — queries PocketBase filtered by the logged-in user's
// email so users only see rows they themselves filed.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { LeaseInstance } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const email = locals.user.email;

	try {
		const list = await locals.pb.collection('instances').getList<LeaseInstance>(1, 200, {
			filter: `creator_email = "${email.replace(/"/g, '\\"')}"`,
			sort: '-created'
		});
		return { items: list.items, email };
	} catch {
		// If the rule rejects the query (e.g. logged in user without an
		// email-bound rule on the collection) fall back to an empty list
		// rather than crash the page.
		return { items: [], email };
	}
};
