// Shared types for the LEASE system.

export type InstanceType = 'vm' | 'container';
export type NetworkType = 'local' | 'public';
export type LeaseStatus = 'pending' | 'completed';
export type UserRole = 'admin' | 'user';

export interface InstanceSpecs {
	cpu: number;
	ram: number; // GB
	disk: number; // GB
}

export interface LeaseInstance {
	id: string;
	collectionId: string;
	collectionName: string;
	created: string;
	updated: string;
	creator_email: string;
	passion_group: string;
	type: InstanceType;
	hostname: string;
	os_template: string;
	specs: InstanceSpecs;
	network_type: NetworkType;
	dns_name?: string;
	ports?: string;
	purpose_notes: string;
	start_date: string;
	end_date: string;
	quantity: number;
	status: LeaseStatus;
}

export interface SessionUser {
	id: string;
	email: string;
	name?: string;
	role: UserRole;
}
