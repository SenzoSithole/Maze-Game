import * as THREE from "three";
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import { wallsData } from '/scripts/wallsData.js';
﻿

// Global variables
let scene, camera, renderer, physicsWorld;
let ball, ballBody;
let soccerGoal;
let firstPersonView = false;
let walls = [];
﻿

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    ' ': false,
};
﻿

const cellSize = 5;
const wallThickness = 1.5;
const scaleFactor = 1; // Scale factor for walls
const raycaster = new THREE.Raycaster();
﻿

﻿

function initGame() {
    initScene();
    initPhysics();
    createFloor();
    createMaze(wallsData);
    createBall();
    loadGoal(); 
    setupControls();
    setupPointerLock(); 
    setupLights();
    addInteractiveElements();
    addCollectibles();
    animate();
}
﻿

function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Set initial camera position and rotation
    camera.position.copy(cameraOffset);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
﻿

    const canvasContainer = document.getElementById('canvasContainer');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);
}
﻿

﻿

function initPhysics() {
    physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0, -9.82, 0);
}
﻿

function createFloor() {
    const floorSize = 150;
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: "cyan",
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.2
    });
﻿

    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
﻿

    // const gridHelper = new THREE.GridHelper(100, 100);
    // scene.add(gridHelper);
﻿

    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ mass: 0 });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    physicsWorld.addBody(floorBody);
}
﻿

function createWall(x, z, length, height, isAlignedWithZ) {
    const scaledX = x * scaleFactor;
    const scaledZ = z * scaleFactor;
    const scaledLength = length * scaleFactor;
    const scaledHeight = height * scaleFactor;
﻿

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: "cyan",
        roughness: 0.7,
        metalness: 0.3
    });
﻿

    const wallGeometry = new THREE.BoxGeometry(
        isAlignedWithZ ? wallThickness : scaledLength,
        scaledHeight,
        isAlignedWithZ ? scaledLength : wallThickness
    );
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(scaledX, scaledHeight / 2, scaledZ);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
﻿

    const wallShape = new CANNON.Box(new CANNON.Vec3(
        isAlignedWithZ ? wallThickness / 2 : scaledLength / 2,
        scaledHeight / 2,
        isAlignedWithZ ? scaledLength / 2 : wallThickness / 2
    ));
    const wallBody = new CANNON.Body({ mass: 0 });
    wallBody.addShape(wallShape);
    wallBody.position.copy(wallMesh.position);
    physicsWorld.addBody(wallBody);
﻿

    walls.push({ mesh: wallMesh, body: wallBody });
}
﻿

function createMaze(wallsData) {
    for (const wall of wallsData) {
        createWall(wall.x, wall.z, wall.length, wall.height, wall.isAlignedWithZ);
    }
}
﻿

﻿

let collectibles = [];
let collectedCount = 0; // Track collected items
﻿

function createCollectible(x, z) {
    const collectibleMaterial = new THREE.MeshStandardMaterial({ color: "green" });
    const collectibleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const collectibleMesh = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
    collectibleMesh.position.set(x, 0.5, z); // Adjust height if needed
    collectibleMesh.castShadow = true;
    scene.add(collectibleMesh);
﻿

    const collectibleShape = new CANNON.Sphere(0.3);
    const collectibleBody = new CANNON.Body({ mass: 0 });
    collectibleBody.addShape(collectibleShape);
    collectibleBody.position.set(x, 0.5, z);
    physicsWorld.addBody(collectibleBody);
﻿

    collectibles.push({ mesh: collectibleMesh, body: collectibleBody, collected: false });
}
﻿

﻿

function checkCollectibleCollisions() {
    collectibles.forEach((collectible) => {
        if (!collectible.collected) {
            const distanceToCollectible = ballBody.position.distanceTo(collectible.body.position);
            if (distanceToCollectible < 1.0) { // Adjust distance threshold as needed
                collectible.mesh.visible = false; // Hide collectible
                collectible.collected = true; // Mark as collected
                collectedCount++; // Increment the count
                console.log("Collected an item! Total collected:", collectedCount);
            }
        }
    });
}
﻿

﻿

function addCollectibles() {
    createCollectible(12, -65);;
    // Add as many collectibles as needed at specific positions
}
﻿

﻿

const requiredCollectibles = collectibles.length; // Set number of items needed to complete the maze
﻿

function isMazeCompletionAllowed() {
    return collectedCount >= requiredCollectibles;
}
﻿

﻿

let hiddenWall, buttonBody, buttonMesh;
let isWallVisible = false;
﻿

function createHiddenWall() {
    // Wall properties
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: "blue",
        roughness: 0.7,
        metalness: 0.3,
    });
    const wallGeometry = new THREE.BoxGeometry(5, 10, 1); // Dimensions for the wall
    hiddenWall = new THREE.Mesh(wallGeometry, wallMaterial);
    hiddenWall.position.set(-4, 5,-65); // Set the wall's position
    hiddenWall.castShadow = true;
    hiddenWall.receiveShadow = true;
    hiddenWall.visible = false;
    scene.add(hiddenWall);
