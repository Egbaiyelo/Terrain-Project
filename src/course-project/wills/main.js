import { compileShader, initCanvas, linkProgram } from 'mv-redux/init';
import { lookAtMatrix, normalMatrix, perspectiveMatrix, radians, vec3 } from 'mv-redux';

import vertSource from './shaders/terrain.vert';
import fragSource from './shaders/terrain.frag';

import { SceneObject, generateTerrain } from './sceneObject';
import { menu } from './menu';

// ------------------------------

const canvas = document.querySelector('canvas');
const gl = initCanvas(canvas);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.4, 0.4, 0.4, 1.0);
gl.enable(gl.DEPTH_TEST);

// Program and uniforms
// --------------------

const vs = compileShader(gl, gl.VERTEX_SHADER, vertSource);
const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
const terrainProgram = linkProgram(gl, vs, fs);

gl.useProgram(terrainProgram);

const uModelLocation = gl.getUniformLocation(terrainProgram, 'uModelMatrix');
const uViewLocation = gl.getUniformLocation(terrainProgram, 'uViewMatrix');
const uProjLocation = gl.getUniformLocation(terrainProgram, 'uProjMatrix');

const uMaterial = {
    ambient: gl.getUniformLocation(terrainProgram, 'uMaterial.ambient'),
    diffuse: gl.getUniformLocation(terrainProgram, 'uMaterial.diffuse'),
    specular: gl.getUniformLocation(terrainProgram, 'uMaterial.specular'),
    shininess: gl.getUniformLocation(terrainProgram, 'uMaterial.shininess')
};

const uLight = {
    pos: gl.getUniformLocation(terrainProgram, 'uLight.pos'),
    ambient: gl.getUniformLocation(terrainProgram, 'uLight.ambient'),
    diffuse: gl.getUniformLocation(terrainProgram, 'uLight.diffuse'),
    specular: gl.getUniformLocation(terrainProgram, 'uLight.specular')
};

const uNormalMatrix = gl.getUniformLocation(terrainProgram, 'uNormalMatrix');

// ==========================================================

const terrain = new SceneObject();
const { vertices, normals, indices } = generateTerrain(250, 250, 200, 8, 0.29, 2.7, 16);

const vertex = new Float32Array(vertices);
const normal = new Float32Array(normals);
const index = new Uint16Array(indices);

// Buffer and vertex attributes
// ----------------------------

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertex, gl.STATIC_DRAW);

gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(0);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, normal, gl.STATIC_DRAW);

gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(1);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

function draw(time = 0) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ==========================================================

    terrain.scale.y = 2;
    
    // Send lighting and material uniforms:
    gl.uniform3fv(uLight.ambient, menu.lightAmbient);
    gl.uniform3fv(uLight.diffuse, menu.lightDiffuse);
    gl.uniform3fv(uLight.specular, menu.lightSpecular);
    gl.uniform3fv(uLight.pos, menu.lightPosition);

    gl.uniform3fv(uMaterial.ambient, menu.materialAmbient);
    gl.uniform3fv(uMaterial.diffuse, menu.materialDiffuse);
    gl.uniform3fv(uMaterial.specular, menu.materialSpecular);

    gl.uniform1f(uMaterial.shininess, menu.materialShininess);

    // ==========================================================

    const cameraPosition = menu.cameraPosition;
    const cameraTarget = vec3(0, 0, 0);

    const viewMatrix = lookAtMatrix(cameraPosition, cameraTarget);
    const projMatrix = perspectiveMatrix(radians(60), canvas.width / canvas.height, 0.1, 500);
    gl.uniformMatrix4fv(uViewLocation, false, viewMatrix.flat());
    gl.uniformMatrix4fv(uProjLocation, false, projMatrix.flat());

    const modelMatrix = terrain.getModelMatrix();
    gl.uniformMatrix4fv(uModelLocation, false, modelMatrix.flat());
    gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix(modelMatrix, true).flat());

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(draw);
}
draw();