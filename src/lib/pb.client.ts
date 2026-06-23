// Browser-side PocketBase client.
// The browser client is what powers real-time subscriptions on the admin
// dashboard. The auth state is mirrored from the cookie that hooks.server.ts
// writes on every request.

import PocketBase from 'pocketbase';
import { AUTH_COOKIE } from './pb';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL ?? 'http://192.168.15.14:8090';

let _client: PocketBase | null = null;

export function pbBrowser(): PocketBase {
	if (_client) return _client;

	const pb = new PocketBase(PB_URL);
	pb.autoCancellation(false);

	// Hydrate the auth store from the server-issued cookie, if any.
	const cookies = document.cookie.split('; ');
	const raw = cookies.find((c) => c.startsWith(`${AUTH_COOKIE}=`));
	if (raw) {
		const value = decodeURIComponent(raw.split('=').slice(1).join('='));
		try {
			pb.authStore.loadFromCookie(value, AUTH_COOKIE);
		} catch {
			/* ignore */
		}
	}

	_client = pb;
	return pb;
}
