import { getQtkConfig, updateQtkConfig, throwErrorIfNull } from '../../utility';
import { workspace } from 'coc.nvim';

export function getTargetConfig(folder: string) {
    const folderConfig = getFolderConfig(folder);

    if (!isCorrect(folderConfig)) {
        throw new Error(
            'the configuration of current workspace has not been set or is a misconfiguration, ignore'
        );
    }

    const target = folderConfig.list.find(
        item => item.id === folderConfig.targetId
    ) as CprBase;

    return target;
}

export function getFolderConfig(folder: string) {
    const config = getQtkConfig('cpr') as CprSetting;

    if (config[folder] !== undefined && config[folder].source !== undefined) {
        const source = config[folder].source as string;
        return config[source];
    }

    return config[folder];
}

export function isCorrect(folderConfig: CprFolderConfig) {
    if (
        folderConfig === undefined ||
        folderConfig.targetId === undefined ||
        folderConfig.list === undefined ||
        folderConfig.list.length === 0
    ) {
        return false;
    }

    const target = folderConfig.list.find(
        item => item.id === folderConfig.targetId
    );

    return target !== undefined;
}

export function updateFolderConfig(
    folder: string,
    folderConfig: CprFolderConfig
) {
    const config = getQtkConfig('cpr') as CprSetting;

    updateQtkConfig('cpr', { ...config, [folder]: folderConfig });
}

export async function addTargetConfig(
    folder: string,
    folderConfig: CprFolderConfig
) {
    const base = await requireInput();

    updateFolderConfig(folder, {
        targetId: base.id,
        list: folderConfig.list.concat(base)
    });

    return base.id;
}

async function requireInput() {
    const id = await workspace.requestInput(
        'please input the id of this environment(it should be unique)'
    );
    throwErrorIfNull('id', id);

    const remoteAddr = await workspace.requestInput(
        'please input remote address'
    );
    throwErrorIfNull('remoteAddr', remoteAddr);

    const remoteUser = await workspace.requestInput('please input remote user');
    throwErrorIfNull('remoteUser', remoteUser);

    const remoteDir = await workspace.requestInput(
        'please input remote project dir'
    );
    throwErrorIfNull('remoteDir', remoteDir);

    return { id, remoteAddr, remoteUser, remoteDir };
}
