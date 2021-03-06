import { commands, ExtensionContext, listManager, workspace } from 'coc.nvim';

import Switching from './switching';
import * as Cpr from './cpr';
import * as Pmr from './pmr';

export async function activate(context: ExtensionContext): Promise<void> {
    context.subscriptions.push(
        commands.registerCommand('qtk.switching', Switching)
    );

    context.subscriptions.push(
        commands.registerCommand('qtk.cpr.exec', Cpr.exec)
    );

    context.subscriptions.push(
        commands.registerCommand('qtk.cpr.reset', Cpr.reset)
    );

    Cpr.initStatusBar();

    context.subscriptions.push(
        listManager.registerList(new Pmr.PmrList(workspace.nvim))
    );

    context.subscriptions.push(
        commands.registerCommand('qtk.pmr.reset', Pmr.reset)
    );

    Pmr.initStatusBar();
}
