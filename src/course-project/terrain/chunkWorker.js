import { generateTerrain } from './sceneObject';  // Import the terrain generation function

self.onmessage = async function(event) {
    const { type, chunkX, chunkZ, chunkSize, terrainScale, octaves, persistence, lacunarity, heightMultiplier } = event.data;

    // Simulate chunk generation logic here (without WebGL context)
    const { vertices, normals, indices } = generateTerrain(
        chunkX * chunkSize,
        chunkZ * chunkSize,
        chunkSize + 1,
        chunkSize + 1,
        terrainScale,
        octaves,
        persistence,
        lacunarity,
        heightMultiplier
    );

    // Send the generated data back to the main thread
    self.postMessage({
        type,
        chunkX,
        chunkZ,
        vertices,
        normals,
        indices
    });
};
