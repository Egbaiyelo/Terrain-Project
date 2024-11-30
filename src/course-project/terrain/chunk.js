import { normalMatrix } from "mv-redux";
import { generateTerrain, SceneObject } from "./sceneObject";

export class WorldRenderer{

    constructor(gl, renderDistance, camera, chunkSize){
        this.gl = gl;
        this.renderDistance = renderDistance;
        this.camera = camera;
        this.chunkSize = chunkSize;


        // Just for now
        // this.renderDistance = 1;



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

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                const key = `${chunkX + x},${chunkZ + z}`;

                if (!this.chunks.has(key)) {
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
                }
            }
        }
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




export class Chunk extends SceneObject{

    constructor(gl, chunkX, chunkZ, chunkSize, terrainScale, octaves, persistence, lacunarity, heightMultiplier){
        super()

        this.gl = gl;
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.chunkSize = chunkSize;


        this.terrainScale = 0.01;
        this.octaves = 7;
        this.persistence = 0.5;
        this.lacunarity = 2;
        this.heightMultiplier = 3;

        const { vertices, normals, indices } = generateTerrain(
            this.chunkX,
            this.chunkZ,
            this.chunkSize,
            this.chunkSize,
            this.terrainScale,
            this.octaves,
            this.persistence,
            this.lacunarity,
            this.heightMultiplier,
        );

        
        this.vertices = new Float32Array(vertices);
        this.normals = new Float32Array(normals);
        this.indices = new Uint16Array(indices);
        
        this.ProgramSetUp(gl)

    }

    // Bind the buffers
    ProgramSetUp(gl){

        // Bind buffers and vertex attributes

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    // Rebind the buffers and all
    UpdateBuffers(){

    }

    // Render the chunk
    render(gl, uModelLocation, uNormalMatrix){
        this.ProgramSetUp(gl);

        const modelMatrix = this.getModelMatrix();
        gl.uniformMatrix4fv(uModelLocation, false, modelMatrix.flat());
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix(modelMatrix, true).flat());
    
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}