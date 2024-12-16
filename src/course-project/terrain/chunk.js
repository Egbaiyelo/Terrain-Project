import { normalMatrix } from "mv-redux";
import { generateTerrain, SceneObject } from "./sceneObject";
// import { chunkWorker } from "./webworkers/chunkWorker"

// World renderer from archive but uses webworker
export class ChunkWorks{

    constructor(gl, renderDistance, camera, chunkSize){
        this.gl = gl;
        this.renderDistance = renderDistance; // - must be greter than 0
        this.camera = camera;
        this.chunkSize = chunkSize; // - must be greater than 10

        this.preloadDistance = this.renderDistance + 2; // - must be greater than render

        this.terrainScale = 0.01;
        this.octaves = 7;
        this.persistence = 0.5;
        this.lacunarity = 2;
        this.heightMultiplier = 1;


        this.renderChunks = new Map();
        this.loadedChunks = new Map();
        this.loadingQueue = new Map();
        // this.waterChunks = new Map();
                
        this.worker = new Worker(new URL('./chunkWorker.js', import.meta.url), {type: "module"}); 
        this.worker.onmessage = this.handleWorkerMessage.bind(this); // Handle messages from the worker
        this.workerTasks = new Set(); // To track ongoing worker tasks
    }

    
    // Load chunks and load to render array
    loadChunk(position) {
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkZ = Math.floor(position.z / this.chunkSize);
        console.log(chunkX, chunkZ)

        console.time('Load Chunk construction'); 

        const batch = []; // Array to store chunk data for batch processing
        const logger = [];
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

        for (let x = -this.preloadDistance; x <= this.preloadDistance; x++) {
            for (let z = -this.preloadDistance; z <= this.preloadDistance; z++) {

                // console.log("$$$$$ this is x an y", x, z)
                
                // Calculate the distance from the player's chunk to the surrounding chunk (use relative positions)
                // const distance = Math.sqrt(Math.pow(relX - chunkX, 2) + Math.pow(relZ - chunkZ, 2));
                
                let distance = Math.sqrt((x * x) + (z * z)); // Use a circle to limit distance?
                
                let key = `${chunkX + x},${chunkZ + z}`;
                console.log("distance and key", distance, key, x, z)

                // if (distance <= this.preloadDistance) {
                if (!this.loadedChunks.has(key) && !this.loadingQueue.has(key)) {
                    // Add chunk to batch for loading
                    // console.log("################ adding load")
                    batch.push({ type: 'load', chunkX: chunkX + x, chunkZ: chunkZ + z });
                }

                // Math.abs(chunkX - x) <= this.renderDistance || Math.abs(chunkZ - z) <= this.renderDistance
                // if (distance <= this.renderDistance) {
                if (Math.abs(x) <= this.renderDistance || Math.abs(z) <= this.renderDistance){
                    // console.log("#############rendering", key)
                    console.log("yes <= 2")
                    if (!this.renderChunks.has(key)) {
                        // If not in render chunks, add to batch for processing
                        if (this.loadedChunks.has(key)) {
                            // console.log("loaded had it")
                            console.log("had it")
                            this.renderChunks.set(key, this.loadedChunks.get(key));
                        } else {
                            // console.log("i had to get it")
                            batch.push({ type: 'render', chunkX: chunkX + x, chunkZ: chunkZ + z });
                        }
                    }
                } else { logger.push("notrender")}

                // }
            }
        }

        // Send the collected batch to the worker for processing
        this.requestBatch(batch);
        // console.log(logger)
        // this.printChunkGrid(position.x, position.z, this.chunkSize, logger)

        console.timeEnd('Load Chunk construction'); // End timing and print result
        console.log(this.renderChunks)
    }

    printChunkGrid(playerX, playerZ, chunkSize, logger) {
        // Calculate player's chunk position
        const playerChunkX = Math.floor(playerX / chunkSize);
        const playerChunkZ = Math.floor(playerZ / chunkSize);
    
        // Log player's position and chunk position
        console.log(`Player Position: (${playerX}, ${playerZ})`);
        console.log(`Player Chunk: (${playerChunkX}, ${playerChunkZ})`);
        console.log("");  // Add a newline for spacing
    
        // Create and print the grid
        for (let x = -this.preloadDistance; x <= this.preloadDistance; x++) {
            let row = "";
            let log = ""
            
            for (let z = -this.preloadDistance; z <= this.preloadDistance; z++) {
                const chunkX = playerChunkX + x;
                const chunkZ = playerChunkZ + z;
    
                // Build chunk coordinates string
                const chunkCoord = `(${chunkX}, ${chunkZ})`;
    
                // Add the chunk coordinates to the row with padding
                row += chunkCoord.padEnd(15, ' '); // Adjust padding size to fit your needs
            }
    
            // Log each row of chunks, one at a time
            console.log(row);
    
            // Add spacing between rows
            // console.log("");  // New line after each row

            for (let z = -this.preloadDistance; z <= this.preloadDistance; z++) {    
                // Add the chunk coordinates to the row with padding
                log += logger[x * 11 + z]; // Adjust padding size to fit your needs
                log += "         "
            }
            console.log(log)
        }
    
        // Log end of printout
        console.log("--- End of Grid ---");
    }
    

