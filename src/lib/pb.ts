// Server-side PocketBase client.
// One client per request — auth is restored from the cookie that
// SvelteKit forwards. Used by +page.server.ts / +server.ts files.

import PocketBase from 'pocketbase';
import type { RequestEvent } from '@sveltejs/kit';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://192.168.15.14:8090';

export const AUTH_COOKIE = 'pb_auth';

export function createPb(event: RequestEvent): PocketBase {
	const pb = new PocketBase(PB_URL);
	// Disable auto-cancellation so concurrent calls in one request don't
	// cancel each other (e.g. during form re-renders).
	pb.autoCancellation(false);

	// The auth cookie holds the raw PocketBase `authStore` JSON.
	const cookie = event.cookies.get(AUTH_COOKIE);
	if (cookie) {
		try {
			pb.authStore.loadFromCookie(cookie, AUTH_COOKIE);
		} catch {
			// Corrupt cookie — clear it.
			event.cookies.delete(AUTH_COOKIE, { path: '/' });
		}
	}

	// Persist any changes (e.g. refreshed token) back into the cookie.
	pb.authStore.onChange(() => {
		event.cookies.set(AUTH_COOKIE, pb.authStore.exportToCookie(AUTH_COOKIE), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !import.meta.env.DEV,
			maxAge: 60 * 60 * 24 * 7
		});
	}, true);

	return pb;
}
