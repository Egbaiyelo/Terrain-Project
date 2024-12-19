import { createNoise2D } from 'simplex-noise';
import { vec3 } from 'mv-redux';


// curve function, flattening near the bottom
function applyHeightCurve(noiseHeight, heightMult) {
    noiseHeight = noiseHeight + 1.5
    const threshold = -1.9; // sea level
    const threshold2 = 0; // mountain level?
    if (noiseHeight <= threshold) {
        // const distance = noiseHeight - threshold
        // const scaleFactor = (-distance) / ((-distance) + 5);
        // return threshold + noiseHeight * (heightMult * scaleFactor);
        return threshold;
    } else if ( noiseHeight >= threshold2) {
        const distance = noiseHeight - threshold2; // distance between the threshold and the height
        const scaleFactor = distance / (distance + 4); // Scales between 0 and 1 as distance increases
        return threshold2 + noiseHeight * (1.2 + scaleFactor * heightMult); // Gradually applies heightMult
    } else {
        return noiseHeight;
    }
}

// ended up using simplex-noise library instead
// run:     npm i -S simplex-noise
// to install simplex-noise
const noise = createNoise2D();

export function generateTerrain(length, width, scale, octaves, persistance, lacunarity, heightMultiplier) {
    const vertices = [];
    const normals = [];
    const indices = [];

    // the center of the terrain (half of the width and height)
    const centerX = length / 2;
    const centerZ = width / 2;
    
    for (let x = 0; x < length; x++) {
        for (let z = 0; z < width; z++) {
            
            let amp = 2.1;
            let freq = 1;
            let noiseHeight = 0;
            let LN = 0;
            let RN = 0;
            let TN = 0;
            let BN = 0;

            for (let i = 0; i < octaves; i++) {
                const scaledX = x / scale * freq;
                const scaledZ = z / scale * freq;

                const octave = noise(scaledX, scaledZ) * 2 - 1;
                noiseHeight += octave * amp;

                // calculate left right top bottom normals for lighting
                const left = noise((x - 1) / scale * freq, scaledZ) * 2 - 1;
                LN += left * amp;
                const right = noise((x + 1) / scale * freq, scaledZ) * 2 - 1;
                RN += right * amp;
                const top = noise(scaledX, (z - 1) / scale * freq) * 2 - 1;
                TN += top * amp;
                const bottom = noise(scaledX, (z - 1) / scale * freq) * 2 - 1;
                BN += bottom * amp;

                amp *= persistance;
                freq *= lacunarity;
            }

            // Shift the terrain to center it at (0, 0, 0)
            const terrainX = x - centerX;
            const terrainZ = z - centerZ;

            const noiseMultiplied = noiseHeight;
            const noiseHeightCurved = applyHeightCurve(noiseMultiplied, heightMultiplier);

            vertices.push(terrainX, noiseHeightCurved, terrainZ); // vertex (x, y, z)

            // apply the heightMultiplier for the normals as well
            const leftMult = LN;
            const rightMult = RN;
            const topMult = TN;
            const bottomMult = BN;
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
            if (x < width - 1 && z < width - 1) {
                const i = x + z * length;
                indices.push(i, i + 1, i + length);
                indices.push(i + 1, i + width + 1, i + length);
            }
        }
    }
    return { vertices, normals, indices };
}