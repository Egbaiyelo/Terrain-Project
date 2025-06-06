import { Chunk } from "./chunk";

export class AsyncWorldRenderer{

    constructor(gl, renderDistance, camera, chunkSize){
        this.gl = gl;
        this.renderDistance = renderDistance;
        this.camera = camera;
        this.chunkSize = chunkSize;


        // Just for now
        this.preloadDistance = this.renderDistance + 1;


        this.terrainScale = 0.01;
        this.octaves = 7;
        this.persistence = 0.5;
        this.lacunarity = 2;
        this.heightMultiplier = 3;


        this.renderChunks = new Map();
        this.loadedChunks = new Map();
        this.loadingQueue = new Set(); // Chunks currently being loaded
        this.lastChunk = "";

        this.logno = 0;
        this.log = [];
    }

    // Load chunks from buffer to render array
    async loadChunk(position){
        // console.log("did load")
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkZ = Math.floor(position.z / this.chunkSize);
        
        // console.time('Load Chunk construction'); // Start timing

        const batch = []; // Array to store the promises for async operations


        for (let x = -this.preloadDistance; x <= this.preloadDistance; x++) {
            for (let z = -this.preloadDistance; z <= this.preloadDistance; z++) {
                const distance = Math.sqrt(x * x + z * z); //? use circle??
                const key = `${chunkX + x},${chunkZ + z}`;
                console.log(key)

                if (Math.abs(chunkX - x) <= this.renderDistance && Math.abs(chunkZ - z) <= this.renderDistance){
                    console.log("^^^^^^^^^^^^^^in render distance", key, chunkX, chunkZ)
                    // If already in render chunk
                    if (!this.renderChunks.has(key)){
                        // console.log("render dint have")
    
                        // If not get from buffer
                        if (this.loadedChunks.has(key)) {
                            // console.log("loaded had so gave render")
                            this.renderChunks.set(key, this.loadedChunks.get(key))
                        }
                        else{
                            console.log("what i need", key, )
                            console.log(this.renderChunks)
                            console.log("source", this.loadedChunks, this.loadingQueue)
                            console.log("getting it")
                            this.logno++;

                            // Tell system to load chunk - maybe async to add to render array too when done
                            //? what to do here? //? temp
                            // batch.push({ type: 'render', chunkX: chunkX + x, chunkZ: chunkZ + z });
                            // promises.push(this.renderGetChunk(chunkX + x, chunkZ + z));
                            this.renderGetChunk(chunkX + x, chunkZ + z)
                        }
                    }
                } 
                
                // if (distance <= this.preloadDistance){
                if (Math.abs(chunkX - x) <= this.preloadDistance && Math.abs(chunkZ - z) <= this.preloadDistance){
                    console.log("-------------in the load distance", key, chunkX, chunkZ)
                    // Dont want to process the inner circle with the outer one, one process for each

                    if (!this.loadedChunks.has(key) && !this.loadingQueue.has(key)){
                        // Add chunk to batch for loading
                        // batch.push({ type: 'load', chunkX: chunkX + x, chunkZ: chunkZ + z });

                        // promises.push(this.requestChunk(chunkX + x, chunkZ + z));
                        this.requestChunk(chunkX + x, chunkZ + z)
                    }
                }
            }
        }

        if (this.logno > 0){
            console.log(this.logno);
            this.logno = 0  
        }
        console.log("At the end", this.loadedChunks, this.renderChunks);

        // this.requestBatch(batch);
        // let timef = console.timeEnd('Load Chunk construction'); // End timing and print result

    }

    async requestBatch(batch){
           // Collect promises to process each chunk in the batch asynchronously
        console.time('batch time')
        const promises = batch.map(({ type, chunkX, chunkZ }) => {
            if (type === 'load') {
                return this.requestChunk(chunkX, chunkZ);
            } else if (type === 'render') {
                return this.renderGetChunk(chunkX, chunkZ);
            }
        });
        console.timeEnd('batch time')

        // Wait for all batch processing to complete
        await Promise.all(promises);
    }