    unloadChunk(position){
        console.log(position)
        // console.log(position.x / this)
        const posX = Math.floor(position.x / this.chunkSize);
        const posZ = Math.floor(position.z / this.chunkSize);
        console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!player at (${posX}, ${posZ})`)

        // Unload from both renderChunks and loadedChunks
        this.loadedChunks.forEach((chunk, key) => {
            const [chunkX, chunkZ] = key.split(',').map(Number);

            const distance = Math.sqrt(Math.pow(chunkX - posX, 2) + Math.pow(chunkZ - posZ, 2));

            // console.log("lets check", chunkX, chunkZ, posX, posZ)
            // Check if the chunk is outside preloadDistance //? we could even delay removing it // Notice this one is square

            // Math.abs(chunkX - posX) > this.preloadDistance || Math.abs(chunkZ - posZ) > this.preloadDistance
            if (distance > this.preloadDistance) {
                this.loadedChunks.delete(key); // Remove from loaded chunks
                // console.log(`Unloaded chunk at (${chunkX}, ${chunkZ}), player at (${posX}, ${posZ})`);
            }
            // Math.abs(chunkX - posX) > this.renderDistance || Math.abs(chunkZ - posZ) > this.renderDistance
            // Remove from render chunks
            if (this.renderChunks.has(key)){
                if (distance > this.renderDistance) {
                    this.renderChunks.delete(key);
                    // console.log(`Unrendered chunk at (${chunkX}, ${chunkZ}), player at (${posX}, ${posZ})`);
                }
            }
        });
    }

    updateLocation(position){
        // console.log(position)
        this.unloadChunk(position);
        this.loadChunk(position);
    }

    // Send batch of chunks to worker for processing
    async requestBatch(batch) {
        // Add all tasks to the worker task tracker to keep track of them
        batch.forEach(task => this.workerTasks.add(`${task.chunkX},${task.chunkZ}`));

        batch.forEach(({ type, chunkX, chunkZ }) => {
            this.worker.postMessage({
                type,
                chunkX,
                chunkZ,
                chunkSize: this.chunkSize,
                terrainScale: this.terrainScale,
                octaves: this.octaves,
                persistence: this.persistence,
                lacunarity: this.lacunarity,
                heightMultiplier: this.heightMultiplier
            });
        });
    }

    handleWorkerMessage(event) {
        const { type, chunkX, chunkZ, vertices, normals, indices } = event.data;
        const key = `${chunkX},${chunkZ}`;
    
        // Once chunk is loaded, create the buffers and store the chunk
        const chunk = new Chunk(
            this.gl,
            chunkX * this.chunkSize,
            chunkZ * this.chunkSize,
            this.chunkSize,
            this.terrainScale,
            this.octaves,
            this.persistence,
            this.lacunarity,
            this.heightMultiplier,
            { vertices, normals, indices }
        );
        this.loadedChunks.set(key, chunk);
        // this.waterChunks.set(key, new WaterChunk(this.gl, chunkX, chunkZ, this.chunkSize, chunk))

        // if (type === 'render') {
            // For rendering, add to renderChunks
            this.renderChunks.set(key, chunk);
        // }
    
        // Remove the task from the task tracker
        this.workerTasks.delete(key);
    }

    render(uModelLocation, uNormalMatrix){
        // console.log(this.renderChunks)
        this.loadedChunks.forEach(chunk => {
            chunk.render(this.gl, uModelLocation, uNormalMatrix);
        })
        // this.waterChunks.forEach(chunk => {
        //     chunk.render(this.gl, uModelLocation, uNormalMatrix);
        // })
    }
}

export class Chunk extends SceneObject{

    constructor(gl, chunkX, chunkZ, chunkSize, terrainScale, octaves, persistence, lacunarity, heightMultiplier, chunkData = {}){
        super()

        this.gl = gl;
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.chunkSize = chunkSize;


        this.terrainScale = terrainScale;
        this.octaves = octaves;
        this.persistence = persistence;
        this.lacunarity = lacunarity;
        this.heightMultiplier = heightMultiplier;

        this.toRender = false;

        // If options include data (vertices, normals, indices), use it; otherwise, generate terrain
        if (chunkData.vertices && chunkData.normals && chunkData.indices) {
            this.vertices = new Float32Array(chunkData.vertices);
            this.normals = new Float32Array(chunkData.normals);
            this.indices = new Uint16Array(chunkData.indices);
            console.log("----------------------------------------------")
        } else {
            // If no pre-generated data, generate terrain using the provided params
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

            this.vertices = new Float32Array(vertices);
            this.normals = new Float32Array(normals);
            this.indices = new Uint16Array(indices);
        }
        
        this.ProgramSetUp(gl);
    }

    // Bind the buffers
    ProgramSetUp(gl){

        // Bind buffers and vertex attributes

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    // Rebind the buffers and all
    UpdateBuffers(){

    }

    // Render the chunk
    render(gl, uModelLocation, uNormalMatrix){

        // Rebind
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        const modelMatrix = this.getModelMatrix();
        gl.uniformMatrix4fv(uModelLocation, false, modelMatrix.flat());
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix(modelMatrix, true).flat());
    
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

export class Frustrum{
    
}


export class WaterChunk extends SceneObject{
    constructor(gl, chunkX, chunkZ, chunkSize, chunk){
        super()

        this.gl = gl;
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.chunkSize = chunkSize;
        this.chunk = chunk;

        this.seaLevel = -9.0  //- Remove lster


        // this.vertices = [];
        // this.colors = [];
        // this.indices = [];

        // Generate the vertices, colors, and indices
        this.generateWaterGeometry();
        this.ProgramSetUp(gl);


    }

    get map(){
        const mapArray = [];
        const data = [];

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {

                const vertex = this.chunk[x + z * this.chunkSize];

                // Check the height (y value) of the vertex
                const height = vertex.y;

                // Check if it's above or below sea level
                if (height > this.seaLevel) {
                    // If above sea level, it's land (black)
                    mapArray.push({ x, z, color: [0, 0, 0] });
                    data.push(1);
                } else {
                    // If below sea level, it's water (grey, darker as it's deeper)
                    const depth = this.seaLevel - height; // The deeper, the larger the value
                    const greyIntensity = Math.min(1.0, depth / 10); // Adjust '10' to scale depth (distance from sea level)
                    mapArray.push({ x, z, color: [greyIntensity, greyIntensity, greyIntensity] });
                    data.push(greyIntensity)
                }
            }
        }

        return mapArray;  // Return the map array with colors for each vertex
    }

    // Generate the geometry for the water chunk
    generateWaterGeometry() {
        const vertices = [];
        const colors = [];
        const indices = [];
        let index = 0;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                console.log(this.chunk)
                const vertex = this.chunk.vertices[x + z * this.chunkSize];
                const height = vertex.y;

                // Add the vertex position to the vertices array
                vertices.push(vertex.x, height, vertex.z);

                // Calculate color based on the height
                if (height > this.seaLevel) {
                    // Land (black)
                    colors.push(0, 0, 0);
                } else {
                    // Water (shades of grey based on depth)
                    const depth = this.seaLevel - height;
                    const greyIntensity = Math.min(1.0, depth / 10); // Adjust depth scaling here
                    colors.push(greyIntensity, greyIntensity, greyIntensity);
                }

                // Add indices for the water mesh grid (two triangles per square)
                if (x < this.chunkSize - 1 && z < this.chunkSize - 1) {
                    // Two triangles for each square in the grid
                    indices.push(index, index + 1, index + this.chunkSize);
                    indices.push(index + 1, index + this.chunkSize + 1, index + this.chunkSize);
                }

                index++;
            }
        }

        this.vertices = new Float32Array(vertices);
        this.colors = new Float32Array(colors);
        this.indices = new Uint16Array(indices);
    }









    // Set up buffers for rendering
    ProgramSetUp(gl) {
        // Vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // Color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    // Render the water chunk
    render(gl, uModelLocation, uNormalMatrix) {
        // Rebind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Set the model matrix
        const modelMatrix = this.getModelMatrix();
        gl.uniformMatrix4fv(uModelLocation, false, modelMatrix.flat());
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix(modelMatrix, true).flat());

        // Draw the water mesh
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }


}
