import { compileShader } from "mv-redux/init";

export class ControlSystem {

    // WASD - Move
    // QE   - Look left, right
    // FC   - Go up and down ( Sorry I dont know the actual ones you use ZX?)
    // ZX   - Squint, experimental
    // K    - toggle target lock (keep staring at target or bind target to position)

    constructor(window, position, target) {
        this.window = window;

        this.squintFactor = 0;  // (basically zoom)

        // Directly store references to the position and target objects
        this.position = position; // vec3 reference
        this.target = target;     // vec3 reference

        this.rotation = 0;         // Rotation angle in degrees
        this.moveSpeed = 0.1;      // Movement speed
        this.rotationSpeed = 1;    // Rotation speed
        this.moveTarget = true;   // Toggle moving the target with position

        this.keys = {};            // Store key states


        this.window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.update()
        });

        this.window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false; 
        });
    }

    update() {
        const keys = this.keys

        // Handle movement (WASD)
        if (keys["w"]){
            this.position.z += 1;
            if (this.moveTarget) this.target.z += 1;
        } 
        if (keys["s"]){
            this.position.z -= 1;
            if (this.moveTarget) this.target.z -= 1;
        } 
        if (keys["a"]){
            this.position.x -= 1;
            if (this.moveTarget) this.target.x -= 1;
        } 
        if (keys["d"]){
            this.position.x += 1;
            if (this.moveTarget) this.target.x += 1;
        } 

        // Handle rotation (QE)
        if (keys["q"]) this.rotateAroundPlayer(-1.5);
        if (keys["e"]) this.rotateAroundPlayer(1.5);

        // Handle vertical movement (FC)
        if (keys["f"]){
            this.position.y += 1;
            if (this.moveTarget) this.target.y += 1;
        }  
        if (keys["c"]){
            this.position.y -= 1;
            if (this.moveTarget) this.target.y -= 1;
        }  

        // Handle squinting (ZX) - Target xoom
        if (keys["z"]) this.squintFactor -= 1;
        if (keys["x"]) this.squintFactor += 1;

        if (keys["k"]) this.moveTarget = !this.moveTarget; // probably a keydown or somthing
        // if (keys["l"]) // increase move speed
    }

    rotateAroundPlayer(angleIncrement) {
        const angle = angleIncrement * (Math.PI / 180); // Convert to radians
        const dx = this.target.x - this.position.x;
        const dz = this.target.z - this.position.z;
    
        // Apply rotation matrix
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const newX = cosAngle * dx - sinAngle * dz;
        const newZ = sinAngle * dx + cosAngle * dz;
    
        // Update the target relative to the position
        this.target.x = this.position.x + newX;
        this.target.z = this.position.z + newZ;
    }
}



// export class ControlSystemV2 {
//     constructor(window, position, target) {
//         this.window = window;

//         // Directly store references to the position and target objects
//         this.position = position; // vec3 reference
//         this.target = target;     // vec3 reference

//         this.rotation = 0;         // Rotation angle in degrees
//         this.moveSpeed = 0.1;      // Movement speed
//         this.rotationSpeed = 1;    // Rotation speed
//         this.moveTarget = false;   // Toggle moving the target with position

//         this.squintFactor = 0;  // (basically zoom)

//         this.keys = {};            // Store key states

//         // Event listeners for keydown and keyup
//         this.window.addEventListener("keydown", (e) => {
//             this.keys[e.key] = true;
//             this.update(); // Call update to process movement
//         });

//         this.window.addEventListener("keyup", (e) => {
//             this.keys[e.key] = false;
//         });
//     }

//     update() {
//         const keys = this.keys;
//         let moveSpeed = this.moveSpeed;
//         const angle = this.rotation * (Math.PI / 180); // Convert rotation to radians

//         // Now trying to move in all directions and not on axis
//         // Calculating forward direction based on the rotation angle
//         const forwardX = Math.sin(angle); 
//         const forwardZ = Math.cos(angle); 
//         // To move forward and back we take -ve of the vector

//         // Handle Speeding
//         if (keys["Shift"]) {
//             moveSpeed *= 5;
//         }
//         if (keys["Control"]) {
//             moveSpeed /= 2;
//         }

//         // Handle movement (WASD)
//         if (keys["w"]) {
//             this.position.x += forwardX * moveSpeed; // Forward vector
//             this.position.z += forwardZ * moveSpeed;
//             if (this.moveTarget) {
//                 this.target.x += forwardX * moveSpeed;
//                 this.target.z += forwardZ * moveSpeed;
//             }
//         }
//         if (keys["s"]) {
//             this.position.x -= forwardX * moveSpeed; // Backward vector
//             this.position.z -= forwardZ * moveSpeed;
//             if (this.moveTarget) {
//                 this.target.x -= forwardX * moveSpeed;
//                 this.target.z -= forwardZ * moveSpeed;
//             }
//         }
//         if (keys["a"]) {
//             // Strafe left (perpendicular to the forward direction)
//             this.position.x -= forwardZ * moveSpeed;
//             this.position.z += forwardX * moveSpeed;
//             if (this.moveTarget) {
//                 this.target.x -= forwardZ * moveSpeed;
//                 this.target.z += forwardX * moveSpeed;
//             }
//         }
//         if (keys["d"]) {
//             // Strafe right
//             this.position.x += forwardZ * moveSpeed;
//             this.position.z -= forwardX * moveSpeed;
//             if (this.moveTarget) {
//                 this.target.x += forwardZ * moveSpeed;
//                 this.target.z -= forwardX * moveSpeed;
//             }
//         }

//         // Handle rotation (QE)
//         if (keys["q"]) this.rotation += this.rotationSpeed; // Rotate left
//         if (keys["e"]) this.rotation -= this.rotationSpeed; // Rotate right

//         // Keep rotation within 0-360 degrees for consistency
//         this.rotation = (this.rotation + 360) % 360;

//         // Optional: Update the target to always face a fixed distance in front
//         if (!this.moveTarget) {
//             const targetDistance = 12; // Fixed distance to the target
//             this.target.x = this.position.x + forwardX * targetDistance;
//             this.target.z = this.position.z + forwardZ * targetDistance;
//         }

//         // Handle vertical movement (FC)
//         if (keys["f"]){
//             this.position.y += moveSpeed;
//             if (this.moveTarget) this.target.y += moveSpeed;
//         }  
//         if (keys["c"]){
//             this.position.y -= moveSpeed;
//             if (this.moveTarget) this.target.y -= moveSpeed;
//         }  
//     }

//     rotateAroundPlayer(angleIncrement) {
//         const angle = angleIncrement * (Math.PI / 180); // Convert to radians
//         const dx = this.target.x - this.position.x;
//         const dz = this.target.z - this.position.z;
    
//         // Apply rotation matrix
//         const cosAngle = Math.cos(angle);
//         const sinAngle = Math.sin(angle);
//         const newX = cosAngle * dx - sinAngle * dz;
//         const newZ = sinAngle * dx + cosAngle * dz;
    
//         // Update the target relative to the position
//         this.target.x = this.position.x + newX;
//         this.target.z = this.position.z + newZ;
//     }
// }