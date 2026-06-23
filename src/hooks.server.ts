// SvelteKit server hook — runs on every request.
// We attach a per-request PocketBase client to `event.locals.pb` and
// resolve the current session into `event.locals.user`.

import type { Handle } from '@sveltejs/kit';
import { createPb } from '$lib/pb';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = createPb(event);

	const pb = event.locals.pb;
	if (pb.authStore.isValid) {
		try {
			// Refresh the auth model — also lets us read the role field
			// we attach to the user record.
			const record = await pb.collection('users').authRefresh();
			event.locals.user = {
				id: record.id,
				email: record.email,
				name: record.name ?? record.username,
				role: (record as { role?: 'admin' | 'user' }).role ?? 'user'
			};
		} catch {
			pb.authStore.clear();
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
