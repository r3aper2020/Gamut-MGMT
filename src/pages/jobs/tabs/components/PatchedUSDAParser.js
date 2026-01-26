import {
    BufferAttribute,
    BufferGeometry,
    ClampToEdgeWrapping,
    Group,
    Mesh,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    MirroredRepeatWrapping,
    RepeatWrapping,
    SRGBColorSpace,
    TextureLoader,
    Object3D,
    Vector2,
    Matrix4,
    Quaternion,
    Vector3,
    DoubleSide
} from 'three';

class PatchedUSDAParser {

    parseText(text) {

        const root = {};

        const lines = text.split('\n');

        let string = null;
        let target = root;

        const stack = [root];

        // Parse USDA file
        let arrayMode = false;
        let arrayAccumulator = "";
        let arrayKey = "";

        for (const line of lines) {

            // Handle multi-line arrays
            if (arrayMode) {
                arrayAccumulator += line + " ";
                if (line.trim().endsWith(']')) {
                    arrayMode = false;
                    target[arrayKey] = arrayAccumulator;
                }
                continue;
            }

            if (line.includes('=')) {

                const assignment = line.split('=');

                const lhs = assignment[0].trim();
                const rhs = assignment[1].trim();

                if (rhs.endsWith('{')) {

                    const group = {};
                    stack.push(group);

                    target[lhs] = group;
                    target = group;

                } else if (rhs.endsWith('(')) {

                    // see #28631

                    const values = rhs.slice(0, - 1);
                    target[lhs] = values;

                    const meta = {};
                    stack.push(meta);

                    target = meta;

                } else if (rhs.endsWith('[') && !rhs.includes(']')) {
                    // Start of multi-line array
                    arrayMode = true;
                    arrayKey = lhs;
                    arrayAccumulator = rhs + " ";
                } else {

                    target[lhs] = rhs;

                }

            } else if (line.endsWith('{')) {

                const group = target[string] || {};
                stack.push(group);

                target[string] = group;
                target = group;

            } else if (line.endsWith('}')) {

                stack.pop();

                if (stack.length === 0) continue;

                target = stack[stack.length - 1];

            } else if (line.endsWith('(')) {

                const meta = {};
                stack.push(meta);

                string = line.split('(')[0].trim() || string;

                target[string] = meta;
                target = meta;

            } else if (line.endsWith(')')) {

                stack.pop();

                target = stack[stack.length - 1];

            } else {

                string = line.trim();

            }

        }

        return root;

    }

