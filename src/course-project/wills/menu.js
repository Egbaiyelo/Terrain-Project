import { vec3 } from 'mv-redux';
import './menu.css';

/**
 * @typedef SliderGroup
 * @property {HTMLInputElement} x
 * @property {HTMLInputElement} y
 * @property {HTMLInputElement} z
 */

/**
 * Helper function to grab an input from the DOM so I don't have to write out so many huge casts or
 * type `document.getElementById` so many times.
 * @param {string} id
 */
function getInput(id) {
    const input = document.getElementById(id);

    if (!(input instanceof HTMLInputElement)) {
        throw new Error(`Element #${id} is not an <input>.`);
    }

    // See if the input has a span next to it, and attach a listener if it does
    const sibling = input.nextElementSibling;
    if (sibling instanceof HTMLSpanElement) {
        input.addEventListener('input', () => {
            sibling.innerText = input.valueAsNumber.toFixed(2)
        });
    }

    return input;
}

/**
 * Generates a `vec3` from a group of three sliders.
 * @param {SliderGroup} inputs The x, y, and z sliders to grab the vector components from.
 * @returns {import('mv-redux').Vec3} The vector.
 */
function vec3FromSliders({ x, y, z }) {
    return vec3(
        x.valueAsNumber || 0,
        y.valueAsNumber || 0,
        z.valueAsNumber || 0,
    );
}

/**
 * Generates a `vec3` from a hexadecimal colour string.
 * @param {string} hex
 * @returns {import('mv-redux').Vec3}
 */
function vec3FromHex(hex) {
    let i = hex.startsWith('#') ? 1 : 0;
    const r = window.parseInt(hex.substring(i, i += 2), 16) / 0xFF;
    const g = window.parseInt(hex.substring(i, i += 2), 16) / 0xFF;
    const b = window.parseInt(hex.substring(i, i += 2), 16) / 0xFF;
    return vec3(r, g, b);
}


export const menu = {
    inputs: {
        lightPosition: { x: getInput('light-x'), y: getInput('light-y'), z: getInput('light-z') },
        cameraPosition: { x: getInput('camera-x'), y: getInput('camera-y'), z: getInput('camera-z') },
        lightColors: {
            ambient: getInput('light-ambient'),
            diffuse: getInput('light-diffuse'),
            specular: getInput('light-specular'),
        },
        material: {
            ambient: getInput('mtl-ambient'),
            diffuse: getInput('mtl-diffuse'),
            specular: getInput('mtl-specular'),
            shininess: getInput('mtl-shininess'),
        },
    },

    // These "getter" properties work exactly like `get` properties do in C#. JavaScript also has
    // `set` properties:
    // - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
    // - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set
    get lightPosition() { return vec3FromSliders(this.inputs.lightPosition); },
    get cameraPosition() { return vec3FromSliders(this.inputs.cameraPosition); },

    get lightAmbient() { return vec3FromHex(this.inputs.lightColors.ambient.value); },
    get lightDiffuse() { return vec3FromHex(this.inputs.lightColors.diffuse.value); },
    get lightSpecular() { return vec3FromHex(this.inputs.lightColors.specular.value); },

    get materialAmbient() { return vec3FromHex(this.inputs.material.ambient.value); },
    get materialDiffuse() { return vec3FromHex(this.inputs.material.diffuse.value); },
    get materialSpecular() { return vec3FromHex(this.inputs.material.specular.value); },
    get materialShininess() { return this.inputs.material.shininess.valueAsNumber || 0; }
}
