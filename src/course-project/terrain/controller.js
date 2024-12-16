
export class ControlSystem {
    constructor() {
        this.x = 0;  // Position X
        this.y = 0;  // Position Y
        this.z = 0;  // Position Z
        this.rotation = 0;  // Rotation angle
        this.squintFactor = 0;  // Squint factor (modifies target)
    }

    update(keys) {
        // Handle movement (WASD)
        if (keys["w"]) this.z += 1;
        if (keys["s"]) this.z -= 1;
        if (keys["a"]) this.x -= 1;
        if (keys["d"]) this.x += 1;

        // Handle rotation (QE)
        if (keys["q"]) this.rotation -= 1;
        if (keys["e"]) this.rotation += 1;

        // Handle vertical movement (FC)
        if (keys["f"]) this.y += 1;
        if (keys["c"]) this.y -= 1;

        // Handle squinting (ZX) - Target change logic
        if (keys["z"]) this.squintFactor -= 1;
        if (keys["x"]) this.squintFactor += 1;
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }

    getRotation() {
        return this.rotation;
    }

    getSquintFactor() {
        return this.squintFactor;
    }
}

