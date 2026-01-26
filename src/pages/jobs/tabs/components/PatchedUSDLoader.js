import {
    FileLoader,
    Loader,
    Group
} from 'three';

import { unzipSync, strFromU8 } from 'fflate';
import { PatchedUSDAParser as USDAParser } from './PatchedUSDAParser.js';

// Inline Stub for USDCParser (Binary USD)
class USDCParser {
    parse(buffer) {
        console.warn("USDCParser (Binary) is not supported in this patched loader.");
        return new Group();
    }
}

/**
 * A loader for the USDZ format.
 * 
 * This is a PATCHED version that uses a local USDAParser to fix specific
 * JSON parsing issues (invalid arrays) found in some USDZ files.
 */
class USDZLoader extends Loader {

    constructor(manager) {
        super(manager);
    }

    load(url, onLoad, onProgress, onError) {
        const scope = this;
        const loader = new FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(scope.requestHeader);
        loader.setWithCredentials(scope.withCredentials);
        loader.load(url, function (text) {
            try {
                onLoad(scope.parse(text));
            } catch (e) {
                if (onError) {
                    onError(e);
                } else {
                    console.error(e);
                }
                scope.manager.itemError(url);
            }
        }, onProgress, onError);
    }

    parse(buffer) {
        const usda = new USDAParser();
        const usdc = new USDCParser();

        function parseAssets(zip) {
            const data = {};
            const loader = new FileLoader();
            loader.setResponseType('arraybuffer');

            for (const filename in zip) {
                if (filename.endsWith('png')) {
                    const blob = new Blob([zip[filename]], { type: 'image/png' });
                    data[filename] = URL.createObjectURL(blob);
                }

                if (filename.endsWith('usd') || filename.endsWith('usda') || filename.endsWith('usdc')) {
                    if (isCrateFile(zip[filename])) {
                        data[filename] = usdc.parse(zip[filename].buffer, data);
                    } else {
                        const text = strFromU8(zip[filename]);
                        data[filename] = usda.parseText(text);
                    }
                }
            }
            return data;
        }

        function isCrateFile(buffer) {
            const crateHeader = new Uint8Array([0x50, 0x58, 0x52, 0x2D, 0x55, 0x53, 0x44, 0x43]); // PXR-USDC
            if (buffer.byteLength < crateHeader.length) return false;
            const view = new Uint8Array(buffer, 0, crateHeader.length);
            for (let i = 0; i < crateHeader.length; i++) {
                if (view[i] !== crateHeader[i]) return false;
            }
            return true;
        }

        function findUSD(zip) {
            if (zip.length < 1) return undefined;
            const firstFileName = Object.keys(zip)[0];
            let isCrate = false;

            if (firstFileName.endsWith('usda')) return zip[firstFileName];
            if (firstFileName.endsWith('usdc')) {
                isCrate = true;
            } else if (firstFileName.endsWith('usd')) {
                if (!isCrateFile(zip[firstFileName])) {
                    return zip[firstFileName];
                } else {
                    isCrate = true;
                }
            }

            if (isCrate) {
                return zip[firstFileName];
            }
        }

        // USDA
        if (typeof buffer === 'string') {
            return usda.parse(buffer, {});
        }

        // USDC
        if (isCrateFile(buffer)) {
            return usdc.parse(buffer);
        }

        // USDZ
        const zip = unzipSync(new Uint8Array(buffer));
        const assets = parseAssets(zip);
        const file = findUSD(zip);
        const text = strFromU8(file);

        return usda.parse(text, assets);
    }

}

export { USDZLoader };
