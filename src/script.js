import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

//base
// Debug
const debugObject = {
	uCenterColor: 0xebd6ff,
	uBorderColor: 0xfdecfe,
}

const gui = new GUI({
	width: 400,
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//Loaders
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

//textures
const bakedTexture = textureLoader.load('baked3.jpg')

//fix flip
bakedTexture.flipY = false
//fix encoding colors
bakedTexture.colorSpace = THREE.SRGBColorSpace
//baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

//Pole ligt material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

//model
gltfLoader.load('p6.glb', gltf => {
	console.log(gltf.scene.children)
	// Get each object
	const bakedMesh = gltf.scene.children.find(
		child => child.name === 'bakednomaterial',
	)
	const poleLightAMesh = gltf.scene.children.find(
		child => child.name === 'poteau002',
	)
	const poleLightBMesh = gltf.scene.children.find(
		child => child.name === 'poteau005',
	)

	const portalLight = gltf.scene.children.find(
		child => child.name === 'Circle',
	)

	//Apply material
	poleLightAMesh.material = poleLightMaterial
	poleLightBMesh.material = poleLightMaterial
	portalLight.material = portalMaterial
	bakedMesh.material = bakedMaterial

	scene.add(gltf.scene)
})

//fireflies
//geometrie
const firefliesGeometry = new THREE.BufferGeometry({})
const firefliesCount = 40
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++) {
	positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
	positionArray[i * 3 + 1] = Math.random() * 2
	positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

	scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute(
	'position',
	new THREE.BufferAttribute(positionArray, 3),
)

firefliesGeometry.setAttribute(
	'aScale',
	new THREE.BufferAttribute(scaleArray, 1),
)

const firefliesMaterial = new THREE.ShaderMaterial({
	vertexShader: firefliesVertexShader,
	fragmentShader: firefliesFragmentShader,
	uniforms: {
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uSize: {
			value: 70,
		},
		uTime: { value: 0 },
	},
	transparent: true,
	blending: THREE.AdditiveBlending,
	depthWrite: false,
})

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)

gui.add(firefliesMaterial.uniforms.uSize, 'value')
	.min(0)
	.max(100)
	.step('0.1')
	.name('Fireflies size')

scene.add(fireflies)

//portal shader
const portalMaterial = new THREE.ShaderMaterial({
	vertexShader: portalVertexShader,
	fragmentShader: portalFragmentShader,
	uniforms: {
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uTime: { value: 0 },
		uCenterColor: { value: new THREE.Color(debugObject.uCenterColor) },
		uBorderColor: { value: new THREE.Color(debugObject.uBorderColor) },
	},
})

gui.addColor(debugObject, 'uCenterColor').onChange(() => {
	portalMaterial.uniforms.uCenterColor.value.set(debugObject.uCenterColor)
})

gui.addColor(debugObject, 'uBorderColor').onChange(() => {
	portalMaterial.uniforms.uBorderColor.value.set(debugObject.uBorderColor)
})

//fog
const fog = new THREE.Fog('#39247f', 0.5, 15)
scene.fog = fog

//sizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

	// Update fireflies
	firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
		window.devicePixelRatio,
		2,
	)
})

//camera
// Base camera
const camera = new THREE.PerspectiveCamera(
	45,
	sizes.width / sizes.height,
	0.1,
	100,
)

camera.position.x = 4
camera.position.y = 2
camera.position.z = 4

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 0
controls.maxDistance = 10

//renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#1b1631'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(() => {
	renderer.setClearColor(debugObject.clearColor)
})

//animate
const clock = new THREE.Clock()

const tick = () => {
	const elapsedTime = clock.getElapsedTime()

	// Update materials
	firefliesMaterial.uniforms.uTime.value = elapsedTime

	// Update materials
	portalMaterial.uniforms.uTime.value = elapsedTime

	// Update controls
	controls.update()

	// Render
	renderer.render(scene, camera)

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()
