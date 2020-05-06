import { workspace } from 'coc.nvim';
import { getFolder, fsUriPrefix, execCommandOnShell } from '../utility';
import {
    getTargetConfig,
    getFolderConfig,
    updateFolderConfig,
    addTargetConfig
} from './config';
import { basename, relative, dirname } from 'path';
import { init, changeText } from './status';

export const initStatusBar = init;

export async function exec() {
    const fsUri = workspace.uri;
    if (fsUri === null || !fsUri.startsWith(fsUriPrefix)) {
        workspace.showMessage('not a file');
        return;
    }

    const fsPath = workspace.uri.substring(fsUriPrefix.length);
    const folder = await getFolder();
    if (!fsPath.startsWith(folder)) {
        const filename = basename(fsPath);
        throw new Error(
            `file(${filename}) does not belong to the current workspace(${folder})`
        );
    }

    const {
        id,
        remoteUser: user,
        remoteAddr: addr,
        remoteDir: dir
    } = getTargetConfig(folder);

    const relativePath = relative(folder, fsPath);
    const remotePath = dir + '/' + relativePath;

    await execCommandOnShell(
        `ssh ${user}@${addr} "mkdir -p ${dirname(remotePath)}"`
    );
    await execCommandOnShell(`scp ${fsPath} ${user}@${addr}:${remotePath}`);

    workspace.showMessage(
        `Successfully copy the file to remote server with id(${id})`
    );
}

export async function reset() {
    const folder = await getFolder();
    const folderConfig = getFolderConfigWithInit(folder);

    const itemList = folderConfig.list.map(item => item.id).concat('⊕');
    const selectedIdx = await workspace.showQuickpick(itemList);
    if (selectedIdx === -1) {
        workspace.showMessage('cancel');
        return;
    }

    const selected = itemList[selectedIdx];
    if (selected === '⊕') {
        const id = await addTargetConfig(folder, folderConfig);
        changeText(id);
        return;
    }

    updateFolderConfig(folder, { ...folderConfig, targetId: selected });
    changeText(selected);
}

function getFolderConfigWithInit(folder: string) {
    const folderConfig = getFolderConfig(folder);

    if (folderConfig === undefined) {
        return { targetId: '', list: [] };
    }

    return folderConfig;
}
