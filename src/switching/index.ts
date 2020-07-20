import { workspace } from 'coc.nvim';
import { basename, relative } from 'path';
import { existsSync } from 'fs';
import { execCommandOnShell } from '../utility';

const FileType = {
    NONE: 0,
    SCHEMA: 1,
    HANDLER: 2
};

const fsUriPrefix = 'file://';

const SchemaPattern = /(.*)\/schema\/([0-9a-z_\.]+)(?:[\/a-z0-9_\.]*)/;
const HandlerPattern = /(.*)\/handler\/([0-9a-z_\.]+)(?:[\/a-z0-9\.])+/;

export default async function Switching() {
    const fsUri = workspace.uri;

    if (fsUri === null || !fsUri.startsWith(fsUriPrefix)) {
        workspace.showMessage('not a file');
        return;
    }

    const fsPath = fsUri.substring(fsUriPrefix.length);
    const type = getFileType(fsPath);

    if (type === FileType.NONE) {
        workspace.showMessage('neither schema or handler');
        return;
    }

    if (type === FileType.SCHEMA) {
        const [, prefix, apiNameWithExt] = fsPath.match(
            SchemaPattern
        ) as RegExpMatchArray;

        const apiName = basename(apiNameWithExt, '.js');
        const handlerPath = `${prefix}/handler`;

        if (!existsSync(handlerPath)) {
            workspace.showMessage(`not such path(${handlerPath})`);
            return;
        }

        const command = `find ${handlerPath} -type f | grep -E "^${handlerPath}/${apiName}\\b"`;
        await find(command)
            .then(select(prefix + '/handler'))
            .then(openFile);
    }

    if (type === FileType.HANDLER) {
        const [, prefix, apiName] = fsPath.match(
            HandlerPattern
        ) as RegExpMatchArray;

        const schemaPath = `${prefix}/schema`;

        if (!existsSync(schemaPath)) {
            workspace.showMessage(`not such path(${schemaPath})`);
            return;
        }

        const command = `find ${schemaPath} -type f | grep -E "^${schemaPath}/${apiName}\\b"`;
        await find(command)
            .then(select(prefix + '/schema'))
            .then(openFile);
    }
}

function getFileType(fsPath: string): number {
    if (SchemaPattern.test(fsPath)) {
        return FileType.SCHEMA;
    }

    if (HandlerPattern.test(fsPath)) {
        return FileType.HANDLER;
    }

    return FileType.NONE;
}

async function find(command: string) {
    return execCommandOnShell(command)
        .then(str => str.split('\n'))
        .then(arr => arr.filter(_ => _ !== ''))
        .then(arr => arr.sort((a, b) => a.length - b.length));
}

function select(prefix: string) {
    return async function(list: string[]) {
        if (list.length === 1) {
            return list[0];
        }

        const relPathList = list.map(fsPath => relative(prefix, fsPath));

        const selectedIdx = await showQuickPick(relPathList);
        return list[selectedIdx];
    };
}

async function showQuickPick(items: string[]) {
    if (items.length === 0) {
        throw new Error('nothing to be chosen');
    }

    const result = await workspace.showQuickpick(items);

    if (result === undefined) {
        throw new Error('cancelled');
    }

    return result;
}

async function openFile(fsPath: string) {
    const windowNum = await findWindow(fsPath);

    if (windowNum === undefined) {
        return workspace.nvim.command('vs ' + fsPath);
    }

    return workspace.nvim.command(windowNum.toString() + 'wincmd w');
}

async function findWindow(fsPath: string) {
    const windowList = await workspace.nvim.windows;

    for (const window of windowList) {
        const buf = await window.buffer;
        const bufName = await buf.name;

        if (bufName === fsPath) {
            return window.number;
        }
    }
}
