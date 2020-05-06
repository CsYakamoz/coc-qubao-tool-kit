import { workspace } from 'coc.nvim';
import { exec } from 'child_process';

export const fsUriPrefix = 'file://';

export function getFolder() {
    if (workspace.workspaceFolder !== null) {
        return workspace.workspaceFolder.uri.substring(fsUriPrefix.length);
    }

    return workspace.nvim.call('getcwd').then(cwd => cwd.trim());
}

export function getQtkConfig(section: string) {
    const config = (workspace.getConfiguration().get('qtk') || {}) as any;

    return config[section] || {};
}

export function updateQtkConfig(section: string, value: any) {
    const config = (workspace.getConfiguration().get('qtk') || {}) as any;

    workspace
        .getConfiguration()
        .update('qtk', { ...config, [section]: value }, true);
}

export async function execCommandOnShell(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

const isNil = (value: any) => value === null || value === undefined;
export function throwErrorIfNull(name: string, value: any) {
    if (isNil(value)) {
        throw new Error(`${name} get Nil`);
    }
}
