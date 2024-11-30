import { compileShader, initCanvas, linkProgram } from 'mv-redux/init';
import { lookAtMatrix, normalMatrix, perspectiveMatrix, radians, vec3 } from 'mv-redux';

import vertSource from './shaders/terrain.vert';
import fragSource from './shaders/terrain.frag';

import { SceneObject, generateTerrain } from './sceneObject';
import { menu } from './menu';
import { Chunk, WorldRenderer } from './chunk';

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

const terrain = new Chunk(gl, 0, 0, 150);
// const world = new WorldRenderer(gl, 2, null, 150);
// world.updateLocation(vec3(0.))
// console.log(world)

const cameraPosition = menu.cameraPosition;
const cameraTarget = vec3(0, 0, 0);

function draw(time = 0) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ==========================================================

    terrain.scale.y = 2;
    
    menuResponse(gl);

    // ==========================================================
    // cameraPosition.x += 0.1;
    // cameraTarget.x += 0.1;

    const viewMatrix = lookAtMatrix(cameraPosition, cameraTarget);
    const projMatrix = perspectiveMatrix(radians(60), canvas.width / canvas.height, 0.1, 200);
    gl.uniformMatrix4fv(uViewLocation, false, viewMatrix.flat());
    gl.uniformMatrix4fv(uProjLocation, false, projMatrix.flat());

    // world.render( uModelLocation, uNormalMatrix);
    terrain.render(gl, uModelLocation, uNormalMatrix)

    window.requestAnimationFrame(draw);
}
draw();


function menuResponse(gl){
    // Send lighting and material uniforms:
    gl.uniform3fv(uLight.ambient, menu.lightAmbient);
    gl.uniform3fv(uLight.diffuse, menu.lightDiffuse);
    gl.uniform3fv(uLight.specular, menu.lightSpecular);
    gl.uniform3fv(uLight.pos, menu.lightPosition);

    gl.uniform3fv(uMaterial.ambient, menu.materialAmbient);
    gl.uniform3fv(uMaterial.diffuse, menu.materialDiffuse);
    gl.uniform3fv(uMaterial.specular, menu.materialSpecular);

    gl.uniform1f(uMaterial.shininess, menu.materialShininess);
}


export class Renderer{}