    parse(text, assets) {

        const root = this.parseText(text);

        // Helper: Robustly parse arrays that might be JSON or space-separated
        function parseUSDArray(raw) {
            if (!raw) return [];
            // Clean up parens/brackets first if common
            let clean = raw.replace(/[()\[\]]/g, '').trim();
            if (clean.length === 0) return [];

            // Try JSON first if it looks like it (has commas)
            if (raw.includes(',')) {
                try {
                    // Try wrapping in brackets if missing
                    let jsonStr = raw;
                    if (!jsonStr.startsWith('[')) jsonStr = '[' + jsonStr + ']';
                    // Handle ( ... ) by removal
                    jsonStr = jsonStr.replace(/[()]/g, '');
                    return JSON.parse(jsonStr);
                } catch (e) {
                    // ignore and fall through
                }
            }

            // Space separated fallback
            return clean.split(/[\s,]+/).map(Number);
        }

        // Build scene graph

        function findMeshGeometry(data) {
            if (!data) return undefined;
            // PATCH: Disable greedy search.
            return findGeometry(data);
        }

        function findGeometry(data, id) {
            if (!data) return undefined;
            if (id !== undefined) {
                const def = `def Mesh "${id}"`;
                if (def in data) {
                    return data[def];
                }
            }

            for (const name in data) {
                const object = data[name];
                if (name.startsWith('def Mesh')) {
                    return object;
                }

                if (typeof object === 'object') {
                    const geometry = findGeometry(object);
                    if (geometry) return geometry;
                }
            }
        }

        function buildGeometry(data) {
            if (!data) return undefined;

            const geometry = new BufferGeometry();
            let indices = null;
            let counts = null;
            let uvs = null;

            let positionsLength = - 1;

            // index
            if ('int[] faceVertexIndices' in data) {
                indices = parseUSDArray(data['int[] faceVertexIndices']);
            }

            // face count
            if ('int[] faceVertexCounts' in data) {
                counts = parseUSDArray(data['int[] faceVertexCounts']);
                indices = toTriangleIndices(indices, counts);
            }

            // position
            if ('point3f[] points' in data) {
                const positions = parseUSDArray(data['point3f[] points']);
                positionsLength = positions.length;
                let attribute = new BufferAttribute(new Float32Array(positions), 3);

                if (indices !== null) attribute = toFlatBufferAttribute(attribute, indices);
                geometry.setAttribute('position', attribute);
            }

            // uv
            if ('float2[] primvars:st' in data) {
                data['texCoord2f[] primvars:st'] = data['float2[] primvars:st'];
            }

            if ('texCoord2f[] primvars:st' in data) {
                uvs = parseUSDArray(data['texCoord2f[] primvars:st']);
                let attribute = new BufferAttribute(new Float32Array(uvs), 2);
                if (indices !== null) attribute = toFlatBufferAttribute(attribute, indices);
                geometry.setAttribute('uv', attribute);
            }

            if ('int[] primvars:st:indices' in data && uvs !== null) {
                // custom uv index, overwrite uvs with new data
                const attribute = new BufferAttribute(new Float32Array(uvs), 2);
                let indicesUV = parseUSDArray(data['int[] primvars:st:indices']);

                indicesUV = toTriangleIndices(indicesUV, counts);
                geometry.setAttribute('uv', toFlatBufferAttribute(attribute, indicesUV));
            }

            // normal
            if ('normal3f[] normals' in data) {
                const normals = parseUSDArray(data['normal3f[] normals']);
                let attribute = new BufferAttribute(new Float32Array(normals), 3);

                // normals require a special treatment in USD
                if (normals.length === positionsLength) {
                    // raw normal and position data have equal length (like produced by USDZExporter)
                    if (indices !== null) attribute = toFlatBufferAttribute(attribute, indices);
                } else {
                    // unequal length, normals are independent of faceVertexIndices
                    let indices = Array.from(Array(normals.length / 3).keys()); // [ 0, 1, 2, 3 ... ]
                    indices = toTriangleIndices(indices, counts);
                    attribute = toFlatBufferAttribute(attribute, indices);
                }
                geometry.setAttribute('normal', attribute);
            } else {
                // compute flat vertex normals
                geometry.computeVertexNormals();
            }

            return geometry;
        }

        function toTriangleIndices(rawIndices, counts) {
            const indices = [];

            for (let i = 0; i < counts.length; i++) {
                const count = counts[i];
                const stride = i * count;

                if (count === 3) {
                    const a = rawIndices[stride + 0];
                    const b = rawIndices[stride + 1];
                    const c = rawIndices[stride + 2];
                    indices.push(a, b, c);
                } else if (count === 4) {
                    const a = rawIndices[stride + 0];
                    const b = rawIndices[stride + 1];
                    const c = rawIndices[stride + 2];
                    const d = rawIndices[stride + 3];
                    indices.push(a, b, c);
                    indices.push(a, c, d);
                } else {
                    console.warn('THREE.USDZLoader: Face vertex count of %s unsupported.', count);
                }
            }
            return indices;
        }

        function toFlatBufferAttribute(attribute, indices) {
            const array = attribute.array;
            const itemSize = attribute.itemSize;
            const array2 = new array.constructor(indices.length * itemSize);

            let index = 0, index2 = 0;
            for (let i = 0, l = indices.length; i < l; i++) {
                index = indices[i] * itemSize;
                for (let j = 0; j < itemSize; j++) {
                    array2[index2++] = array[index++];
                }
            }
            return new BufferAttribute(array2, itemSize);
        }

        function findMeshMaterial(data) {
            if (!data) return undefined;
            if ('rel material:binding' in data) {
                const reference = data['rel material:binding'];
                const id = reference.replace(/^<\//, '').replace(/>$/, '');
                const parts = id.split('/');

                return findMaterial(root, ` "${parts[1]}"`);
            }
            return findMaterial(data);
        }

        function findMaterial(data, id = '') {
            for (const name in data) {
                const object = data[name];
                if (name.startsWith('def Material' + id)) {
                    return object;
                }
                if (typeof object === 'object') {
                    const material = findMaterial(object, id);
                    if (material) return material;
                }
            }
        }

        function setTextureParams(map, data_value) {
            // rotation, scale and translation
            if (data_value['float inputs:rotation']) {
                map.rotation = parseFloat(data_value['float inputs:rotation']);
            }
            if (data_value['float2 inputs:scale']) {
                map.repeat = new Vector2().fromArray(parseUSDArray(data_value['float2 inputs:scale']));
            }
            if (data_value['float2 inputs:translation']) {
                map.offset = new Vector2().fromArray(parseUSDArray(data_value['float2 inputs:translation']));
            }
        }

        function buildMaterial(data) {
            let material = new MeshPhysicalMaterial();

            if (data !== undefined) {
                let surface = undefined;
                const surfaceConnection = data['token outputs:surface.connect'];

                if (surfaceConnection) {
                    const match = /(\w+)\.output/.exec(surfaceConnection);
                    if (match) {
                        const surfaceName = match[1];
                        surface = data[`def Shader "${surfaceName}"`];
                    }
                }

                if (surface !== undefined) {

                    // PATCH: Detect Opening using opacity
                    if ('float inputs:opacity' in surface) {
                        const opacity = parseFloat(surface['float inputs:opacity']);
                        if (opacity < 0.05) {
                            material.userData.isOpening = true;
                        }
                    }

                    // Normal Material Logic
                    if ('color3f inputs:diffuseColor.connect' in surface) {
                        const path = surface['color3f inputs:diffuseColor.connect'];
                        const sampler = findTexture(root, /(\w+).output/.exec(path)[1]);
                        material.map = buildTexture(sampler);
                        material.map.colorSpace = SRGBColorSpace;
                        if ('def Shader "Transform2d_diffuse"' in data) {
                            setTextureParams(material.map, data['def Shader "Transform2d_diffuse"']);
                        }
                    } else if ('color3f inputs:diffuseColor' in surface) {
                        material.color.fromArray(parseUSDArray(surface['color3f inputs:diffuseColor']));
                    }

                    // PATCH: Fix black walls -> White/Grey
                    if (material.color.r === 0 && material.color.g === 0 && material.color.b === 0) {
                        material.color.setHex(0xEEEEEE);
                        material.side = DoubleSide;
                    }

                    if ('color3f inputs:emissiveColor.connect' in surface) {
                        // ...
                    } else if ('color3f inputs:emissiveColor' in surface) {
                        material.emissive.fromArray(parseUSDArray(surface['color3f inputs:emissiveColor']));
                    }
                }
            }
            return material;
        }

        function findTexture(data, id) {
            for (const name in data) {
                const object = data[name];
                if (name.startsWith(`def Shader "${id}"`)) {
                    return object;
                }
                if (typeof object === 'object') {
                    const texture = findTexture(object, id);
                    if (texture) return texture;
                }
            }
        }

        function buildTexture(data) {
            if ('asset inputs:file' in data) {
                const path = data['asset inputs:file'].replace(/@*/g, '').trim();
                const loader = new TextureLoader();
                const texture = loader.load(assets[path]);
                const map = {
                    '"clamp"': ClampToEdgeWrapping,
                    '"mirror"': MirroredRepeatWrapping,
                    '"repeat"': RepeatWrapping
                };
                if ('token inputs:wrapS' in data) {
                    texture.wrapS = map[data['token inputs:wrapS']];
                }
                if ('token inputs:wrapT' in data) {
                    texture.wrapT = map[data['token inputs:wrapT']];
                }
                return texture;
            }
            return null;
        }

        function applyTransforms(object, data) {

            // 1. Explicit Matrix
            if ('matrix4d xformOp:transform' in data) {
                const array = parseUSDArray(data['matrix4d xformOp:transform']);
                // NO TRANSPOSE
                if (array.length === 16) {
                    object.matrix.fromArray(array);
                    object.matrix.decompose(object.position, object.quaternion, object.scale);
                }
                return;
            }

            // 2. Component Transforms
            let translation = new Vector3(0, 0, 0);
            let rotation = new Quaternion();
            let scale = new Vector3(1, 1, 1);
            let pivot = new Vector3(0, 0, 0);

            // Translation
            if ('double3 xformOp:translate' in data) translation.fromArray(parseUSDArray(data['double3 xformOp:translate']));
            else if ('float3 xformOp:translate' in data) translation.fromArray(parseUSDArray(data['float3 xformOp:translate']));

            // Rotation (XYZ commonly used)
            if ('double3 xformOp:rotateXYZ' in data) {
                const rot = parseUSDArray(data['double3 xformOp:rotateXYZ']);
                const deg2rad = Math.PI / 180.0;
                // create euler and set quat
                const euler = new Object3D(); // dummy for easy euler
                euler.rotation.set(rot[0] * deg2rad, rot[1] * deg2rad, rot[2] * deg2rad, 'XYZ');
                rotation.copy(euler.quaternion);
            } else if ('float3 xformOp:rotateXYZ' in data) {
                const rot = parseUSDArray(data['float3 xformOp:rotateXYZ']);
                const deg2rad = Math.PI / 180.0;
                const euler = new Object3D();
                euler.rotation.set(rot[0] * deg2rad, rot[1] * deg2rad, rot[2] * deg2rad, 'XYZ');
                rotation.copy(euler.quaternion);
            }

            // Orientation (Quaternions) - Override regular rotation if present
            let orient = null;
            if ('quatf xformOp:orient' in data) orient = parseUSDArray(data['quatf xformOp:orient']);
            else if ('quatd xformOp:orient' in data) orient = parseUSDArray(data['quatd xformOp:orient']);

            if (orient) {
                rotation.set(orient[1], orient[2], orient[3], orient[0]);
            }

            // Scale
            if ('double3 xformOp:scale' in data) scale.fromArray(parseUSDArray(data['double3 xformOp:scale']));
            else if ('float3 xformOp:scale' in data) scale.fromArray(parseUSDArray(data['float3 xformOp:scale']));

            // Pivot
            if ('point3f xformOp:translate:pivot' in data) pivot.fromArray(parseUSDArray(data['point3f xformOp:translate:pivot']));

            // Apply via Matrix Composition: T * P * R * S * -P
            const matT = new Matrix4().makeTranslation(translation.x, translation.y, translation.z);
            const matP = new Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);
            const matR = new Matrix4().makeRotationFromQuaternion(rotation);
            const matS = new Matrix4().makeScale(scale.x, scale.y, scale.z);
            const matInvP = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);

            // Final = T * P * R * S * invP
            const finalMatrix = matT.multiply(matP).multiply(matR).multiply(matS).multiply(matInvP);

            object.matrix = finalMatrix;
            object.matrix.decompose(object.position, object.quaternion, object.scale);
        }

