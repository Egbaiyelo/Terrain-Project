#version 300 es

precision highp float;

out vec4 fColor;

uniform mat4 uViewMatrix;


in vec3 vNormal;
in vec3 vPosition;

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    vec3 pos;
};

uniform Material uMaterial;
uniform Light uLight;

vec3 blinnPhong(Material material, Light light, vec3 surfaceColor) {
    vec3 l = normalize(light.pos - vPosition);  // Position -> Light
    vec3 n = normalize(vNormal);                // Surface normal

    float Kd = max(dot(l, n), 0.0);
    vec3 diffuse = surfaceColor * light.diffuse * Kd;

    // ...

    vec3 cameraPos = vec3(inverse(uViewMatrix)[3]);

    vec3 v = normalize(cameraPos - vPosition);

    vec3 h = normalize(l + v);

    float ks = 0.0;
    if (dot(n, l) > 0.0) { 
        ks = pow(max(dot(n, h), 0.0), material.shininess);
    }

    vec3 specular = material.specular * light.specular * ks;

    vec3 ambient = material.ambient * light.ambient;

    return diffuse + ambient + specular;
}


void main() {
    vec3 blue = vec3(0.0, 0.3803921568627451, 1.0); 
    vec3 green = vec3(0.0, 0.5, 0.0);              
    vec3 brown = vec3(0.6, 0.3, 0.0);              

    vec3 surfaceColor;

    if (vPosition.y <= -9.0) {
        surfaceColor = blue;  // Apply blue color at low heights
    } else if (vPosition.y < -3.0) {
        surfaceColor = green;  // Green for mid-range heights
    } else {
        surfaceColor = brown;  // Brown for higher regions
    }

    vec3 color = blinnPhong(uMaterial, uLight, surfaceColor);

    fColor = vec4(color, 1.0);  // Final color output
}