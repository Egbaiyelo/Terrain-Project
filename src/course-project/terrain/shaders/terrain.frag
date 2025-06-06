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


// Bling phong from the lab
vec3 blinnPhong(Material material, Light light, vec3 surfaceColor) {
    vec3 l = normalize(light.pos - vPosition);  // Position -> Light
    vec3 n = normalize(vNormal);                // Surface normal

    float Kd = max(dot(l, n), 0.0);
    vec3 diffuse =  surfaceColor * light.diffuse * Kd;
 
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
    // Define colors
    vec3 blue = vec3(0.0, 0.3803, 1.0); 
    vec3 green = vec3(0.0, 0.5, 0.0);              
    vec3 brown = vec3(0.6, 0.3, 0.0);              
    vec3 white = vec3(1.0, 1.0, 1.0); // White for flat surfaces

    // Flatness threshold
    float grassThreshold = 0.1; // Specifying the flatness of land to tolerate grass
    float iceThreshold = 0.9;   // '' tolerate ice

    // vec3 color = blinnPhong(uMaterial, uLight);   
    vec3 surfaceColor = vec3(0); 

    // Water essentially
    if (vPosition.y <= -9.0) {
        surfaceColor = blue;  // Apply blue color at low heights
    }
    // Land range
    else if (vPosition.y < -3.0) {
        if (abs(vNormal.x) > (grassThreshold)) {
            surfaceColor = green;  // Grass on flatter surfaces
        } else {
            surfaceColor = brown;  // Unlikely but just some instances
        }
    }
    // Mountain (range)
    else {
        if (abs(vNormal.x) < (iceThreshold)) {
            surfaceColor = white;  // Surfaces that can hold snow
        } else {
            surfaceColor = brown;  // Very likely
        }
    }

    // Using the bling phong
    vec3 color = blinnPhong(uMaterial, uLight, surfaceColor);

    // Final color output
    fColor = vec4(color, 1.0);
}