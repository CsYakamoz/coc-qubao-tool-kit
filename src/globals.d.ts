interface Base {
    id: string;
    remoteAddr: string;
    remoteUser: string;
}

interface CprBase extends Base {
    remoteDir: string;
}

interface CprFolderConfig {
    targetId: string;
    list: CprBase[];
}

interface CprSetting {
    [key: string]: CprFolderConfig;
}

interface PmrBase extends Base {
    regex?: string;
}

interface PmrSetting {
    targetId: string;
    list: PmrBase[];
}
