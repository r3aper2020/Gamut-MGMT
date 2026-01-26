import { Loader, LoadingManager, Group } from 'three';

export class USDZLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
        url: string,
        onLoad: (result: Group) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ): void;
    parse(buffer: ArrayBuffer | string): Group;
}
