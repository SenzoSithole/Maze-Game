import * as THREE from "three";
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MazeWorld } from './world_maze.js';

// Global variables
let mazeWorld, scene, camera, renderer, soccerBall, soccerBallBody, spotLight;
let yaw = 0, pitch = 0;
let cameraMode = 'third-person';
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
    v: false
};
let mouseDown = false;

const mouseSensitivity = 0.002;
const pitchLimit = Math.PI / 3;

function initGame() {
    initPhysics();
    initScene();
    setupControls();
    animate();
}

function initPhysics() {
    mazeWorld = new MazeWorld();

    const wallsData = [
        { x: 0, z: 10, length: 20, height: 5, isAlignedWithZ: false },
        { x: -10, z: 0, length: 20, height: 7, isAlignedWithZ: true },
        { x: 10, z: -5, length: 15, height: 6, isAlignedWithZ: false },
        // Add more walls as needed
    ];

    mazeWorld.createMaze(wallsData);

    scene = mazeWorld.scene;

    const sphereShape = new CANNON.Sphere(0.5);
    soccerBallBody = new CANNON.Body({
        mass: 5,
        position: mazeWorld.getStartPosition(),
        shape: sphereShape,
        material: new CANNON.Material({ restitution: 0.5 })
    });

    soccerBallBody.linearDamping = 0.5;
    mazeWorld.addBody(soccerBallBody);
}

function loadSoccerBall() {
    const loader = new GLTFLoader();
    loader.load(
        './models/soccer_ball.glb',
        (gltf) => {
            soccerBall = gltf.scene;
            soccerBall.castShadow = true;
            soccerBall.receiveShadow = true;

            soccerBall.position.copy(soccerBallBody.position);
            soccerBall.scale.set(0.5, 0.5, 0.5);

            mazeWorld.addToScene(soccerBall);
            camera.lookAt(soccerBall.position);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error occurred loading the model', error);
        }
    );
}

function initScene() {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const canvasContainer = document.getElementById('canvasContainer');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x87CEEB);
    canvasContainer.appendChild(renderer.domElement);

    loadSoccerBall();

    const ambientLight = new THREE.AmbientLight(0xffffff);
    mazeWorld.addToScene(ambientLight);

    spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(-30, 60, 60);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 200;
    spotLight.intensity = 2;
    spotLight.castShadow = true;
    mazeWorld.addToScene(spotLight);

    camera.position.set(0, 30, 30);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function animate() {
    requestAnimationFrame(animate);
    mazeWorld.update();

    if (soccerBall) {
        soccerBall.position.copy(soccerBallBody.position);
        soccerBall.quaternion.copy(soccerBallBody.quaternion);
    }

    updateMovement();
    updateCamera();

    renderer.render(scene, camera);
}

function updateMovement() {
    const moveForward = keys.ArrowUp || keys.w;
    const moveBackward = keys.ArrowDown || keys.s;
    const moveLeft = keys.ArrowLeft || keys.a;
    const moveRight = keys.ArrowRight || keys.d;

    const forwardVector = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rightVector = new THREE.Vector3().crossVectors(forwardVector, new THREE.Vector3(0, 1, 0)).normalize();

    const force = 10;
    if (moveForward) {
        soccerBallBody.applyForce(new CANNON.Vec3(-forwardVector.x * force, 0, -forwardVector.z * force), soccerBallBody.position);
    }
    if (moveBackward) {
        soccerBallBody.applyForce(new CANNON.Vec3(forwardVector.x * force, 0, forwardVector.z * force), soccerBallBody.position);
    }
    if (moveLeft) {
        soccerBallBody.applyForce(new CANNON.Vec3(rightVector.x * force, 0, rightVector.z * force), soccerBallBody.position);
    }
    if (moveRight) {
        soccerBallBody.applyForce(new CANNON.Vec3(-rightVector.x * force, 0, -rightVector.z * force), soccerBallBody.position);
    }

    const isOnGround = Math.abs(soccerBallBody.position.y - 0.5) < 0.1 && soccerBallBody.velocity.y <= 0.01;
    if (keys[' '] && isOnGround) {
        soccerBallBody.velocity.y = 5;
    }
}

function updateCamera() {
    if (cameraMode === 'third-person') {
        const cameraDistance = 15;
        const cameraX = soccerBallBody.position.x + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
        const cameraY = soccerBallBody.position.y + cameraDistance * Math.sin(pitch);
        const cameraZ = soccerBallBody.position.z + cameraDistance * Math.cos(yaw) * Math.cos(pitch);
        camera.position.set(cameraX, cameraY, cameraZ);
    } else if (cameraMode === 'first-person') {
        const cameraX = soccerBallBody.position.x + 2 * Math.sin(yaw);
        const cameraY = soccerBallBody.position.y + 3;
        const cameraZ = soccerBallBody.position.z + 2 * Math.cos(yaw);
        camera.position.set(cameraX, cameraY, cameraZ);
    }

    if (soccerBall) {
        camera.lookAt(soccerBall.position);
    } else {
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
}

function toggleCameraMode() {
    cameraMode = cameraMode === 'third-person' ? 'first-person' : 'third-person';
}

function setupControls() {
    window.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            keys[event.key] = true;
        }
        if (event.key === 'v') {
            toggleCameraMode();
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            keys[event.key] = false;
        }
    });

    window.addEventListener('mousedown', () => { mouseDown = true; });
    window.addEventListener('mouseup', () => { mouseDown = false; });

    window.addEventListener('mousemove', (event) => {
        if (mouseDown) {
            yaw -= event.movementX * mouseSensitivity;
            pitch -= event.movementY * mouseSensitivity;

            pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
        }
    });
}

// Event listener for the start button
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('canvasContainer').style.display = 'block';
    initGame();
});

// Other menu options
document.getElementById('levelButton').addEventListener('click', () => {
    alert("Select Level clicked!");
});

document.getElementById('optionsButton').addEventListener('click', () => {
    alert("Options menu clicked!");
});

document.getElementById('quitButton').addEventListener('click', () => {
    alert("Quit option clicked!");
});