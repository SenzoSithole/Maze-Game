import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { MazeWorld } from '../scripts/world_maze.js';

let camera, renderer, world, ball, ballBody;

function init() {
    // Set up renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 30);
    camera.lookAt(0, 0, 0);

    // Create world
    world = new MazeWorld();

    // Create ball
    const ballGeometry = new THREE.SphereGeometry(0.5);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    world.addToScene(ball);

    // Create ball physics body
    const ballShape = new CANNON.Sphere(0.5);
    ballBody = new CANNON.Body({
        mass: 5,
        shape: ballShape,
        position: world.getStartPosition()
    });
    world.addBody(ballBody);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    world.addToScene(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    world.addToScene(directionalLight);

    // Start animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    world.update();

    // Update ball position
    ball.position.copy(ballBody.position);
    ball.quaternion.copy(ballBody.quaternion);

    // Update camera to follow ball
    camera.position.copy(ballBody.position);
    camera.position.y += 10;
    camera.position.z += 15;
    camera.lookAt(ballBody.position);

    renderer.render(world.scene, camera);
}

// Call init when the window loads
window.addEventListener('load', init);