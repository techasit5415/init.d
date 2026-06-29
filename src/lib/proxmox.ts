import proxmoxApi from 'proxmox-api';
import * as dotenv from 'dotenv';

dotenv.config();

// Throw an error if the connection details are missing to prevent silent failures
if (!process.env.PROXMOX_HOST || !process.env.PROXMOX_USER || !process.env.PROXMOX_TOKEN_SECRET) {
    console.warn("Proxmox API credentials not fully configured in environment variables.");
}

export const proxmox = proxmoxApi(process.env.PROXMOX_TOKEN ? {
    host: process.env.PROXMOX_HOST || '',
    port: process.env.PROXMOX_PORT ? Number.parseInt(process.env.PROXMOX_PORT, 10) : 8006,
    tokenID: `${process.env.PROXMOX_USER}!${process.env.PROXMOX_TOKEN}`,
    tokenSecret: process.env.PROXMOX_TOKEN_SECRET || '',
} : {
    host: process.env.PROXMOX_HOST || '',
    port: process.env.PROXMOX_PORT ? Number.parseInt(process.env.PROXMOX_PORT, 10) : 8006,
    username: process.env.PROXMOX_USER || '',
    password: process.env.PROXMOX_TOKEN_SECRET || '',
});

export const createCT = async ( detail: any) => {
    try {
        const response = await proxmox.nodes.$('pve').lxc.$post({
            vmid: detail.vmid,
            template: detail.ostemplate,
            hostname: detail.hostname,
            cores: detail.cores,
            memory: detail.memory,
            net0: detail.net0,
            rootfs: detail.rootfs,
            password: detail.password,
            start: true,
            ostemplate: ''
        });
        return response;
    } catch (error) {
        console.error('Error creating container:', error);
        throw error;
    }
}

export const createVM = async (detail: any) => {
    try {
        const response = await proxmox.nodes.$('pve').qemu.$post({
            vmid: detail.vmid,
            template: detail.ostemplate,
            cores: detail.cores,
            memory: detail.memory,
            net0: detail.net0,
            scsihw: detail.scsihw,
            scsi0: detail.scsi0,
            ide2: detail.ide2,
            boot: detail.boot,
            bootdisk: detail.bootdisk,
            password: detail.password,
            start: true,
        });
        return response;
    } catch (error) {
        console.error('Error creating VM:', error);
        throw error;
    }
}