﻿

    const wallShape = new CANNON.Box(new CANNON.Vec3(2.5, 5, 0.5));
    const wallBody = new CANNON.Body({ mass: 0 });
    wallBody.addShape(wallShape);
    wallBody.position.copy(hiddenWall.position);
    physicsWorld.addBody(wallBody);
}
﻿

function createButton() {
    // Button properties
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: "red" });
    const buttonGeometry = new THREE.BoxGeometry(2, 0.5, 2); // Button as a small box
    buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
    buttonMesh.position.set(-8, 0.25, -65); // Set the button’s position
    buttonMesh.castShadow = true;
    buttonMesh.receiveShadow = true;
    scene.add(buttonMesh);
﻿

    const buttonShape = new CANNON.Box(new CANNON.Vec3(1, 0.25, 1));
    buttonBody = new CANNON.Body({ mass: 0 });
    buttonBody.addShape(buttonShape);
    buttonBody.position.copy(buttonMesh.position);
    physicsWorld.addBody(buttonBody);
}
﻿

function addInteractiveElements() {
    createHiddenWall();
    createButton();
}
﻿

function showWall() {
    hiddenWall.visible = true;
    isWallVisible = true;
﻿

    console.log("Wall appeared!");
}
﻿

function createBall() {
    const sphereShape = new CANNON.Sphere(0.5);
    ballBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 1, -65),
        shape: sphereShape,
        material: new CANNON.Material({ restitution: 0.6 })
    });
    ballBody.linearDamping = 0.5;
    physicsWorld.addBody(ballBody);
﻿

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: "yellow",
        emissiveIntensity: 1.5,
        roughness: 0.4,
        metalness: 0.8,
        wireframe: false
    });
﻿

    ball = new THREE.Mesh(geometry, material);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);
﻿

    const ballLight = new THREE.PointLight("yellow", 100, 100);
    ball.add(ballLight);
﻿

    // const lightHelper = new THREE.PointLightHelper(ballLight, 2);
    // scene.add(lightHelper);
}
﻿

function loadGoal() {
    const loader = new GLTFLoader();
    loader.load(
        './models/soccerGoal.glb',
        function(gltf) {
            console.log('Goal model loaded successfully:', gltf);
            soccerGoal = gltf.scene;
            soccerGoal.scale.set(5,5 , 5);
            soccerGoal.position.set(-10, 2, -65);
            scene.add(soccerGoal);
        },
        undefined,
        function(error) {
            console.error('An error happened while loading the GLTF model:', error);
        }
    );
}
﻿

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);
﻿

//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//     directionalLight.position.set(10, 20, 10);
//     directionalLight.castShadow = true;
//     scene.add(directionalLight);
}
﻿

﻿

function checkBallButtonCollision() {
    const distanceToButton = ballBody.position.distanceTo(buttonBody.position);
    if (distanceToButton < 1.5 && !isWallVisible) { // Collision threshold and wall visibility check
        showWall();
    }
}
﻿

﻿

// Add target position for the end of the maze
const targetPosition = new THREE.Vector3(4, 1, 55);
﻿

function animate() {
    requestAnimationFrame(animate);
    physicsWorld.step(1 / 60);
﻿

    updateMovement();
    checkBallButtonCollision();
    checkCollectibleCollisions(); // Check for collectible collisions
﻿

    if (ball) {
        ball.position.copy(ballBody.position);
        ball.quaternion.copy(ballBody.quaternion);
﻿

        if (ball.position.distanceTo(targetPosition) < 2 && isMazeCompletionAllowed()) {
            showGameCompleted();
        }
﻿

        updateCamera();
    }
﻿

    renderer.render(scene, camera);
}
﻿

﻿

﻿

// Show "Game Completed" when the ball reaches the end
function showGameCompleted() {
    if (isMazeCompletionAllowed()) {
        const gameCompletedDiv = document.getElementById('gameCompleted');
        gameCompletedDiv.style.display = 'block';
        ballBody.velocity.set(0, 0, 0);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        console.log("Congratulations! You've completed the maze!");
    } else {
        console.log("Collect all items before completing the maze!");
    }
}
﻿

function setupPointerLock() {
    const canvasContainer = document.getElementById('canvasContainer');
﻿

    // Request pointer lock when clicking on the canvas
    canvasContainer.addEventListener('click', function () {
        canvasContainer.requestPointerLock();
    });
﻿

    // Listen for pointer lock state change events
    document.addEventListener('pointerlockchange', function () {
        if (document.pointerLockElement === canvasContainer) {
            console.log('Pointer locked');
            document.addEventListener('mousemove', updateCameraRotation, false);
        } else {
            console.log('Pointer unlocked');
            document.removeEventListener('mousemove', updateCameraRotation, false);
        }
    });
﻿

    // Release pointer lock on Escape key
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            document.exitPointerLock();
        }
    });
}
﻿

