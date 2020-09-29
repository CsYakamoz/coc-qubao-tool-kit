interface Base {
    id: string;
    remoteAddr: string;
    remoteUser: string;
}

interface CprBase extends Base {
    remoteDir: string;
}

interface CprFolderConfig {
    source?: string;
    targetId: string;
    list: CprBase[];
}

interface CprSetting {
    [key: string]: CprFolderConfig;
}

interface PmrCustomCommand {
    id: string;
    list: string;
    restart: string;
}

interface PmrBase extends Base {
    regex?: string;
    commandList?: PmrCustomCommand[];
}

interface PmrSetting {
    targetId: string;
    list: PmrBase[];
}