        function buildObject(data) {
            const geometry = buildGeometry(findMeshGeometry(data));
            const material = buildMaterial(findMeshMaterial(data));
            const mesh = geometry ? new Mesh(geometry, material) : new Object3D();
            applyTransforms(mesh, data);
            return mesh;
        }

        // Helper to resolve paths relative to a base path
        function resolvePath(base, relative) {
            // Clean quotes and @ first
            relative = relative.replace(/["'@]/g, '').trim();
            // Handle ./
            if (relative.startsWith('./')) relative = relative.substring(2);
            if (!base) return relative;

            const stack = base.split('/');
            const parts = relative.split('/');

            for (const part of parts) {
                if (part === '.') continue;
                if (part === '..') {
                    if (stack.length > 0) stack.pop();
                } else {
                    stack.push(part);
                }
            }
            return stack.join('/');
        }

        function buildHierarchy(data, group, basePath = '') {

            // PATCH: Expand references (including ARRAYS of references)
            if ('prepend references' in data) {
                const reference = data['prepend references'];
                const content = reference.replace(/[\[\]]/g, '');
                const rawRefs = content.split(',');

                for (const rawRef of rawRefs) {
                    let ref = rawRef.trim();
                    if (!ref) continue;

                    const parts = ref.split('@');
                    let path;
                    if (parts.length > 1) path = parts[1];
                    else path = ref.replace(/["']/g, '');

                    // Clean ./ prefix handled in resolvePath, but we need raw ref for resolve
                    const resolvedPath = resolvePath(basePath, path);

                    if (assets[resolvedPath]) {
                        const assetData = assets[resolvedPath];
                        const lastSlash = resolvedPath.lastIndexOf('/');
                        const newBase = lastSlash > -1 ? resolvedPath.substring(0, lastSlash) : '';
                        buildHierarchy(assetData, group, newBase);
                    }
                }
            }

            for (const name in data) {
                if (name.startsWith('def Scope')) {
                    buildHierarchy(data[name], group, basePath);

                } else if (name.startsWith('def Xform')) {

                    // PATCH: Strict Xform Handling
                    const xform = new Object3D();

                    if (/def Xform "(\w+)"/.test(name)) {
                        xform.name = /def Xform "(\w+)"/.exec(name)[1];

                        // Tag for hierarchy
                        if (xform.name.toLowerCase().includes("door")) xform.userData.isDoor = true;
                        if (xform.name.toLowerCase().includes("window")) xform.userData.isWindow = true;
                    }

                    if (group.userData.isDoor) xform.userData.isDoor = true;
                    if (group.userData.isWindow) xform.userData.isWindow = true;

                    applyTransforms(xform, data[name]);
                    group.add(xform);
                    buildHierarchy(data[name], xform, basePath);

                } else if (name.startsWith('def Mesh')) {
                    // PATCH: Handle direct Mesh children
                    const geometry = buildGeometry(data[name]);
                    let material = buildMaterial(findMeshMaterial(data[name]));

                    const mesh = geometry ? new Mesh(geometry, material) : new Object3D();

                    if (/def Mesh "(\w+)"/.test(name)) {
                        mesh.name = /def Mesh "(\w+)"/.exec(name)[1];
                    }

                    applyTransforms(mesh, data[name]);

                    // PATCH: Categorize Structure vs Clutter
                    const lowerName = mesh.name.toLowerCase();
                    const parentName = group.name ? group.name.toLowerCase() : "";

                    const isStructure =
                        lowerName.includes('wall') || parentName.includes('wall') ||
                        lowerName.includes('floor') || parentName.includes('floor') ||
                        lowerName.includes('ceiling') || parentName.includes('ceiling') ||
                        lowerName.includes('door') || parentName.includes('door') || // Handled by isDoor/isWindow logic too
                        lowerName.includes('window') || parentName.includes('window') ||
                        lowerName.includes('opening') || parentName.includes('opening');

                    mesh.userData.isStructure = isStructure;

                    // PATCH: Force ULTRA TRANSPARENT GLASS for Openings
                    if (material.userData.isOpening || group.userData.isDoor || group.userData.isWindow) {

                        // Tag as Structure explicitly if it was a Door/Window
                        mesh.userData.isStructure = true;

                        // Use STANDARD material (Simple lighting, reliable alpha)
                        material = new MeshStandardMaterial();

                        // WHITE / CLEAR
                        material.color.setHex(0xFFFFFF);

                        material.transparent = true;
                        material.opacity = 0.05;    // 5% Opacity (Extremely Clear)
                        material.roughness = 0.0;   // Perfect Mirror Surface
                        material.metalness = 0.5;   // Metallic sheen
                        material.side = DoubleSide;
                        material.depthWrite = false; // See Through

                        mesh.material = material;

                        // Scale Z slightly to prevent Z-fighting if it matches wall thickness
                        mesh.scale.z = 1.05;
                    }

                    group.add(mesh);
                }
            }
        }

        function buildGroup(data) {
            const group = new Group();
            buildHierarchy(data, group, '');
            return group;
        }

        return buildGroup(root);
    }
}

export { PatchedUSDAParser };
