import { workspace } from 'coc.nvim';
import { getFolder } from '../../utility';
import { getFolderConfig, isCorrect } from '../config';

const StatusBarItem = workspace.createStatusBarItem();

export function init() {
    const folder = getFolder();
    const folderConfig = getFolderConfig(folder);

    if (isCorrect(folderConfig)) {
        const target = folderConfig.list.find(
            item => item.id === folderConfig.targetId
        ) as CprBase;

        StatusBarItem.text = `Cpr-${target.id}`;
    } else {
        StatusBarItem.text = `Cpr-🤔`;
    }

    StatusBarItem.show();
}
export function changeText(text: string) {
    StatusBarItem.text = `Cpr-${text}`;
    StatusBarItem.show();
}
