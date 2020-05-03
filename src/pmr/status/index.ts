import { workspace } from 'coc.nvim';
import { get, isCorrect } from '../config';

const StatusBarItem = workspace.createStatusBarItem();

export function init() {
    const config = get();

    if (isCorrect(config)) {
        const target = config.list.find(
            item => item.id === config.targetId
        ) as PmrBase;

        StatusBarItem.text = `Pmr-${target.id}`;
    } else {
        StatusBarItem.text = `Pmr-🤔`;
    }

    StatusBarItem.show();
}
export function changeText(text: string) {
    StatusBarItem.text = `Pmr-${text}`;
    StatusBarItem.show();
}
