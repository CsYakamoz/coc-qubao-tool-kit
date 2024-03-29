import { workspace } from 'coc.nvim';
import { getFolder, fsUriPrefix, execCommandOnShell } from '../utility';
import {
    getTargetConfig,
    getFolderConfig,
    updateFolderConfig,
    addTargetConfig,
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

    if (relative(folder, fsPath).startsWith('.git')) {
        workspace.showMessage('the file path should not include .git');
        return;
    }

    const {
        id,
        remoteUser: user,
        remoteAddr: addr,
        remoteDir: dir,
        remotePort: port = 22,
    } = getTargetConfig(folder);

    const relativePath = relative(folder, fsPath);
    const remotePath = dir + '/' + relativePath;

    await execCommandOnShell(
        `ssh ${user}@${addr} -p ${port} "mkdir -p ${dirname(remotePath)}"`
    );
    await execCommandOnShell(
        `scp -P ${port} ${fsPath} ${user}@${addr}:${remotePath}`
    );

    const relativePathAbbr = getAbbreviationPath(relativePath);
    workspace.showMessage(
        `Successfully copy the file(${relativePathAbbr}) to remote server with id(${id})`
    );
}

function getAbbreviationPath(relativePath: string): string {
    const current = basename(relativePath);
    const parentDir = basename(dirname(relativePath));

    const list = relativePath.split('/');

    if (list.length > 2) {
        const prefix = list
            .slice(0, list.length - 2)
            .map((item) => item[0])
            .join('/');

        return prefix + '/' + parentDir + '/' + current;
    } else if (list.length === 2) {
        return parentDir + '/' + current;
    } else {
        return current;
    }
}

export async function reset() {
    const folder = await getFolder();
    const folderConfig = getFolderConfigWithInit(folder);

    const itemList = folderConfig.list.map((item) => item.id).concat('⊕');
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
