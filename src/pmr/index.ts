import { get, isCorrect, update, add } from './config';
import { execCommandOnShell } from '../utility';
import { workspace, BasicList, ListItem, Neovim } from 'coc.nvim';
import { init, changeText } from './status';

export const initStatusBar = init;

export class PmrList extends BasicList {
    public readonly name = 'pmr';
    public readonly defaultAction = 'exec';
    public description = 'restart remote pm2 process';

    constructor(nvim: Neovim) {
        super(nvim);

        this.addAction('exec', async (item: ListItem) => {
            const name = item.data;

            const target = getTarget();
            const restartCommand = getRestartCommand(target, name);
            await execCommandOnShell(restartCommand);

            workspace.showMessage(
                `Successfully restart remote process - ${name}`
            );
        });

        this.addAction('preview', (item: ListItem) => {
            const name = item.data;

            const target = getTarget();
            const restartCommand = getRestartCommand(target, name);

            workspace.showMessage(restartCommand);
        });
    }

    public async loadItems(): Promise<ListItem[]> {
        const target = getTarget();
        const filterReg = new RegExp(target.regex ? target.regex : '.*');

        const list = await getList(target, filterReg);

        return list.map(
            (name): ListItem => ({
                label: name,
                filterText: name,
                data: name
            })
        );
    }
}

function getTarget() {
    const config = get();

    if (!isCorrect(config)) {
        throw new Error(
            'the configuration of current workspace has not been set or is a misconfiguration, ignore'
        );
    }

    const target = config.list.find(
        (item) => item.id === config.targetId
    ) as PmrBase;

    return target;
}

async function getList(target: PmrBase, filterReg: RegExp): Promise<string[]> {
    const processingCmdOutput = (str: string) =>
        str.split('\n').filter((item) => item !== '' && filterReg.test(item));

    if (target.commandList === undefined) {
        const command = `ssh ${target.remoteUser}@${target.remoteAddr} "pm2 jlist | jq -c 'map(.name)'" | jq -r "join(\\"\\n\\")"`;

        return execCommandOnShell(command).then(processingCmdOutput);
    }

    const result = await Promise.all(
        target.commandList.map((item) => {
            const command = `ssh ${target.remoteUser}@${target.remoteAddr} ${item.list}`;

            return execCommandOnShell(command)
                .then(processingCmdOutput)
                .then((list) =>
                    list.map((name) => `${getPrefix(item.id)}${name}`)
                );
        })
    );

    return result.reduce((acc, curr) => acc.concat(curr), []);
}

function getRestartCommand(target: PmrBase, selected: string): string {
    if (target.commandList === undefined) {
        return `ssh ${target.remoteUser}@${target.remoteAddr} "pm2 restart ${selected}"`;
    }

    const result = target.commandList.find((item) =>
        selected.startsWith(getPrefix(item.id))
    );
    if (result === undefined) {
        throw new Error(
            `can not find any restart command, selected: ${selected}`
        );
    }

    const name = result.restart.replace(
        '${selected}',
        selected.replace(getPrefix(result.id), '')
    );
    return `ssh ${target.remoteUser}@${target.remoteAddr} ` + `${name}`;
}

function getPrefix(id: string) {
    return `[${id}]`;
}

export async function reset() {
    const config = getConfigWithInit();

    const itemList = config.list.map((item) => item.id).concat('⊕');
    const selectedIdx = await workspace.showQuickpick(itemList);
    if (selectedIdx === -1) {
        workspace.showMessage('cancel');
        return;
    }

    const selected = itemList[selectedIdx];

    if (selected === '⊕') {
        const id = await add(config);
        changeText(id);
        return;
    }

    update({ ...config, targetId: selected });
    changeText(selected);
}

function getConfigWithInit() {
    const config = get();

    if (config === undefined) {
        return { targetId: '', list: [] };
    }

    if (config.list === undefined) {
        return { targetId: '', list: [] };
    }

    return config;
}
