import { getQtkConfig, updateQtkConfig, throwErrorIfNull } from '../../utility';
import { workspace } from 'coc.nvim';

export function get() {
    return getQtkConfig('pmr') as PmrSetting;
}

export function update(config: PmrSetting) {
    updateQtkConfig('pmr', config);
}

export function isCorrect(config: PmrSetting) {
    if (
        config === undefined ||
        config.targetId == undefined ||
        config.list === undefined
    ) {
        return false;
    }

    const target = config.list.find(item => item.id === config.targetId);

    return target !== undefined;
}

export async function add(config: PmrSetting) {
    const base = await requireInput();

    updateQtkConfig('pmr', {
        targetId: base.id,
        list: config.list.concat(base)
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

    return { id, remoteAddr, remoteUser };
}