    async requestChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.loadingQueue.has(key) || this.loadedChunks.has(key)) return; 
        this.loadingQueue.add(key);
    
        const chunk = await this.packageChunk(chunkX, chunkZ);
        this.loadedChunks.set(key, chunk);
        this.loadingQueue.delete(key);
    }

    // Create the chunk to prep for rendering
    async packageChunk(chunkX, chunkZ) {
        // console.time('Chunk Construction Time'); // Start timing

        return new Promise(resolve => {
            const chunk = new Chunk(
                this.gl, 
                (chunkX) * this.chunkSize,
                (chunkZ) * this.chunkSize,
                this.chunkSize + 1, //? try make it overlap
                this.terrainScale,
                this.octaves,
                this.persistence,
                this.lacunarity,
                this.heightMultiplier
            );
            resolve(chunk);
            // console.timeEnd('Chunk Construction Time'); // End timing and print result

        });
    }

    async renderGetChunk(chunkX, chunkZ){
        const key = `${chunkX},${chunkZ}`;
        if (this.loadingQueue.has(key) || this.loadedChunks.has(key)) return; 
        this.loadingQueue.add(key);
    
        const chunk = await this.packageChunk(chunkX, chunkZ);
        this.loadedChunks.set(key, chunk);
        this.renderChunks.set(key, chunk);
        this.loadingQueue.delete(key);
    }

    unloadChunk(position){
        const posX = Math.floor(position.x / this.chunkSize);
        const posZ = Math.floor(position.z / this.chunkSize);

        // Unload from both renderChunks and loadedChunks
        this.loadedChunks.forEach((chunk, key) => {
            const [chunkX, chunkZ] = key.split(',').map(Number);

            // Check if the chunk is outside preloadDistance //? we could even delay removing it // Notice this one is square
            if (Math.abs(chunkX - posX) > this.preloadDistance || Math.abs(chunkZ - posZ) > this.preloadDistance) {
                this.loadedChunks.delete(key); // Remove from loaded chunks
            }

            // Remove from render chunks
            if (this.renderChunks.has(key)){
                if (Math.abs(chunkX - posX) > this.renderDistance || Math.abs(chunkZ - posZ) > this.renderDistance) {
                    this.renderChunks.delete(key);
                }
            }
        });
    }

    updateLocation(position){
        const posX = Math.floor(position.x / this.chunkSize);
        const posZ = Math.floor(position.z / this.chunkSize);
        const key = `${posX},${posZ}`
        // console.log("called me")

        if (!(this.lastChunk === key)){
            // console.log("implemented me")
            this.loadChunk(position);
            console.log("here we now have", this.loadedChunks, this.renderChunks)
            this.unloadChunk(position);
            this.lastChunk == key;
        }
    }

    render(uModelLocation, uNormalMatrix){
        console.log("at printing, we have", this.loadedChunks, this.renderChunks)
        this.renderChunks.forEach(chunk => {
            chunk.render(this.gl, uModelLocation, uNormalMatrix);
        })
    }

    Initialize(){

    }
}

export class WorldRenderer{

    constructor(gl, renderDistance, camera, chunkSize){
        this.gl = gl;
        this.renderDistance = renderDistance;
        this.camera = camera;
        this.chunkSize = chunkSize;


        this.terrainScale = 0.01;
        this.octaves = 7;
        this.persistence = 0.5;
        this.lacunarity = 2;
        this.heightMultiplier = 3;


        this.chunks = new Map();
        

    }

    
    loadChunk(position){
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkZ = Math.floor(position.z / this.chunkSize);

        console.time('Second Construction Time'); // Start timing


        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                const key = `${chunkX + x},${chunkZ + z}`;
                
                // console.log((chunkX + x) * this.chunkSize, (chunkZ + z) * this.chunkSize);
                if (!this.chunks.has(key)) {
                    console.time('Second chunk creation')
                    const chunk = new Chunk(
                        this.gl, 
                        (chunkX + x) * this.chunkSize,
                        (chunkZ + z) * this.chunkSize,
                        this.chunkSize,
                        this.terrainScale,
                        this.octaves,
                        this.persistence,
                        this.lacunarity,
                        this.heightMultiplier
                    );
                    this.chunks.set(key, chunk);
                    console.timeEnd('Second chunk  creation')
                }
            }
        }
        console.timeEnd('Second Construction Time'); // Start timing

    }

    unloadChunk(position){
        const posX = Math.floor(position.x / this.chunkSize);
        const posZ = Math.floor(position.z / this.chunkSize);

        this.chunks.forEach((chunk, key) => {
            const [chunkX, chunkZ] = key.split(',').map(Number);

            if (Math.abs(chunkX - posX) > this.renderDistance || Math.abs(chunkZ - posZ) > this.renderDistance)
                this.chunks.delete(key);
        })
    }

    updateLocation(position){
        this.loadChunk(position);
        this.unloadChunk(position);
    }

    render(uModelLocation, uNormalMatrix){
        this.chunks.forEach(chunk => {
            chunk.render(this.gl, uModelLocation, uNormalMatrix);
        })
    }

    Initialize(){

    }



}

export class ChunkLoader{

    constructor(gl, renderDistance, camera, chunkSize){
        this.gl = gl;
        this.renderDistance = renderDistance;
        this.camera = camera;
        this.chunkSize = chunkSize;


        // Just for now
        this.preloadDistance = this.renderDistance + 2;


        this.terrainScale = 0.01;
        this.octaves = 7;
        this.persistence = 0.5;
        this.lacunarity = 2;
        this.heightMultiplier = 3;


        this.loadedChunks = new Map();
        this.loadingQueue = new Set(); // Chunks currently being loaded
        this.lastChunk = "";

        this.logno = 0;
        this.log = [];
    }

