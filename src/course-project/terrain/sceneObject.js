import { mult, translationMatrix, rotationMatrix, scaleMatrix, vec3 } from 'mv-redux';
// import the noise functions you need
import { createNoise2D } from 'simplex-noise';


/**
 * @typedef ShapeOptions Configuration options for constructing a new shape.
 * @property {import('mv-redux').Vec3} [position]
 * @property {import('mv-redux').Vec3} [scale]
 * @property {import('mv-redux').Vec3} [rotation]
 */

/**
 * A class that wraps the properties of a 3D shape.
 */
export class SceneObject {
    position;
    rotation;
    scale;

    /**
     * @param {ShapeOptions} [options] Initial parameters for position, rotation, and scale.
     */
    constructor(options = {}) {
        this.position = options?.position ?? vec3(0, 0, 0);
        this.rotation = options?.rotation ?? vec3(0, 0, 0);
        this.scale = options?.scale ?? vec3(1, 1, 1);
    }

    /**
     * Computes this shape's current transformation matrix.
     * @returns {import('mv-redux').Mat4}
     */
    getModelMatrix() {
        const sMat = scaleMatrix(this.scale);
        const tMat = translationMatrix(this.position);

        const rMatX = rotationMatrix('x', this.rotation.x);
        const rMatY = rotationMatrix('y', this.rotation.y);
        const rMatZ = rotationMatrix('z', this.rotation.z);
        const rMat = mult(mult(rMatZ, rMatY), rMatX);

        return mult(mult(tMat, rMat), sMat);
    }

    ProgramSetUp(){

    }

    Render(){

    }
}





// tried to manually implement a perlin noise function but ran 
// into to many problems later on, thats why it isn't used anymore
function perlinNoise(x, y, seed = 0) {
    const p = [];
    for (let i = 0; i < 512; i++) p[i] = Math.floor(Math.random() * 256);
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    return lerp(v, lerp(u, grad(p[a], xf, yf), grad(p[b], xf - 1, yf)), 
                   lerp(u, grad(p[a + 1], xf, yf - 1), grad(p[b + 1], xf - 1, yf - 1)));
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
    return a + t * (b - a);
}

function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

// curve function, flattening near the bottom
function applyHeightCurve(noiseHeight, heightMult) {
    const threshold = -3 * heightMult;
    if (noiseHeight < threshold) {
        return -3 * heightMult;
    } else {
        return noiseHeight;
    }
}

// ended up using simplex-noise library instead
// run:     npm i -S simplex-noise
// to install simplex-noise
const noise = createNoise2D();

export function generateTerrain(terrainX, terrainZ, length, width, scale, octaves, persistance, lacunarity, heightMultiplier) {
    const vertices = [];
    const normals = [];
    const indices = [];

    // the center of the terrain (half of the width and height)
    const centerX = length / 2;
    const centerZ = width / 2;
    
    for (let x = terrainX; x < terrainX + length; x++) {
        for (let z = terrainZ; z < terrainZ + width; z++) {
            
            let amp = 1;
            let freq = 1;
            let noiseHeight = 0;
            let LN = 0;
            let RN = 0;
            let TN = 0;
            let BN = 0;

            for (let i = 0; i < octaves; i++) {
                const scaledX = x * scale * freq;
                const scaledZ = z * scale * freq;

                const octave = noise(scaledX, scaledZ) * 2 - 1;
                noiseHeight += octave * amp;

                // calculate left right top bottom normals for lighting
                const left = noise((x - 1) * scale * freq, scaledZ) * 2 - 1;
                LN += left * amp;
                const right = noise((x + 1) * scale * freq, scaledZ) * 2 - 1;
                RN += right * amp;
                const top = noise(scaledX, (z - 1) * scale * freq) * 2 - 1;
                TN += top * amp;
                const bottom = noise(scaledX, (z - 1) * scale * freq) * 2 - 1;
                BN += bottom * amp;

                amp *= persistance;
                freq *= lacunarity;
            }

            // Shift the terrain to center it at (0, 0, 0)
            const centeredX = x - centerX;
            const centeredZ = z - centerZ;
            
            const noiseMultiplied = noiseHeight * heightMultiplier
            const noiseHeightCurved = applyHeightCurve(noiseMultiplied, heightMultiplier);
            
            vertices.push(centeredX, noiseHeightCurved, centeredZ); // VerticesXYZ

            // apply the heightMultiplier for the normals as well
            const leftMult = LN * heightMultiplier;
            const rightMult = RN * heightMultiplier;
            const topMult = TN * heightMultiplier;
            const bottomMult = BN * heightMultiplier;
            // apply the height curve for the normals too
            const leftCurved = applyHeightCurve(leftMult, heightMultiplier);
            const rightCurved = applyHeightCurve(rightMult, heightMultiplier);
            const topCurved = applyHeightCurve(topMult, heightMultiplier);
            const bottomCurved = applyHeightCurve(bottomMult, heightMultiplier);

            // calculate normal for lighting
            const normal = vec3(
                leftCurved - rightCurved,
                2.0,
                topCurved - bottomCurved
            );

            for (let i = 0; i < normal.length; i++) {
                normals.push(normal[i]);
            }

            // indices for creating triangles
            if (x < terrainX + length - 1 && z < terrainZ + width - 1) {
                const i = (x - terrainX) + (z - terrainZ) * length;
                indices.push(i, i + 1, i + length);
                indices.push(i + 1, i + length + 1, i + length);
            }
            
        }
    }
    let taken = vertices.filter((_, index) => index % 3 === 0);
    let result = [
        taken[0 * length + 0] + centerX,       // value at (0, 0)
        taken[0 * length + 99] + centerX,     // value at (0, 100)
        taken[99 * length + 0] + centerX,     // value at (100, 0)
        taken[99 * length + 99] + centerX    // value at (100, 100)
    ];
    // console.log(
    //     result
    // )
    return { vertices, normals, indices };

}