#version 300 es

// Using these `layout` qualifiers stops us from having to call `gl.getAttribLocation`, since we can
// set the locations ourselves manually. Only works on `in` attributes, not uniforms (in WebGL,
// anyways).
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjMatrix;

uniform mat3 uNormalMatrix; 

out vec3 vNormal;
out vec3 vPosition;

void main() {
    // Get world-space position:
    vec4 wsPos = uModelMatrix * vec4(aPosition, 1.0);
    vPosition = wsPos.xyz;

    vNormal = (uNormalMatrix * aNormal);
    gl_Position = uProjMatrix * uViewMatrix * wsPos;
}