    // Load chunks from buffer to render array
    async loadChunk(position){
        // console.log("did load")
        const chunkX = Math.floor(position.x / this.chunkSize);
        const chunkZ = Math.floor(position.z / this.chunkSize);
        
        // console.time('Load Chunk construction'); // Start timing

        for (let x = -this.preloadDistance; x <= this.preloadDistance; x++) {
            for (let z = -this.preloadDistance; z <= this.preloadDistance; z++) {
                const distance = Math.sqrt(x * x + z * z); //? use circle??
                const key = `${chunkX + x},${chunkZ + z}`;

                if (Math.abs(chunkX - x) <= this.renderDistance || Math.abs(chunkZ - z) <= this.renderDistance){
                    
                    // if render doesnt have key, get from loader - if loder doesnt have it get it and set to true
                    // set to true

                    // If already in render chunk
                    if (this.loadedChunks.has(key)){
                        // console.log("render dint have")
                        this.loadedChunks.get(key).toRender = true;
                    } else {
                        // get the chunk and set to true
                        this.renderGetChunk(chunkX + x, chunkZ + z)
                    }
    

                } else if (distance <= this.preloadDistance){
                    // Dont want to process the inner circle with the outer one, one process for each

                    if (!this.loadedChunks.has(key) && !this.loadingQueue.has(key)){
                        // Add chunk to batch for loading
                        // batch.push({ type: 'load', chunkX: chunkX + x, chunkZ: chunkZ + z });

                        // promises.push(this.requestChunk(chunkX + x, chunkZ + z));
                        this.requestChunk(chunkX + x, chunkZ + z)
                    }
                }
            }
        }

        if (this.logno > 0){
            console.log(this.logno);
            this.logno = 0  
        }

        // this.requestBatch(batch);
        // let timef = console.timeEnd('Load Chunk construction'); // End timing and print result

    }

    async requestBatch(batch){
           // Collect promises to process each chunk in the batch asynchronously
        console.time('batch time')
        const promises = batch.map(({ type, chunkX, chunkZ }) => {
            if (type === 'load') {
                return this.requestChunk(chunkX, chunkZ);
            } else if (type === 'render') {
                return this.renderGetChunk(chunkX, chunkZ);
            }
        });
        console.timeEnd('batch time')

        // Wait for all batch processing to complete
        await Promise.all(promises);
    }

    async requestChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.loadingQueue.has(key) || this.loadedChunks.has(key)) return; 
        this.loadingQueue.add(key);
    
        const chunk = await this.packageChunk(chunkX, chunkZ);
        this.loadedChunks.set(key, chunk);
        this.loadingQueue.delete(key);
    }

    // Create the chunk to prep for rendering
    async packageChunk(chunkX, chunkZ) {
        // console.time('Chunk Construction Time'); // Start timing

        return new Promise(resolve => {
            const chunk = new Chunk(
                this.gl, 
                (chunkX) * this.chunkSize,
                (chunkZ) * this.chunkSize,
                this.chunkSize + 1, //? try make it overlap
                this.terrainScale,
                this.octaves,
                this.persistence,
                this.lacunarity,
                this.heightMultiplier
            );
            resolve(chunk);
            // console.timeEnd('Chunk Construction Time'); // End timing and print result

        });
    }

    async renderGetChunk(chunkX, chunkZ){
        const key = `${chunkX},${chunkZ}`;
        if (this.loadingQueue.has(key) || this.loadedChunks.has(key)) return; 
        this.loadingQueue.add(key);
    
        const chunk = await this.packageChunk(chunkX, chunkZ);
        chunk.toRender = true;
        this.loadedChunks.set(key, chunk);
        this.loadingQueue.delete(key);
    }

    unloadChunk(position){
        const posX = Math.floor(position.x / this.chunkSize);
        const posZ = Math.floor(position.z / this.chunkSize);

        // Unload from both renderChunks and loadedChunks
        this.loadedChunks.forEach((chunk, key) => {
            const [chunkX, chunkZ] = key.split(',').map(Number);

            // Remove from render chunks
            if (Math.abs(chunkX - posX) > this.renderDistance || Math.abs(chunkZ - posZ) > this.renderDistance) {
                const chunk = this.loadedChunks.get(key);
                chunk.toRender = false;
                // this.loadedChunks.get(key).toRender = false;
            }

            // Check if the chunk is outside preloadDistance //? we could even delay removing it // Notice this one is square
            if (Math.abs(chunkX - posX) > this.preloadDistance || Math.abs(chunkZ - posZ) > this.preloadDistance) {
                this.loadedChunks.delete(key); // Remove from loaded chunks
            }

            
        });
    }

    updateLocation(position){
        const posX = Math.floor(position.x / this.chunkSize);
        const posZ = Math.floor(position.z / this.chunkSize);
        const key = `${posX},${posZ}`
        // console.log("called me")

        if (!(this.lastChunk === key)){
            // console.log("implemented me")
            this.loadChunk(position);
            this.unloadChunk(position);
            this.lastChunk == key;
        }
    }

    render(uModelLocation, uNormalMatrix){
        this.loadedChunks.forEach(chunk => {
            if (chunk.toRender){

                chunk.render(this.gl, uModelLocation, uNormalMatrix);
            }
        })
    }

    Initialize(){

    }
}