﻿

let cameraOffset = new THREE.Vector3(0, 2, -2);
let cameraRotation = {
    yaw: 0,
    pitch: 0
};
﻿

function updateCameraRotation(event) {
    const sensitivity = 0.002;
﻿

    // Update rotation angles
    cameraRotation.yaw -= event.movementX * sensitivity;
    cameraRotation.pitch -= event.movementY * sensitivity;
﻿

    // Clamp the pitch to avoid camera flipping
    cameraRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.pitch));
}
﻿

function updateCamera() {
    if (!ball) return;
﻿

    if (firstPersonView) {
        // Position camera inside or slightly above the ball
        camera.position.copy(ball.position).add(new THREE.Vector3(0, 0.5, 0));
﻿

        // Look in the direction of the current camera yaw and pitch
        const lookDirection = new THREE.Vector3(
            Math.sin(cameraRotation.yaw),
            Math.tan(cameraRotation.pitch),
            Math.cos(cameraRotation.yaw)
        );
        const lookTarget = camera.position.clone().add(lookDirection);
        camera.lookAt(lookTarget);
    } else {
        // Calculate new potential camera position
        const rotatedOffset = new THREE.Vector3(
            Math.sin(cameraRotation.yaw) * cameraOffset.z,
            cameraOffset.y,
            Math.cos(cameraRotation.yaw) * cameraOffset.z
        );
        const targetPosition = ball.position.clone().add(rotatedOffset);
﻿

        // Set raycaster from the ball position towards the new camera position
        const directionToCamera = new THREE.Vector3().subVectors(targetPosition, ball.position).normalize();
        raycaster.set(ball.position, directionToCamera);
﻿

        // Check if any walls are in the path
        const intersects = raycaster.intersectObjects(walls.map(wall => wall.mesh));
        const collisionDistance = 1; // Define minimum distance from wall
﻿

        // If no intersections or the closest one is beyond collisionDistance, move the camera
        if (intersects.length === 0 || intersects[0].distance > collisionDistance) {
            camera.position.lerp(targetPosition, 0.1);
        }
﻿

        // Create a look target slightly above the ball
        const lookTarget = ball.position.clone().add(new THREE.Vector3(0, 2, 0));
        camera.lookAt(lookTarget);
﻿

        // Apply pitch rotation
        camera.rotateX(cameraRotation.pitch);
    }
}
﻿

﻿

﻿

function updateMovement() {
    const moveForward = keys.ArrowUp || keys.w;
    const moveBackward = keys.ArrowDown || keys.s;
    const moveLeft = keys.ArrowLeft || keys.a;
    const moveRight = keys.ArrowRight || keys.d;
﻿

    const acceleration = 20 * (1 / 60);
    const maxSpeed = 10;
﻿

    // Get the camera's forward and right vectors
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);  // Forward direction of the camera
﻿

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(camera.up, cameraDirection).normalize();  // Right direction
﻿

    // Compute the direction of movement relative to the camera
    let moveDirection = new CANNON.Vec3();
﻿

    if (moveForward) {
        moveDirection.x += cameraDirection.x;
        moveDirection.z += cameraDirection.z;
    }
    if (moveBackward) {
        moveDirection.x -= cameraDirection.x;
        moveDirection.z -= cameraDirection.z;
    }
    if (moveLeft) {
        moveDirection.x += cameraRight.x;
        moveDirection.z += cameraRight.z;
    }
    if (moveRight) {
        moveDirection.x -= cameraRight.x;
        moveDirection.z -= cameraRight.z;
    }
﻿

    if (moveDirection.length() > 0) {
        moveDirection.normalize();  // Normalize direction to ensure uniform speed
        ballBody.velocity.x += moveDirection.x * acceleration;
        ballBody.velocity.z += moveDirection.z * acceleration;
    }
﻿

    // Apply maximum speed clamp
    const horizontalVelocity = new CANNON.Vec3(ballBody.velocity.x, 0, ballBody.velocity.z);
    if (horizontalVelocity.length() > maxSpeed) {
        horizontalVelocity.normalize();
        horizontalVelocity.scale(maxSpeed, horizontalVelocity);
        ballBody.velocity.x = horizontalVelocity.x;
        ballBody.velocity.z = horizontalVelocity.z;
    }
﻿

    // Jumping logic (unchanged)
    const isOnGround = Math.abs(ballBody.position.y - 0.5) < 0.05;
    if (keys[' '] && isOnGround) {
        ballBody.velocity.y = 10;  // Jump velocity
    }
}
﻿

﻿

﻿

function setupControls() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}
﻿

function handleKeyDown(event) {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
    if (event.key === 'v' || event.key === 'V') {
        firstPersonView = !firstPersonView; // Toggle first-person view
    }
}
﻿

function handleKeyUp(event) {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
}
﻿

initGame();
﻿