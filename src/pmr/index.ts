import { get, isCorrect, update, add } from './config';
import { execCommandOnShell } from '../utility';
import { workspace } from 'coc.nvim';
import { init, changeText } from './status';

export const initStatusBar = init;

export async function exec() {
    const target = getTarget();
    const filter = new RegExp(target.regex ? target.regex : '.*');

    const listCommand = `ssh ${target.remoteUser}@${target.remoteAddr} "pm2 jlist | jq -c 'map(.name)'" | jq -r "join(\\"\\n\\")"`;
    const list = await execCommandOnShell(listCommand)
        .then(str => str.split('\n'))
        .then(arr => arr.filter(item => filter.test(item)));

    if (list.length === 0) {
        workspace.showMessage('no pm2 process is running');
        return;
    }

    const selectedIdx = await workspace.showQuickpick(list);
    if (selectedIdx === -1) {
        workspace.showMessage('cancel');
        return;
    }

    const selected = list[selectedIdx];
    const restartCommand = `ssh ${target.remoteUser}@${target.remoteAddr} "pm2 restart ${selected}"`;
    await execCommandOnShell(restartCommand);

    workspace.showMessage(`Successfully restart remote process - ${selected}`);
}

function getTarget() {
    const config = get();

    if (!isCorrect(config)) {
        throw new Error(
            'the configuration of current workspace has not been set or is a misconfiguration, ignore'
        );
    }

    const target = config.list.find(
        item => item.id === config.targetId
    ) as PmrBase;

    return target;
}

export async function reset() {
    const config = getConfigWithInit();

    const itemList = config.list.map(item => item.id).concat('⊕');
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
