<template>
  <div class="topo-map-container">
    <div ref="mapContainer" class="w-full h-[80vh] border rounded-lg bg-gray-100 dark:bg-gray-800 relative overflow-hidden"
      @click="onMapClick">
      <!-- Estado de carga/error -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 z-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p class="text-sm text-gray-600 dark:text-gray-300">Cargando mapa 3D...</p>
        </div>
      </div>

      <div v-if="hasError" class="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 z-20">
        <div class="text-center p-4">
          <div class="text-red-500 mb-2">⚠️</div>
          <h3 class="font-bold text-red-700 dark:text-red-300">Error al cargar el mapa</h3>
          <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ errorMessage }}</p>
          <button @click="retryInit" class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
            Reintentar
          </button>
        </div>
      </div>

      <!-- Overlay para información de zona -->
      <div v-if="selectedZone" class="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg z-10">
        <h3 class="font-bold">{{ selectedZone.name }}</h3>
        <p class="text-sm">{{ selectedZone.description }}</p>
      </div>

      <!-- Controles de cámara -->
      <div v-if="!isLoading && !hasError"
        class="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-10">
        Click + Drag: Rotar | Scroll: Zoom | Clic en zonas: Info
      </div>

      <!-- Debug info -->
      <div v-if="showDebugInfo"
        class="absolute bottom-4 left-4 bg-blue-900/80 text-white p-2 rounded text-xs z-10 max-w-xs">
        <div>WebGL: {{ webglSupported ? '✅' : '❌' }}</div>
        <div>Renderer: {{ rendererInfo }}</div>
        <div>Scene objects: {{ sceneObjectCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface MapZone {
  name: string
  description: string
  x: number
  z: number
  color?: number
}

// Props
const props = defineProps<{
  colorMapPath?: string
  heightMapPath?: string
  zones?: MapZone[]
}>()

// Reactive refs
const mapContainer = ref<HTMLDivElement>()
const selectedZone = ref<MapZone | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const showDebugInfo = ref(true)
const webglSupported = ref(false)
const rendererInfo = ref('N/A')
const sceneObjectCount = ref(0)

// Three.js variables - todos inicializados como null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let mapMesh: THREE.Mesh | null = null
let interactables: THREE.Mesh[] = []
let raycaster: THREE.Raycaster | null = null
let pointer: THREE.Vector2 | null = null
let animationId: number | null = null

// Default zones based on Pilotes map - MASSIVE EPIC SCALE with detailed districts
const defaultZones: MapZone[] = [
  // === ZONA NOBLE PALERMO - Múltiples sub-distritos ===
  {
    name: "PALERMO ALTO - Distrito Ducal",
    description: "Palacios de la alta nobleza, embajadas y residencias ducales",
    x: -80,
    z: -60,
    color: 0xFFD700
  },
  {
    name: "PALERMO MEDIO - Barrio Noble", 
    description: "Mansiones de condes y marqueses con jardines privados",
    x: -60,
    z: -40,
    color: 0x8B4513
  },
  {
    name: "PALERMO BAJO - Comerciantes Ricos",
    description: "Residencias de mercaderes prósperos y banqueros",
    x: -40,
    z: -20,
    color: 0xDEB887
  },
  
  // === ZONA INDUSTRIAL OPUS - Complejo masivo ===
  {
    name: "OPUS NORTE - Forjas Imperiales",
    description: "Complejos de herrería, fundiciones y armamento real",
    x: 60,
    z: 40,
    color: 0x8B0000
  },
  {
    name: "OPUS CENTRO - Gremios Artesanales",
    description: "Talleres especializados, carpintería y manufacturas",
    x: 80,
    z: 60,
    color: 0x4A4A4A
  },
  {
    name: "OPUS SUR - Textiles y Comercio",
    description: "Fábricas de textiles, tinturas y comercio especializado",
    x: 70,
    z: 80,
    color: 0x8B7355
  },
  
  // === PUERTO MASIVO - Múltiples bahías ===
  {
    name: "PUERTO REAL - Bahía Imperial",
    description: "Muelles reales, astilleros navales y flota de guerra",
    x: 120,
    z: 20,
    color: 0x000080
  },
  {
    name: "PUERTO COMERCIAL - Gran Bahía",
    description: "Puerto mercante masivo con comercio internacional",
    x: 140,
    z: 40,
    color: 0x1E90FF
  },
  {
    name: "PUERTO PESQUERO",
    description: "Flota pesquera, astilleros menores y procesamiento",
    x: 100,
    z: 60,
    color: 0x4682B4
  },
  
  // === DISTRITOS ESPECIALIZADOS ===
  {
    name: "Distrito Académico",
    description: "Universidad Imperial, bibliotecas y academias",
    x: -20,
    z: -60,
    color: 0x800080
  },
  {
    name: "Barrio de los Templos", 
    description: "Complejos religiosos, catedrales y monasterios",
    x: 20,
    z: -40,
    color: 0xFFFFFF
  },
  {
    name: "Distrito Militar",
    description: "Cuarteles, academias militares y arsenales",
    x: 40,
    z: -20,
    color: 0x696969
  },
  {
    name: "Barrio de los Mercaderes",
    description: "Mercados masivos, almacenes y casas comerciales",
    x: -40,
    z: 40,
    color: 0xDAA520
  },
  
  // === BARRIOS RESIDENCIALES MASIVOS ===
  {
    name: "Villa Norte",
    description: "Extensos barrios residenciales de clase media",
    x: 0,
    z: -100,
    color: 0xCD853F
  },
  {
    name: "Villa Este", 
    description: "Barrios trabajadores cerca del distrito industrial",
    x: 100,
    z: 0,
    color: 0xD2B48C
  },
  {
    name: "Villa Sur",
    description: "Comunidades agrícolas y barrios populares",
    x: 0,
    z: 120,
    color: 0xBDB76B
  },
  {
    name: "Villa Oeste",
    description: "Barrios artesanales y gremios menores",
    x: -100,
    z: 0,
    color: 0x8B7D6B
  },
  
  // === ZONAS CENTRALES ===
  {
    name: "Castillo Imperial",
    description: "Fortaleza masiva con múltiples complejos palatinos",
    x: 0,
    z: -80,
    color: 0xFFD700
  },
  {
    name: "Plaza Mayor Imperial",
    description: "Corazón ceremonial de la ciudad con monumentos",
    x: 0,
    z: 0,
    color: 0xF5DEB3
  },
  
  // === ZONAS EXTERIORES ===
  {
    name: "LAFE - Región Lacustre",
    description: "Gran lago con múltiples pueblos pesqueros y recreo",
    x: -150,
    z: 150,
    color: 0x20B2AA
  },
  {
    name: "Murallas Imperiales",
    description: "Sistema masivo de fortificaciones multicapa",
    x: 0,
    z: 80,
    color: 0x696969
  }
]

// Events
const emit = defineEmits<{
  zoneSelected: [zone: MapZone]
}>()

// Methods
const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    webglSupported.value = !!context
    return webglSupported.value
  } catch (e) {
    console.error('WebGL check failed:', e)
    webglSupported.value = false
    return false
  }
}

const initThreeJS = async (): Promise<void> => {
  try {
    if (!mapContainer.value) {
      throw new Error('Map container not available')
    }

    if (!checkWebGLSupport()) {
      throw new Error('WebGL not supported by this browser')
    }

    // Configuración básica de la escena
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xB0C4DE) // Azul pálido natural como cielo
    
    // Niebla atmosférica muy sutil para gran escala épica
    scene.fog = new THREE.Fog(0x87CEEB, 300, 800)  // Empezar más lejos y terminar más lejos

    // Configurar cámara
    const containerWidth = mapContainer.value.clientWidth
    const containerHeight = mapContainer.value.clientHeight

    camera = new THREE.PerspectiveCamera(
      45,
      containerWidth / containerHeight,
      0.1,
      1000
    )

    // Configurar renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })

    renderer.setSize(containerWidth, containerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limitar pixel ratio para performance
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Obtener info del renderer
    const gl = renderer.getContext()
    rendererInfo.value = gl.getParameter(gl.RENDERER)

    mapContainer.value.appendChild(renderer.domElement)

    // Configurar controles de cámara
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2.2
    controls.minDistance = 5     // Zoom muy cercano para detalles finos
    controls.maxDistance = 800   // Zoom masivo para ver toda la metrópolis épica incluyendo el lago

    // Agregar luces con tonalidad natural medieval
    const ambientLight = new THREE.AmbientLight(0xF5F5DC, 0.6) // Luz ambiente beige suave
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xFFF8DC, 0.8) // Luz dorada suave
    directionalLight.position.set(12, 15, 8)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -25
    directionalLight.shadow.camera.right = 25
    directionalLight.shadow.camera.top = 25
    directionalLight.shadow.camera.bottom = -25
    scene.add(directionalLight)
    
    // Luz adicional suave para rellenar sombras
    const fillLight = new THREE.DirectionalLight(0xE6E6FA, 0.2)  // Lavanda muy suave
    fillLight.position.set(-8, 10, -5)
    scene.add(fillLight)

    // Crear ciudad 3D procedural completa
    await create3DProceduralCity()

    // Crear zonas interactivas
    createInteractiveZones()

    // Add test structures to verify rendering
    const testCube1 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    )
    testCube1.position.set(10, 2.5, 10)
    scene.add(testCube1)

    const testCube2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshLambertMaterial({ color: 0x00ff00 })
    )
    testCube2.position.set(-10, 2.5, -10)
    scene.add(testCube2)

    // Add a large reference marker at the lake position
    const lakeMarker = new THREE.Mesh(
      new THREE.BoxGeometry(20, 20, 20),
      new THREE.MeshLambertMaterial({ color: 0xff00ff }) // Magenta marker
    )
    lakeMarker.position.set(0, 10, -400)
    scene.add(lakeMarker)

    console.log('Lake marker added at (0, 10, -400)')

    // Configurar raycasting
    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    // Posición inicial de la cámara - vista amplia para ver toda la ciudad y el lago
    if (camera) {
      camera.position.set(0, 150, -100) // Más alto y hacia atrás para ver todo
    }

    if (controls) {
      controls.target.set(0, 0, -200) // Target entre la ciudad y el lago
      controls.maxDistance = 800 // Permitir zoom out masivo
      controls.minDistance = 5   // Zoom in muy cercano para ver detalles finos
      controls.update()
    }

    // Actualizar contador de objetos
    sceneObjectCount.value = scene.children.length

    console.log('Three.js initialized successfully')
    console.log(`Scene contains ${scene.children.length} objects`)

    // Log some object types for debugging
    scene.children.forEach((child, index) => {
      if (index < 10) { // Log first 10 objects
        console.log(`Object ${index}: ${child.type} at (${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)})`)
      }
    })
    isLoading.value = false

    // Iniciar loop de animación
    animate()

  } catch (error) {
    console.error('Error initializing Three.js:', error)
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error'
    isLoading.value = false
  }
}

const createDetailedMap = async (): Promise<void> => {
  if (!scene) return

  console.log('Creating detailed map...')

  try {
    // Usar el mapa real de Pilotes si existe, sino crear uno procedural
    const mapImage = '/assets/maps/pilotes_map.png'

    // Intentar cargar la imagen real primero
    const colorTexture = await loadTextureWithFallback(mapImage)
    const heightTexture = await createHeightMapFromColor(colorTexture)

    // Material con displacement mapping
    const material = new THREE.MeshStandardMaterial({
      map: colorTexture,
      displacementMap: heightTexture,
      displacementScale: 2.0, // Mayor relieve
      roughness: 0.7,
      metalness: 0.1
    })

    // Geometría con muchos segmentos para el displacement
    const geometry = new THREE.PlaneGeometry(20, 20, 256, 256)
    mapMesh = new THREE.Mesh(geometry, material)
    mapMesh.rotation.x = -Math.PI / 2
    mapMesh.receiveShadow = true

    scene.add(mapMesh)
    console.log('Detailed map created with displacement mapping')

  } catch (error) {
    console.warn('Failed to create detailed map, using basic version:', error)
    await createBasicMap()
  }
}

const loadTextureWithFallback = async (imagePath: string): Promise<THREE.Texture> => {
  return new Promise((resolve) => {
    const textureLoader = new THREE.TextureLoader()

    textureLoader.load(
      imagePath,
      (texture) => {
        // Configurar la textura
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        console.log('Loaded real map texture from:', imagePath)
        resolve(texture)
      },
      undefined,
      (error) => {
        console.warn('Could not load map texture, creating procedural one:', error)
        // Crear textura procedural basada en el mapa de Pilotes
        const proceduralTexture = createPilotesStyleTexture()
        resolve(proceduralTexture)
      }
    )
  })
}

const createPilotesStyleTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  // Fondo base color pergamino
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512)
  gradient.addColorStop(0, '#E6D3A3') // Color pergamino claro
  gradient.addColorStop(0.8, '#D4B896') // Color pergamino medio
  gradient.addColorStop(1, '#A0956B') // Color pergamino oscuro

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 1024)

  // Muralla circular principal (basada en tu imagen)
  ctx.strokeStyle = '#8B7355'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(512, 512, 400, 0, Math.PI * 2)
  ctx.stroke()

  // Área del castillo central
  ctx.fillStyle = '#9C8A6B'
  ctx.fillRect(460, 300, 120, 100)
  ctx.fillRect(480, 280, 80, 40) // Torre principal

  // Distrito Palermo (izquierda)
  ctx.fillStyle = '#B8A082'
  for (let i = 0; i < 15; i++) {
    const x = 200 + Math.random() * 150
    const y = 400 + Math.random() * 150
    const size = 15 + Math.random() * 10
    ctx.fillRect(x, y, size, size)
  }

  // Distrito Opus (derecha)
  ctx.fillStyle = '#A69178'
  for (let i = 0; i < 18; i++) {
    const x = 650 + Math.random() * 150
    const y = 400 + Math.random() * 150
    const size = 12 + Math.random() * 12
    ctx.fillRect(x, y, size, size)
  }

  // Puerto (abajo derecha)
  ctx.fillStyle = '#7A9BB8' // Azul agua
  ctx.fillRect(700, 700, 200, 150)

  // Estructuras del puerto
  ctx.fillStyle = '#8B7355'
  for (let i = 0; i < 8; i++) {
    const x = 720 + i * 20
    const y = 720 + Math.random() * 20
    ctx.fillRect(x, y, 15, 40)
  }

  // Lago Lafe (abajo izquierda, fuera de murallas)
  ctx.fillStyle = '#6B8BA3'
  ctx.beginPath()
  ctx.arc(200, 800, 80, 0, Math.PI * 2)
  ctx.fill()

  // Áreas verdes y vegetación
  ctx.fillStyle = '#7A8471'
  for (let i = 0; i < 25; i++) {
    const x = 100 + Math.random() * 824
    const y = 100 + Math.random() * 824
    const radius = 15 + Math.random() * 25
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Textura de pergamino (líneas sutiles)
  ctx.strokeStyle = 'rgba(139, 115, 85, 0.1)'
  ctx.lineWidth = 1
  for (let i = 0; i < 100; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * 1024, Math.random() * 1024)
    ctx.lineTo(Math.random() * 1024, Math.random() * 1024)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true

  return texture
}

const createHeightMapFromColor = async (colorTexture: THREE.Texture): Promise<THREE.Texture> => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Si tenemos la textura de color, intentar extraer información de altura
  if (colorTexture.source?.data) {
    // Crear mapa de altura basado en la luminosidad de la textura de color
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 512
    tempCanvas.height = 512
    const tempCtx = tempCanvas.getContext('2d')!

    // Dibujar la textura de color escalada
    const img = colorTexture.source.data
    if (img instanceof HTMLCanvasElement || img instanceof HTMLImageElement) {
      tempCtx.drawImage(img, 0, 0, 512, 512)
      const imageData = tempCtx.getImageData(0, 0, 512, 512)

      // Convertir a escala de grises basada en elevación lógica
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]

        // Lógica de altura basada en colores del mapa
        let heightValue = 0

        // Agua (azules) = bajo
        if (b > r + 20 && b > g + 20) {
          heightValue = 0
        }
        // Estructuras (grises/marrones) = alto
        else if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
          heightValue = 200
        }
        // Vegetación (verdes) = medio-bajo
        else if (g > r + 10 && g > b + 10) {
          heightValue = 80
        }
        // Edificios/castillo = muy alto
        else if (r > 150 && g > 120 && b < 100) {
          heightValue = 255
        }
        // Terreno normal = medio
        else {
          heightValue = 100
        }

        imageData.data[i] = heightValue     // R
        imageData.data[i + 1] = heightValue // G  
        imageData.data[i + 2] = heightValue // B
        // Alpha permanece igual
      }

      ctx.putImageData(imageData, 0, 0)
    }
  } else {
    // Crear mapa de altura procedural para Pilotes
    // Fondo bajo (terreno)
    ctx.fillStyle = '#404040'
    ctx.fillRect(0, 0, 512, 512)

    // Muralla - elevación media
    ctx.strokeStyle = '#808080'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.arc(256, 256, 200, 0, Math.PI * 2)
    ctx.stroke()

    // Castillo central - máxima elevación
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(230, 150, 60, 50)
    ctx.fillRect(240, 130, 40, 20) // Torre

    // Edificios en distritos - elevación media-alta
    ctx.fillStyle = '#CCCCCC'

    // Palermo
    for (let i = 0; i < 20; i++) {
      const x = 100 + Math.random() * 75
      const y = 200 + Math.random() * 75
      const size = 8 + Math.random() * 6
      ctx.fillRect(x, y, size, size)
    }

    // Opus  
    for (let i = 0; i < 25; i++) {
      const x = 325 + Math.random() * 75
      const y = 200 + Math.random() * 75
      const size = 6 + Math.random() * 8
      ctx.fillRect(x, y, size, size)
    }

    // Puerto - elevación baja
    ctx.fillStyle = '#202020'
    ctx.fillRect(350, 350, 100, 75)

    // Lago - mínima elevación
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(100, 400, 40, 0, Math.PI * 2)
    ctx.fill()
  }

  // Aplicar desenfoque para transiciones suaves
  ctx.filter = 'blur(3px)'
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(canvas, 0, 0)

  const heightTexture = new THREE.CanvasTexture(canvas)
  heightTexture.wrapS = heightTexture.wrapT = THREE.ClampToEdgeWrapping
  heightTexture.needsUpdate = true

  return heightTexture
}

const createBasicMap = async (): Promise<void> => {
  if (!scene) return

  console.log('Creating basic fallback map')

  // Crear una geometría simple con un material básico visible (fallback)
  const geometry = new THREE.PlaneGeometry(12, 12, 32, 32)
  const material = new THREE.MeshLambertMaterial({
    color: 0x228B22, // Verde para el terreno
    wireframe: false
  })

  mapMesh = new THREE.Mesh(geometry, material)
  mapMesh.rotation.x = -Math.PI / 2 // Acostar el plano
  mapMesh.receiveShadow = true

  scene.add(mapMesh)
  console.log('Basic fallback map created')

  // Add a test cube to ensure rendering works
  const testGeometry = new THREE.BoxGeometry(2, 2, 2)
  const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
  const testCube = new THREE.Mesh(testGeometry, testMaterial)
  testCube.position.set(0, 1, 0)
  scene.add(testCube)
  console.log('Test cube added at (0, 1, 0)')
}

const createInteractiveZones = (): void => {
  if (!scene) return

  const zones = props.zones || defaultZones

  zones.forEach((zone, index) => {
    try {
      // Crear geometría visible para la zona
      const zoneGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8)
      const zoneMat = new THREE.MeshStandardMaterial({
        color: zone.color || 0xff0000,
        transparent: true,
        opacity: 0.7
      })

      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat)

      // Verificar que las coordenadas son válidas
      if (typeof zone.x === 'number' && typeof zone.z === 'number') {
        zoneMesh.position.set(zone.x, 0.8, zone.z)
        zoneMesh.userData = { zone }

        scene.add(zoneMesh)
        interactables.push(zoneMesh)

        console.log(`Created zone ${zone.name} at position (${zone.x}, ${zone.z})`)
      } else {
        console.warn(`Invalid coordinates for zone ${zone.name}:`, zone)
      }
    } catch (error) {
      console.error(`Error creating zone ${zone.name}:`, error)
    }
  })
}

const onMapClick = (event: MouseEvent): void => {
  try {
    if (!mapContainer.value || !raycaster || !pointer || !camera) return

    const rect = mapContainer.value.getBoundingClientRect()

    // Calcular coordenadas normalizadas
    if (pointer) {
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    if (raycaster && camera) {
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(interactables)

      if (intersects.length > 0) {
        const hitObject = intersects[0].object
        const zone = hitObject.userData?.zone

        if (zone) {
          selectedZone.value = zone
          emit('zoneSelected', zone)

          // Auto-ocultar después de unos segundos
          setTimeout(() => {
            if (selectedZone.value === zone) {
              selectedZone.value = null
}

const createUrbanInfrastructure = async (): Promise<void> => {
  if (!scene) return
  
  const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })  // Piedra gris
  const cobbleMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 })  // Adoquín gris pizarra
  const marketMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })  // Madera castaña
  const fountainMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }) // Piedra clara
  
  // ============ RED VIAL PRINCIPAL - Sistema épico de calles ============
  
  // AVENIDA IMPERIAL - Arteria principal Norte-Sur (Castillo -> Puerto)
  const imperialAvenueGeometry = new THREE.BoxGeometry(8, 0.2, 120)
  const imperialAvenue = new THREE.Mesh(imperialAvenueGeometry, cobbleMaterial)
  imperialAvenue.position.set(5, 0.05, 0)
  scene.add(imperialAvenue)
  
  // AVENIDA COMERCIAL - Arteria Este-Oeste (Palermo -> Opus)
  const commercialAvenueGeometry = new THREE.BoxGeometry(120, 0.2, 6)
  const commercialAvenue = new THREE.Mesh(commercialAvenueGeometry, streetMaterial)
  commercialAvenue.position.set(0, 0.05, 0)
  scene.add(commercialAvenue)
  
  // CALLES SECUNDARIAS - Red de distribución
  const secondaryStreets = [
    // Conexiones norte
    { x: -15, z: -10, width: 40, depth: 3, rotation: 0 },
    { x: 20, z: -15, width: 35, depth: 3, rotation: 0 },
    
    // Conexiones sur  
    { x: -10, z: 25, width: 50, depth: 3, rotation: 0 },
    { x: 25, z: 20, width: 40, depth: 3, rotation: 0 },
    
    // Conexiones radiales
    { x: -20, z: 5, width: 3, depth: 30, rotation: 0 },
    { x: 30, z: -5, width: 3, depth: 25, rotation: 0 },
    { x: 15, z: 15, width: 3, depth: 20, rotation: 0 }
  ]
  
  secondaryStreets.forEach(street => {
    const streetGeometry = new THREE.BoxGeometry(street.width, 0.15, street.depth)
    const streetMesh = new THREE.Mesh(streetGeometry, streetMaterial)
    streetMesh.position.set(street.x, 0.04, street.z)
    streetMesh.rotation.y = street.rotation
    scene.add(streetMesh)
  })
  
  // ============ PLAZA MAYOR CENTRAL - Corazón de la ciudad ============
  const grandPlazaGeometry = new THREE.CircleGeometry(18, 32)
  const grandPlazaMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C })  // Tan natural
  const grandPlaza = new THREE.Mesh(grandPlazaGeometry, grandPlazaMaterial)
  grandPlaza.rotation.x = -Math.PI / 2
  grandPlaza.position.set(0, 0.08, 0)
  scene.add(grandPlaza)
  
  // Fuente monumental central
  const grandFountainGeometry = new THREE.CylinderGeometry(5, 6, 3, 24)
  const grandFountain = new THREE.Mesh(grandFountainGeometry, fountainMaterial)
  grandFountain.position.set(0, 1.5, 0)
  scene.add(grandFountain)
  
  // Obelisco central (símbolo de la ciudad)
  const obeliskGeometry = new THREE.ConeGeometry(1, 12, 4)
  const obeliskMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })  // Piedra clara
  const obelisk = new THREE.Mesh(obeliskGeometry, obeliskMaterial)
  obelisk.position.set(0, 9, 0)
  scene.add(obelisk)
  
  // Bancos ornamentales alrededor de la plaza
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    const benchX = Math.cos(angle) * 12
    const benchZ = Math.sin(angle) * 12
    
    const benchGeometry = new THREE.BoxGeometry(3, 0.8, 1)
    const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const bench = new THREE.Mesh(benchGeometry, benchMaterial)
    bench.position.set(benchX, 0.4, benchZ)
    bench.rotation.y = angle + Math.PI / 2
    scene.add(bench)
    
    // Farolas
    const lamppostGeometry = new THREE.CylinderGeometry(0.2, 0.3, 4, 8)
    const lamppost = new THREE.Mesh(lamppostGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
    lamppost.position.set(benchX * 1.3, 2, benchZ * 1.3)
    scene.add(lamppost)
    
    const lampGeometry = new THREE.SphereGeometry(0.5, 8, 6)
    const lampMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFFFFAA, 
      emissive: 0xFFFF88, 
      emissiveIntensity: 0.3 
    })
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial)
    lamp.position.set(benchX * 1.3, 4.5, benchZ * 1.3)
    scene.add(lamp)
  }
  
  // ============ MERCADO CENTRAL - Zona comercial ============
  const marketPlazaGeometry = new THREE.BoxGeometry(25, 0.1, 20)
  const marketPlaza = new THREE.Mesh(marketPlazaGeometry, new THREE.MeshLambertMaterial({ color: 0xDEB887 }))
  marketPlaza.position.set(-8, 0.06, 18)
  scene.add(marketPlaza)
  
  // Puestos de mercado masivos
  const marketStalls = [
    // Fila Norte - Alimentos
    { x: -15, z: 12, type: 'food', name: 'Panadería Central' },
    { x: -10, z: 12, type: 'food', name: 'Carnicería Real' },
    { x: -5, z: 12, type: 'food', name: 'Especias del Reino' },
    { x: 0, z: 12, type: 'food', name: 'Pescadería Fresca' },
    
    // Fila Central - Artesanías
    { x: -15, z: 18, type: 'crafts', name: 'Alfarería Fina' },
    { x: -10, z: 18, type: 'crafts', name: 'Joyería de Lujo' },
    { x: -5, z: 18, type: 'crafts', name: 'Cuero y Pieles' },
    { x: 0, z: 18, type: 'crafts', name: 'Instrumentos Musicales' },
    
    // Fila Sur - Textiles
    { x: -15, z: 24, type: 'textiles', name: 'Sedas Imperiales' },
    { x: -10, z: 24, type: 'textiles', name: 'Lanas del Norte' },
    { x: -5, z: 24, type: 'textiles', name: 'Tinturas Exóticas' },
    { x: 0, z: 24, type: 'textiles', name: 'Tapices Reales' }
  ]
  
  marketStalls.forEach(stall => {
    // Estructura del puesto
    const stallGeometry = new THREE.BoxGeometry(3, 3, 3)
    let stallColor = 0x8B4513
    if (stall.type === 'food') stallColor = 0xDEB887
    else if (stall.type === 'crafts') stallColor = 0x8B7355
    else if (stall.type === 'textiles') stallColor = 0xD2B48C
    
    const stallMaterial = new THREE.MeshLambertMaterial({ color: stallColor })
    const stallMesh = new THREE.Mesh(stallGeometry, stallMaterial)
    stallMesh.position.set(stall.x, 1.5, stall.z)
    scene.add(stallMesh)
    
    // Toldo
    const canopyGeometry = new THREE.BoxGeometry(4, 0.2, 4)
    const canopyColors = [0x8B4513, 0x654321, 0x5D4E37, 0x8B7355]  // Tonos marrones naturales
    const canopyMaterial = new THREE.MeshLambertMaterial({ 
      color: canopyColors[Math.floor(Math.random() * canopyColors.length)] 
    })
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial)
    canopy.position.set(stall.x, 3.5, stall.z)
    scene.add(canopy)
    
    // Postes del toldo
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 6)
        const pole = new THREE.Mesh(poleGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        pole.position.set(stall.x + i * 1.8, 2.5, stall.z + j * 1.8)
        scene.add(pole)
      }
    }
    
    // Mercancía específica por tipo
    if (stall.type === 'food') {
      // Barriles y cestas
      for (let i = 0; i < 4; i++) {
        const barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8)
        const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        barrel.position.set(
          stall.x + (i % 2 - 0.5) * 2,
          0.4,
          stall.z + (Math.floor(i / 2) - 0.5) * 2
        )
        scene.add(barrel)
      }
    }
    
    if (stall.type === 'crafts') {
      // Herramientas y artesanías
      for (let i = 0; i < 3; i++) {
        const toolGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.2)
        const tool = new THREE.Mesh(toolGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
        tool.position.set(
          stall.x + (i - 1) * 0.8,
          1,
          stall.z
        )
        scene.add(tool)
      }
    }
    
    if (stall.type === 'textiles') {
      // Rollos de tela
      for (let i = 0; i < 5; i++) {
        const fabricGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8)
        const fabricColors = [0x8B4513, 0x654321, 0x5D4E37, 0x8B7355, 0x696969]  // Tonos naturales
        const fabric = new THREE.Mesh(fabricGeometry, new THREE.MeshLambertMaterial({ 
          color: fabricColors[i] 
        }))
        fabric.position.set(
          stall.x + Math.cos(i) * 1,
          1,
          stall.z + Math.sin(i) * 1
        )
        fabric.rotation.z = Math.PI / 2
        scene.add(fabric)
      }
    }
  })
  
  // ============ POSADAS Y TABERNAS - Vida nocturna ============
  const inns = [
    { name: 'El Dragón Dorado', x: 12, z: 8, size: 'large' },
    { name: 'La Corona Real', x: -20, z: 12, size: 'medium' },
    { name: 'El Martillo y Yunque', x: 18, z: 22, size: 'medium' },
    { name: 'La Sirena del Puerto', x: 35, z: -5, size: 'large' },
    { name: 'El Caballo Blanco', x: -12, z: -8, size: 'small' },
    { name: 'La Mesa Redonda', x: 8, z: -12, size: 'medium' }
  ]
  
  inns.forEach(inn => {
    const width = inn.size === 'large' ? 8 : inn.size === 'medium' ? 6 : 4
    const height = inn.size === 'large' ? 6 : inn.size === 'medium' ? 5 : 4
    const depth = inn.size === 'large' ? 10 : inn.size === 'medium' ? 8 : 6
    
    // Edificio principal
    const innGeometry = new THREE.BoxGeometry(width, height, depth)
    const innMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7D6B })  // Piedra beige natural
    const innMesh = new THREE.Mesh(innGeometry, innMaterial)
    innMesh.position.set(inn.x, height/2, inn.z)
    innMesh.castShadow = true
    scene.add(innMesh)
    
    // Tejado distintivo
    const roofGeometry = new THREE.BoxGeometry(width + 0.5, 1, depth + 0.5)
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(inn.x, height + 0.5, inn.z)
    scene.add(roof)
    
    // Cartel de la posada
    const signGeometry = new THREE.BoxGeometry(2, 1.2, 0.2)
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })  // Madera natural
    const sign = new THREE.Mesh(signGeometry, signMaterial)
    sign.position.set(inn.x, height - 0.5, inn.z + depth/2 + 0.5)
    scene.add(sign)
    
    // Chimenea (posadas siempre tienen fogón)
    const chimneyGeometry = new THREE.BoxGeometry(1, 3, 1)
    const chimney = new THREE.Mesh(chimneyGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
    chimney.position.set(inn.x + width/3, height + 2, inn.z)
    scene.add(chimney)
    
    // Establos adjuntos para posadas grandes
    if (inn.size === 'large') {
      const stableGeometry = new THREE.BoxGeometry(5, 3, 8)
      const stable = new THREE.Mesh(stableGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      stable.position.set(inn.x + width + 3, 1.5, inn.z)
      scene.add(stable)
    }
  })
  
  // ============ PUENTES - Conexiones épicas ============
  const bridges = [
    { name: 'Puente Imperial', x1: -8, z1: -5, x2: 18, z2: 5, type: 'stone' },
    { name: 'Puente del Mercado', x1: -25, z1: 15, x2: -5, z2: 25, type: 'wood' },
    { name: 'Puente Noble', x1: -35, z1: -10, x2: -15, z2: 5, type: 'ornate' }
  ]
  
  bridges.forEach(bridge => {
    const length = Math.sqrt(Math.pow(bridge.x2 - bridge.x1, 2) + Math.pow(bridge.z2 - bridge.z1, 2))
    const angle = Math.atan2(bridge.z2 - bridge.z1, bridge.x2 - bridge.x1)
    const midX = (bridge.x1 + bridge.x2) / 2
    const midZ = (bridge.z1 + bridge.z2) / 2
    
    let bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
    if (bridge.type === 'wood') bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    else if (bridge.type === 'ornate') bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 })
    
    const bridgeGeometry = new THREE.BoxGeometry(length, 0.8, 4)
    const bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial)
    bridgeMesh.position.set(midX, 0.4, midZ)
    bridgeMesh.rotation.y = angle
    scene.add(bridgeMesh)
    
    // Barandillas
    for (let side = -1; side <= 1; side += 2) {
      const railingGeometry = new THREE.BoxGeometry(length, 1, 0.2)
      const railing = new THREE.Mesh(railingGeometry, bridgeMaterial)
      railing.position.set(midX, 1.3, midZ + side * 1.9)
      railing.rotation.y = angle
      scene.add(railing)
    }
    
    // Pilares de soporte
    const numPiers = Math.max(2, Math.floor(length / 8))
    for (let i = 0; i < numPiers; i++) {
      const pierX = bridge.x1 + (bridge.x2 - bridge.x1) * (i / (numPiers - 1))
      const pierZ = bridge.z1 + (bridge.z2 - bridge.z1) * (i / (numPiers - 1))
      
      const pierGeometry = new THREE.CylinderGeometry(1, 1.5, 4, 8)
      const pier = new THREE.Mesh(pierGeometry, bridgeMaterial)
      pier.position.set(pierX, 1.5, pierZ)
      scene.add(pier)
    }
  })
}
          }, 4000)
        }
      } else {
        selectedZone.value = null
      }
    }
  } catch (error) {
    console.error('Error handling map click:', error)
  }
}

const animate = (): void => {
  if (hasError.value) return

  animationId = requestAnimationFrame(animate)

  try {
    if (controls) {
      controls.update()
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  } catch (error) {
    console.error('Animation error:', error)
    hasError.value = true
    errorMessage.value = 'Animation loop error'
  }
}

const handleResize = (): void => {
  if (!mapContainer.value || !camera || !renderer) return

  try {
    const width = mapContainer.value.clientWidth
    const height = mapContainer.value.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  } catch (error) {
    console.error('Resize error:', error)
  }
}

const retryInit = async (): Promise<void> => {
  hasError.value = false
  errorMessage.value = ''
  isLoading.value = true

  // Limpiar recursos anteriores
  cleanup()

  // Esperar un momento antes de reintentar
  await new Promise(resolve => setTimeout(resolve, 100))
  await initThreeJS()
}

const cleanup = (): void => {
  // Cancelar animación
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  // Limpiar controles
  if (controls) {
    controls.dispose()
    controls = null
  }

  // Limpiar renderer
  if (renderer && mapContainer.value) {
    try {
      mapContainer.value.removeChild(renderer.domElement)
      renderer.dispose()
      renderer = null
    } catch (e) {
      // El elemento podría ya haber sido removido
    }
  }

  // Limpiar geometrías y materiales
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })
    scene = null
  }

  // Reiniciar arrays
  interactables = []

  // Reiniciar variables
  mapMesh = null
  camera = null
  raycaster = null
  pointer = null
}

const create3DProceduralCity = async (): Promise<void> => {
  if (!scene) return

  try {
    console.log('Creating 3D procedural city of Pilotes...')
    
    // 1. Crear terreno base
    await createTerrain()
    
    // 2. Crear murallas circulares
    await createCityWalls()
    
    // 3. Crear castillo central
    await createCastle()
    
    // 4. Crear distrito Palermo
    await createPalermoDistrict()
    
    // 5. Crear distrito Opus
    await createOpusDistrict()
    
    // 6. Crear puerto
    await createPort()
    
    // 7. Crear VILLAS RESIDENCIALES MASIVAS
    await createMassiveVillaDistricts()
    
    // 8. Crear infraestructura urbana masiva
    await createUrbanInfrastructure()
    
    // 9. Crear lago Lafe y entorno
    console.log('About to create lake and surroundings...')
    try {
      await createLakeAndSurroundings()
      console.log('Lake creation completed successfully')
    } catch (error) {
      console.error('Error creating lake and surroundings:', error)
    }

    // 10. Crear vegetación y árboles
    await createVegetation()
    
    console.log('3D procedural city completed!')
    
  } catch (error) {
    console.error('Error creating 3D city:', error)
    // Fallback a mapa básico
    await createBasicMap()
  }
}

const createTerrain = async (): Promise<void> => {
  if (!scene) return
  
  // ============ TERRENO BASE ÉPICAMENTE MASIVO - 5x más grande que antes ============
  const terrainGeometry = new THREE.CircleGeometry(500, 512) // 500 unidades de radio = área GIGANTESCA
  const terrainMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B7D6B, // Color tierra natural
  })
  
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  terrain.rotation.x = -Math.PI / 2
  terrain.receiveShadow = true
  scene.add(terrain)
  
  // ============ OCÉANO ÉPICO CIRCUNDANTE ============
  const oceanGeometry = new THREE.CircleGeometry(800, 512) // Océano masivo
  const oceanMaterial = new THREE.MeshLambertMaterial({
    color: 0x4682B4,  // Azul acero natural
    transparent: true,
    opacity: 0.85
  })
  
  const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial)
  ocean.rotation.x = -Math.PI / 2
  ocean.position.y = -3
  scene.add(ocean)
  
  // ============ ISLAS CIRCUNDANTES - Archipiélago masivo ============
  const outerIslands = [
    // Islas grandes al norte
    { x: -300, z: -400, radius: 40, height: 3, name: 'Isla del Norte Mayor' },
    { x: 200, z: -450, radius: 35, height: 4, name: 'Isla de los Vientos' },
    { x: 0, z: -380, radius: 25, height: 2, name: 'Isla Centinela' },
    
    // Islas del este
    { x: 450, z: -100, radius: 50, height: 5, name: 'Gran Isla Oriental' },
    { x: 380, z: 150, radius: 30, height: 3, name: 'Isla de las Especias' },
    { x: 420, z: 0, radius: 20, height: 2, name: 'Isla del Faro' },
    
    // Islas del sur
    { x: -150, z: 400, radius: 45, height: 4, name: 'Isla Austral' },
    { x: 100, z: 450, radius: 35, height: 3, name: 'Isla de los Pescadores' },
    { x: 250, z: 380, radius: 25, height: 2, name: 'Isla del Coral' },
    
    // Islas del oeste  
    { x: -450, z: 80, radius: 40, height: 3, name: 'Isla Occidental' },
    { x: -400, z: -120, radius: 30, height: 4, name: 'Isla de las Tormentas' },
    { x: -380, z: 200, radius: 35, height: 3, name: 'Isla Verde' },
    
    // Islas menores dispersas
    { x: -200, z: -300, radius: 15, height: 1, name: 'Islote Norte' },
    { x: 300, z: -200, radius: 18, height: 1.5, name: 'Islote del Este' },
    { x: 180, z: 300, radius: 20, height: 2, name: 'Islote Sur' },
    { x: -280, z: 120, radius: 12, height: 1, name: 'Islote Oeste' },
    { x: -100, z: -250, radius: 10, height: 0.5, name: 'Peñasco Norte' },
    { x: 250, z: -300, radius: 8, height: 0.8, name: 'Peñasco Oriental' }
  ]
  
  outerIslands.forEach(island => {
    const islandGeometry = new THREE.CircleGeometry(island.radius, 32)
    const islandMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x9ACD32, // Verde isla natural
      transparent: true,
      opacity: 0.9
    })
    const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial)
    islandMesh.rotation.x = -Math.PI / 2
    islandMesh.position.set(island.x, island.height, island.z)
    scene.add(islandMesh)
    
    // Vegetación en cada isla
    const numTrees = Math.floor(island.radius / 3)
    for (let i = 0; i < numTrees; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * island.radius * 0.7
      const treeX = island.x + Math.cos(angle) * distance
      const treeZ = island.z + Math.sin(angle) * distance
      
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8)
      const trunk = new THREE.Mesh(trunkGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      trunk.position.set(treeX, island.height + 1.5, treeZ)
      scene.add(trunk)
      
      const leavesGeometry = new THREE.SphereGeometry(1.5, 12, 8)
      const leaves = new THREE.Mesh(leavesGeometry, new THREE.MeshLambertMaterial({ color: 0x228B22 }))
      leaves.position.set(treeX, island.height + 4, treeZ)
      scene.add(leaves)
    }
    
    // Pequeños pueblos en las islas grandes
    if (island.radius > 30) {
      const numHouses = Math.floor(island.radius / 8)
      for (let i = 0; i < numHouses; i++) {
        const angle = (i / numHouses) * Math.PI * 2
        const houseDistance = island.radius * 0.5
        const houseX = island.x + Math.cos(angle) * houseDistance
        const houseZ = island.z + Math.sin(angle) * houseDistance
        
        const houseGeometry = new THREE.BoxGeometry(2, 2.5, 2.5)
        const house = new THREE.Mesh(houseGeometry, new THREE.MeshLambertMaterial({ color: 0x8B7D6B }))
        house.position.set(houseX, island.height + 1.25, houseZ)
        scene.add(house)
        
        const roofGeometry = new THREE.ConeGeometry(1.8, 1.5, 4)
        const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        roof.position.set(houseX, island.height + 3.25, houseZ)
        roof.rotation.y = Math.PI / 4
        scene.add(roof)
      }
    }
  })
  
  // ============ REGIONES CONTINENTALES ESPECIALIZADAS ============
  
  // REGIÓN NORTE - Tierras Altas (Montañas y Fortalezas)
  const northRegion = { x: 0, z: -300, radius: 80, height: 8 }
  const northRegionGeometry = new THREE.CircleGeometry(northRegion.radius, 32)
  const northRegionMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 }) // Gris montaña
  const northRegionMesh = new THREE.Mesh(northRegionGeometry, northRegionMaterial)
  northRegionMesh.rotation.x = -Math.PI / 2
  northRegionMesh.position.set(northRegion.x, northRegion.height, northRegion.z)
  scene.add(northRegionMesh)
  
  // REGIÓN ESTE - Tierras de Comercio (Colinas doradas)
  const eastRegion = { x: 300, z: 0, radius: 70, height: 4 }
  const eastRegionGeometry = new THREE.CircleGeometry(eastRegion.radius, 32)
  const eastRegionMaterial = new THREE.MeshLambertMaterial({ color: 0xDAA520 }) // Dorado comercial
  const eastRegionMesh = new THREE.Mesh(eastRegionGeometry, eastRegionMaterial)
  eastRegionMesh.rotation.x = -Math.PI / 2
  eastRegionMesh.position.set(eastRegion.x, eastRegion.height, eastRegion.z)
  scene.add(eastRegionMesh)
  
  // REGIÓN SUR - Tierras Agrícolas (Llanuras verdes)
  const southRegion = { x: 0, z: 300, radius: 90, height: 2 }
  const southRegionGeometry = new THREE.CircleGeometry(southRegion.radius, 32)
  const southRegionMaterial = new THREE.MeshLambertMaterial({ color: 0x9ACD32 }) // Verde agrícola
  const southRegionMesh = new THREE.Mesh(southRegionGeometry, southRegionMaterial)
  southRegionMesh.rotation.x = -Math.PI / 2
  southRegionMesh.position.set(southRegion.x, southRegion.height, southRegion.z)
  scene.add(southRegionMesh)
  
  // REGIÓN OESTE - Bosques Antiguos (Verde oscuro)
  const westRegion = { x: -300, z: 0, radius: 85, height: 3 }
  const westRegionGeometry = new THREE.CircleGeometry(westRegion.radius, 32)
  const westRegionMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F }) // Verde bosque
  const westRegionMesh = new THREE.Mesh(westRegionGeometry, westRegionMaterial)
  westRegionMesh.rotation.x = -Math.PI / 2
  westRegionMesh.position.set(westRegion.x, westRegion.height, westRegion.z)
  scene.add(westRegionMesh)
  
  // ============ ELEVACIONES DENTRO DE LA CIUDAD PRINCIPAL ============
  
  // Colina noble masiva (Palermo Alto) - MÁS GRANDE
  const noblehillGeometry = new THREE.CircleGeometry(60, 32) // Duplicado el tamaño
  const noblehillMaterial = new THREE.MeshLambertMaterial({ color: 0x9ACD32 })  // Verde oliva natural
  const nobleHill = new THREE.Mesh(noblehillGeometry, noblehillMaterial)
  nobleHill.rotation.x = -Math.PI / 2
  nobleHill.position.set(-120, 4, -100) // Movido más lejos
  scene.add(nobleHill)
  
  // Meseta industrial masiva (Opus) - MÁS GRANDE
  const industrialPlateauGeometry = new THREE.CircleGeometry(80, 32) // Duplicado
  const industrialPlateauMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 })  // Marrón tierra
  const industrialPlateau = new THREE.Mesh(industrialPlateauGeometry, industrialPlateauMaterial)
  industrialPlateau.rotation.x = -Math.PI / 2
  industrialPlateau.position.set(140, 3, 120) // Movido más lejos
  scene.add(industrialPlateau)
  
  // Colina del castillo masiva (elevación máxima) - MÁS GRANDE
  const castleHillGeometry = new THREE.CircleGeometry(50, 32) // Duplicado
  const castleHillMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 })  // Gris pizarra
  const castleHill = new THREE.Mesh(castleHillGeometry, castleHillMaterial)
  castleHill.rotation.x = -Math.PI / 2
  castleHill.position.set(0, 8, -160) // Movido mucho más al norte
  scene.add(castleHill)
  
  // ============ NUEVAS ELEVACIONES ADICIONALES ============
  
  // Colina del Templo (nueva)
  const templeHillGeometry = new THREE.CircleGeometry(40, 32)
  const templeHillMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
  const templeHill = new THREE.Mesh(templeHillGeometry, templeHillMaterial)
  templeHill.rotation.x = -Math.PI / 2
  templeHill.position.set(80, 6, -80)
  scene.add(templeHill)
  
  // Meseta Militar (nueva)
  const militaryPlateauGeometry = new THREE.CircleGeometry(45, 32)
  const militaryPlateauMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  const militaryPlateau = new THREE.Mesh(militaryPlateauGeometry, militaryPlateauMaterial)
  militaryPlateau.rotation.x = -Math.PI / 2
  militaryPlateau.position.set(-80, 5, 100)
  scene.add(militaryPlateau)
  
  // Colina Académica (nueva)
  const academicHillGeometry = new THREE.CircleGeometry(35, 32)
  const academicHillMaterial = new THREE.MeshLambertMaterial({ color: 0x9370DB })
  const academicHill = new THREE.Mesh(academicHillGeometry, academicHillMaterial)
  academicHill.rotation.x = -Math.PI / 2
  academicHill.position.set(-60, 4, -120)
  scene.add(academicHill)
}

const createCityWalls = async (): Promise<void> => {
  if (!scene) return
  
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })  // Piedra gris natural
  const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x778899 })
  
  // ============ SISTEMA DE MURALLAS MULTICAPA ÉPICO ============
  
  // MURALLA INTERIOR - Núcleo noble (Radio pequeño para el corazón)
  const innerWallRadius = { x: 80, z: 65 }
  await createWallRing(innerWallRadius, wallMaterial, towerMaterial, 'inner', 32)
  
  // MURALLA MEDIA - Distritos principales (Comercio y nobleza)
  const middleWallRadius = { x: 150, z: 120 }
  await createWallRing(middleWallRadius, wallMaterial, towerMaterial, 'middle', 48)
  
  // MURALLA EXTERIOR - Toda la ciudad (Incluye barrios trabajadores)
  const outerWallRadius = { x: 220, z: 180 }
  await createWallRing(outerWallRadius, wallMaterial, towerMaterial, 'outer', 64)
  
  // MURALLA EXTREMA - Límites absolutos (Incluye suburbios y granjas)
  const extremeWallRadius = { x: 320, z: 260 }
  await createWallRing(extremeWallRadius, wallMaterial, towerMaterial, 'extreme', 80)
  
  // ============ FORTIFICACIONES ESPECIALIZADAS ============
  
  // Murallas del Puerto (Protección costera)
  await createPortWalls()
  
  // Murallas de los Distritos Exteriores
  await createDistrictWalls()
  
  // Sistema de Torres de Vigilancia
  await createWatchTowers()
}

async function createWallRing(radius: {x: number, z: number}, wallMaterial: any, towerMaterial: any, type: string, numTowers: number): Promise<void> {
  if (!scene) return
  
  // Calcular altura según tipo de muralla
  let wallHeight = 8
  let towerHeight = 15
  if (type === 'inner') { wallHeight = 12; towerHeight = 20 }
  else if (type === 'middle') { wallHeight = 10; towerHeight = 18 }
  else if (type === 'outer') { wallHeight = 9; towerHeight = 16 }
  else if (type === 'extreme') { wallHeight = 7; towerHeight = 14 }
  
  // Crear segmentos de muralla entre torres
  const segments = numTowers * 2 // Dos segmentos por torre
  
  for (let i = 0; i < segments; i++) {
    const startAngle = (i / segments) * Math.PI * 2
    const endAngle = ((i + 1) / segments) * Math.PI * 2
    
    const startX = Math.cos(startAngle) * radius.x
    const startZ = Math.sin(startAngle) * radius.z
    const endX = Math.cos(endAngle) * radius.x
    const endZ = Math.sin(endAngle) * radius.z
    
    const segmentLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2))
    const segmentAngle = Math.atan2(endZ - startZ, endX - startX)
    
    const wallGeometry = new THREE.BoxGeometry(segmentLength, wallHeight, 2)
    const wallSegment = new THREE.Mesh(wallGeometry, wallMaterial)
    wallSegment.position.set((startX + endX) / 2, wallHeight / 2, (startZ + endZ) / 2)
    wallSegment.rotation.y = segmentAngle
    wallSegment.castShadow = true
    scene.add(wallSegment)
  }
  
  // TORRES DEFENSIVAS MASIVAS
  for (let i = 0; i < numTowers; i++) {
    const angle = (i / numTowers) * Math.PI * 2
    const x = Math.cos(angle) * radius.x
    const z = Math.sin(angle) * radius.z
    
    // Torre principal
    const towerRadius = type === 'inner' ? 4 : type === 'middle' ? 3.5 : 3
    const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius + 1, towerHeight, 16)
    const tower = new THREE.Mesh(towerGeometry, towerMaterial)
    tower.position.set(x, towerHeight / 2, z)
    tower.castShadow = true
    scene.add(tower)
    
    // Almenas en la parte superior
    const numMerlons = 16
    for (let j = 0; j < numMerlons; j++) {
      const merlonAngle = (j / numMerlons) * Math.PI * 2
      const merlonX = x + Math.cos(merlonAngle) * (towerRadius + 0.5)
      const merlonZ = z + Math.sin(merlonAngle) * (towerRadius + 0.5)
      
      const merlonGeometry = new THREE.BoxGeometry(1, 2, 0.8)
      const merlon = new THREE.Mesh(merlonGeometry, wallMaterial)
      merlon.position.set(merlonX, towerHeight + 1, merlonZ)
      scene.add(merlon)
    }
    
    // Tejado cónico
    const roofGeometry = new THREE.ConeGeometry(towerRadius + 1.5, 4, 16)
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(x, towerHeight + 3, z)
    scene.add(roof)
    
    // Bandera en torres importantes
    if (i % 4 === 0) {
      const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6, 8)
      const flagPole = new THREE.Mesh(flagPoleGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
      flagPole.position.set(x, towerHeight + 8, z)
      scene.add(flagPole)
      
      const flagGeometry = new THREE.PlaneGeometry(4, 3)
      const flagColors = [0xFF0000, 0x0000FF, 0xFFD700, 0x800080]
      const flag = new THREE.Mesh(flagGeometry, new THREE.MeshLambertMaterial({ 
        color: flagColors[Math.floor(i / 4) % flagColors.length] 
      }))
      flag.position.set(x + 2, towerHeight + 8, z)
      scene.add(flag)
    }
  }
  
  // PUERTAS MONUMENTALES (cada anillo tiene 8 puertas principales)
  const numGates = 8
  for (let i = 0; i < numGates; i++) {
    const angle = (i / numGates) * Math.PI * 2
    const gateX = Math.cos(angle) * radius.x * 0.95
    const gateZ = Math.sin(angle) * radius.z * 0.95
    
    // Arco principal
    const gateWidth = type === 'inner' ? 12 : 10
    const gateHeight = wallHeight + 3
    const gateArchGeometry = new THREE.BoxGeometry(gateWidth, gateHeight, 4)
    const gateMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
    const gateArch = new THREE.Mesh(gateArchGeometry, gateMaterial)
    gateArch.position.set(gateX, gateHeight / 2, gateZ)
    gateArch.rotation.y = angle
    scene.add(gateArch)
    
    // Torres gemelas flanqueando cada puerta
    for (let side = -1; side <= 1; side += 2) {
      const gateTowerRadius = towerRadius + 1
      const gateTowerGeometry = new THREE.CylinderGeometry(gateTowerRadius, gateTowerRadius + 0.5, towerHeight + 3, 12)
      const gateTower = new THREE.Mesh(gateTowerGeometry, towerMaterial)
      const offsetX = gateX + Math.cos(angle + Math.PI / 2) * side * (gateWidth / 2 + gateTowerRadius)
      const offsetZ = gateZ + Math.sin(angle + Math.PI / 2) * side * (gateWidth / 2 + gateTowerRadius)
      gateTower.position.set(offsetX, (towerHeight + 3) / 2, offsetZ)
      scene.add(gateTower)
      
      // Puente levadizo para puertas interiores
      if (type === 'inner' || type === 'middle') {
        const drawbridgeGeometry = new THREE.BoxGeometry(gateWidth, 0.8, 8)
        const drawbridge = new THREE.Mesh(drawbridgeGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        drawbridge.position.set(
          gateX + Math.cos(angle) * 6,
          0.4,
          gateZ + Math.sin(angle) * 6
        )
        drawbridge.rotation.y = angle
        scene.add(drawbridge)
      }
    }
  }
}

async function createPortWalls(): Promise<void> {
  if (!scene) return
  
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  
  // Murallas especiales que se extienden al mar para proteger el puerto
  const seaWalls = [
    { start: { x: 180, z: -20 }, end: { x: 250, z: -40 }, height: 6 },
    { start: { x: 200, z: 60 }, end: { x: 280, z: 80 }, height: 6 },
    { start: { x: 240, z: 20 }, end: { x: 300, z: 30 }, height: 8 }
  ]
  
  seaWalls.forEach(wall => {
    const length = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.z - wall.start.z, 2))
    const angle = Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x)
    
    const wallGeometry = new THREE.BoxGeometry(length, wall.height, 3)
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
    wallMesh.position.set(
      (wall.start.x + wall.end.x) / 2,
      wall.height / 2,
      (wall.start.z + wall.end.z) / 2
    )
    wallMesh.rotation.y = angle
    wallMesh.castShadow = true
    scene.add(wallMesh)
    
    // Torres de vigilancia costera
    const numTowers = Math.floor(length / 30)
    for (let i = 0; i <= numTowers; i++) {
      const t = i / numTowers
      const towerX = wall.start.x + t * (wall.end.x - wall.start.x)
      const towerZ = wall.start.z + t * (wall.end.z - wall.start.z)
      
      const coastalTowerGeometry = new THREE.CylinderGeometry(2.5, 3, wall.height + 4, 12)
      const coastalTower = new THREE.Mesh(coastalTowerGeometry, new THREE.MeshLambertMaterial({ color: 0x778899 }))
      coastalTower.position.set(towerX, (wall.height + 4) / 2, towerZ)
      scene.add(coastalTower)
    }
  })
}

async function createDistrictWalls(): Promise<void> {
  if (!scene) return
  
  // Murallas internas separando los principales distritos
  const districtBoundaries = [
    // Separación Palermo - Centro
    { start: { x: -180, z: -80 }, end: { x: -50, z: -20 }, height: 5 },
    
    // Separación Centro - Opus
    { start: { x: 30, z: -40 }, end: { x: 120, z: 80 }, height: 5 },
    
    // Separación Opus - Puerto
    { start: { x: 150, z: 20 }, end: { x: 180, z: 100 }, height: 4 },
    
    // Murallas de las villas exteriores
    { start: { x: -160, z: 120 }, end: { x: -80, z: 180 }, height: 4 },
    { start: { x: 80, z: 160 }, end: { x: 160, z: 200 }, height: 4 }
  ]
  
  const districtWallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7D6B })
  
  districtBoundaries.forEach(boundary => {
    const length = Math.sqrt(Math.pow(boundary.end.x - boundary.start.x, 2) + Math.pow(boundary.end.z - boundary.start.z, 2))
    const angle = Math.atan2(boundary.end.z - boundary.start.z, boundary.end.x - boundary.start.x)
    
    const wallGeometry = new THREE.BoxGeometry(length, boundary.height, 1.5)
    const wallMesh = new THREE.Mesh(wallGeometry, districtWallMaterial)
    wallMesh.position.set(
      (boundary.start.x + boundary.end.x) / 2,
      boundary.height / 2,
      (boundary.start.z + boundary.end.z) / 2
    )
    wallMesh.rotation.y = angle
    scene.add(wallMesh)
  })
}

async function createWatchTowers(): Promise<void> {
  if (!scene) return
  
  // Torres de vigilancia estratégicas en puntos clave
  const watchTowerPositions = [
    // Torres del norte (vigilando las montañas)
    { x: -100, z: -220, height: 25, name: 'Torre del Viento Norte' },
    { x: 0, z: -240, height: 28, name: 'Gran Atalaya' },
    { x: 100, z: -220, height: 25, name: 'Torre del Alba' },
    
    // Torres del este (vigilando el mar)
    { x: 280, z: -80, height: 22, name: 'Faro del Este' },
    { x: 300, z: 0, height: 24, name: 'Torre del Comercio' },
    { x: 280, z: 80, height: 22, name: 'Vigía del Puerto' },
    
    // Torres del sur (vigilando las tierras agrícolas)
    { x: 80, z: 240, height: 20, name: 'Torre del Granero' },
    { x: -80, z: 240, height: 20, name: 'Vigía del Sur' },
    
    // Torres del oeste (vigilando los bosques)
    { x: -280, z: 80, height: 23, name: 'Torre del Bosque' },
    { x: -300, z: -80, height: 23, name: 'Vigía Occidental' }
  ]
  
  const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  
  watchTowerPositions.forEach(tower => {
    // Base de la torre
    const baseGeometry = new THREE.CylinderGeometry(5, 6, 8, 12)
    const base = new THREE.Mesh(baseGeometry, towerMaterial)
    base.position.set(tower.x, 4, tower.z)
    scene.add(base)
    
    // Torre principal
    const towerGeometry = new THREE.CylinderGeometry(3, 4, tower.height, 12)
    const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial)
    towerMesh.position.set(tower.x, 8 + tower.height / 2, tower.z)
    towerMesh.castShadow = true
    scene.add(towerMesh)
    
    // Plataforma de observación
    const platformGeometry = new THREE.CylinderGeometry(4.5, 4.5, 1, 16)
    const platform = new THREE.Mesh(platformGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
    platform.position.set(tower.x, 8 + tower.height + 0.5, tower.z)
    scene.add(platform)
    
    // Brazero/señal de fuego
    const brazierGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 8)
    const brazier = new THREE.Mesh(brazierGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
    brazier.position.set(tower.x, 8 + tower.height + 2, tower.z)
    scene.add(brazier)
    
    // "Fuego" en el brazero
    const fireGeometry = new THREE.ConeGeometry(0.8, 2, 6)
    const fireMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFF4500,
      emissive: 0xFF2500,
      emissiveIntensity: 0.3
    })
    const fire = new THREE.Mesh(fireGeometry, fireMaterial)
    fire.position.set(tower.x, 8 + tower.height + 3.5, tower.z)
    scene.add(fire)
  })
}

// ============ NÚCLEO CENTRAL (DENTRO DE LA MURALLA INTERIOR) ============
// Todo concentrado dentro del radio interior (80x65)
const createCastle = async (): Promise<void> => {
  if (!scene) return
  
  const materials = {
    stone: new THREE.MeshLambertMaterial({ color: 0x696969 }),    // Gris piedra
    marble: new THREE.MeshLambertMaterial({ color: 0x778899 }),   // Gris azulado
    gold: new THREE.MeshLambertMaterial({ color: 0xDAA520 }),     // Oro opaco
    wood: new THREE.MeshLambertMaterial({ color: 0x654321 }),     // Marrón madera
    bronze: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),   // Bronce
    roof: new THREE.MeshLambertMaterial({ color: 0x5D4E37 }),     // Tejados marrones
    grass: new THREE.MeshLambertMaterial({ color: 0x8FBC8F }),    // Verde césped
    water: new THREE.MeshLambertMaterial({ color: 0x4682B4, transparent: true, opacity: 0.8 })
  }
  
  console.log('Creating CENTRAL CORE - Castle + Main Structures inside inner wall...')
  
  // ========== CASTILLO IMPERIAL CENTRAL ==========
  const castleCenter = { x: 0, z: 0 }
  
  // TORRE DEL HOMENAJE PRINCIPAL - El corazón del poder
  const keepGeometry = new THREE.CylinderGeometry(8, 10, 25, 16)
  const keep = new THREE.Mesh(keepGeometry, materials.stone)
  keep.position.set(castleCenter.x, 12.5, castleCenter.z)
  keep.castShadow = true
  scene.add(keep)
  
  // Corona dorada del keep
  const crownGeometry = new THREE.CylinderGeometry(9, 8.5, 2, 16)
  const crown = new THREE.Mesh(crownGeometry, materials.gold)
  crown.position.set(castleCenter.x, 26, castleCenter.z)
  scene.add(crown)
  
  // ========== TORRES PRINCIPALES DEL CASTILLO (6 torres) ==========
  const mainTowers = [
    { name: 'Torre del Rey', x: 15, z: 0, height: 22 },
    { name: 'Torre de la Reina', x: -15, z: 0, height: 20 },
    { name: 'Torre del Príncipe', x: 0, z: 15, height: 18 },
    { name: 'Torre del Tesoro', x: 0, z: -15, height: 21 },
    { name: 'Torre Norte', x: 10, z: 12, height: 19 },
    { name: 'Torre Sur', x: -10, z: -12, height: 19 }
  ]
  
  mainTowers.forEach(tower => {
    const towerGeometry = new THREE.CylinderGeometry(4, 5, tower.height, 12)
    const towerMesh = new THREE.Mesh(towerGeometry, materials.stone)
    towerMesh.position.set(tower.x, tower.height/2, tower.z)
    scene.add(towerMesh)
    
    // Techo cónico
    const roofGeometry = new THREE.ConeGeometry(5, 6, 12)
    const roof = new THREE.Mesh(roofGeometry, materials.roof)
    roof.position.set(tower.x, tower.height + 3, tower.z)
    scene.add(roof)
    
    // Bandera
    const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8)
    const flagPole = new THREE.Mesh(flagPoleGeometry, materials.bronze)
    flagPole.position.set(tower.x, tower.height + 8, tower.z)
    scene.add(flagPole)
  })
  
  // ========== MURALLAS DEL CASTILLO ==========
  // Muralla hexagonal conectando las torres
  const castleWallVertices = [
    { x: 15, z: 0 }, { x: 10, z: 12 }, { x: 0, z: 15 },
    { x: -15, z: 0 }, { x: -10, z: -12 }, { x: 0, z: -15 }
  ]
  
  for (let i = 0; i < castleWallVertices.length; i++) {
    const start = castleWallVertices[i]
    const end = castleWallVertices[(i + 1) % castleWallVertices.length]
    
    const wallLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2))
    const wallAngle = Math.atan2(end.z - start.z, end.x - start.x)
    
    const wallGeometry = new THREE.BoxGeometry(wallLength, 12, 2)
    const wall = new THREE.Mesh(wallGeometry, materials.stone)
    wall.position.set((start.x + end.x)/2, 6, (start.z + end.z)/2)
    wall.rotation.y = wallAngle
    scene.add(wall)
  }
  
  // ========== PATIO DE ARMAS CENTRAL ==========
  const courtyardGeometry = new THREE.CircleGeometry(12, 24)
  const courtyard = new THREE.Mesh(courtyardGeometry, materials.stone)
  courtyard.rotation.x = -Math.PI / 2
  courtyard.position.set(0, 0.1, 0)
  scene.add(courtyard)
  
  // ========== ESTRUCTURAS INTERNAS DEL CASTILLO ==========
  
  // GRAN SALÓN REAL
  const throneHallGeometry = new THREE.BoxGeometry(12, 8, 20)
  const throneHall = new THREE.Mesh(throneHallGeometry, materials.marble)
  throneHall.position.set(-8, 4, 0)
  scene.add(throneHall)
  
  // CAPILLA REAL
  const chapelGeometry = new THREE.BoxGeometry(8, 10, 12)
  const chapel = new THREE.Mesh(chapelGeometry, materials.marble)
  chapel.position.set(8, 5, 8)
  scene.add(chapel)
  
  // Cruz en la capilla
  const crossGeometry = new THREE.BoxGeometry(0.5, 6, 0.5)
  const cross = new THREE.Mesh(crossGeometry, materials.gold)
  cross.position.set(8, 13, 8)
  scene.add(cross)
  
  // ESTABLOS REALES
  const stablesGeometry = new THREE.BoxGeometry(15, 5, 8)
  const stables = new THREE.Mesh(stablesGeometry, materials.wood)
  stables.position.set(-8, 2.5, -12)
  scene.add(stables)
  
  // ARMERÍA
  const armoryGeometry = new THREE.BoxGeometry(10, 6, 8)
  const armory = new THREE.Mesh(armoryGeometry, materials.stone)
  armory.position.set(12, 3, -8)
  scene.add(armory)
  
  // ========== ESTRUCTURAS SECUNDARIAS DENTRO DE LA MURALLA INTERIOR ==========
  
  // BARRACKS DE LA GUARDIA REAL (Norte)
  const barracksNorthGeometry = new THREE.BoxGeometry(20, 6, 10)
  const barracksNorth = new THREE.Mesh(barracksNorthGeometry, materials.stone)
  barracksNorth.position.set(30, 3, -25)
  scene.add(barracksNorth)
  
  // RESIDENCIAS NOBLES (Sur)
  const nobleQuarterGeometry = new THREE.BoxGeometry(25, 8, 15)
  const nobleQuarter = new THREE.Mesh(nobleQuarterGeometry, materials.marble)
  nobleQuarter.position.set(-35, 4, 20)
  scene.add(nobleQuarter)
  
  // JARDINES REALES (Este)
  const royalGardenGeometry = new THREE.CircleGeometry(18, 24)
  const royalGarden = new THREE.Mesh(royalGardenGeometry, materials.grass)
  royalGarden.rotation.x = -Math.PI / 2
  royalGarden.position.set(40, 0.05, 0)
  scene.add(royalGarden)
  
  // Fuente central del jardín
  const fountainGeometry = new THREE.CylinderGeometry(3, 4, 4, 16)
  const fountain = new THREE.Mesh(fountainGeometry, materials.marble)
  fountain.position.set(40, 2, 0)
  scene.add(fountain)
  
  // PLAZA DE ARMAS (Oeste)
  const weaponsPlazaGeometry = new THREE.CircleGeometry(15, 24)
  const weaponsPlaza = new THREE.Mesh(weaponsPlazaGeometry, materials.stone)
  weaponsPlaza.rotation.x = -Math.PI / 2
  weaponsPlaza.position.set(-40, 0.1, 0)
  scene.add(weaponsPlaza)
  
  // TORRES DE VIGILANCIA EN EL PERÍMETRO INTERIOR
  const innerWatchTowers = [
    { x: 60, z: 40 }, { x: -60, z: 40 }, { x: 60, z: -40 }, { x: -60, z: -40 },
    { x: 0, z: 55 }, { x: 0, z: -55 }
  ]
  
  innerWatchTowers.forEach(pos => {
    const watchTowerGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 8)
    const watchTower = new THREE.Mesh(watchTowerGeometry, materials.stone)
    watchTower.position.set(pos.x, 7.5, pos.z)
    scene.add(watchTower)
    
    // Techo puntiagudo
    const watchRoofGeometry = new THREE.ConeGeometry(2.5, 4, 8)
    const watchRoof = new THREE.Mesh(watchRoofGeometry, materials.roof)
    watchRoof.position.set(pos.x, 17, pos.z)
    scene.add(watchRoof)
  })
}

const createPalermoDistrict = async (): Promise<void> => {
  if (!scene) return
  
  console.log('Creating PALERMO District with 3 massive sub-districts...')
  
  // ============ MATERIALES REALISTAS MEDIEVALES ============
  const luxuryMaterials = {
    imperial: new THREE.MeshLambertMaterial({ color: 0x8B8B83 }),      // Piedra gris clara imperial
    ducal: new THREE.MeshLambertMaterial({ color: 0x778899 }),         // Piedra azul-gris noble  
    noble: new THREE.MeshLambertMaterial({ color: 0x696969 }),         // Piedra gris medio
    wealthy: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),       // Piedra beige-marrón
    merchant: new THREE.MeshLambertMaterial({ color: 0x654321 }),      // Madera oscura
    marble: new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }),        // Piedra clara natural
    gold: new THREE.MeshLambertMaterial({ color: 0xB8860B }),          // Bronce envejecido
    bronze: new THREE.MeshLambertMaterial({ color: 0x8C6239 })         // Cobre oxidado
  }
  
  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4E37 })  // Madera castaña oscura
  const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })  // Piedra gris para calles
  
  // ============ PALERMO ALTO - DISTRITO DUCAL (Zona más noble) ============
  await createPalermoAlto(luxuryMaterials)
  // ============ PALERMO MEDIO - BARRIO NOBLE (Nobleza media) ============  
  await createPalermoMedio(luxuryMaterials)
  
  // ============ PALERMO BAJO - COMERCIANTES RICOS (Burguesía próspera) ============
  await createPalermoBajo(luxuryMaterials)
  
  // ============ INFRAESTRUCTURA UNIFICADA DE PALERMO ============
  await createPalermoInfrastructure(luxuryMaterials)
  
  console.log('PALERMO District with 3 sub-districts completed!')
}

// ============ PALERMO ALTO - DISTRITO DUCAL SUPREMO ============
async function createPalermoAlto(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO ALTO - Supreme Ducal District...')
  
  const palermoAltoCenter = { x: -90, z: -70 }
  const radius = 25
  
  // Materiales
  const { stoneMaterial, goldMaterial, marbleMaterial, roofMaterial, darkStoneMaterial } = materials
  
  // Base territorial elevada
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B8B83 })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(palermoAltoCenter.x, 2, palermoAltoCenter.z)
  scene.add(districtBase)
  
  // Palacio Ducal Central
  const ducalPalaceGeometry = new THREE.BoxGeometry(15, 20, 12)
  const ducalPalace = new THREE.Mesh(ducalPalaceGeometry, marbleMaterial)
  ducalPalace.position.set(palermoAltoCenter.x, 10, palermoAltoCenter.z)
  ducalPalace.castShadow = true
  scene.add(ducalPalace)
  
  // Torres del palacio ducal
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const towerX = palermoAltoCenter.x + Math.cos(angle) * 8
    const towerZ = palermoAltoCenter.z + Math.sin(angle) * 8
    
    const towerGeometry = new THREE.CylinderGeometry(2, 2.5, 25, 12)
    const tower = new THREE.Mesh(towerGeometry, materials.ducal)
    tower.position.set(towerX, 12.5, towerZ)
    scene.add(tower)
    
    // Tejado cónico
    const roofGeometry = new THREE.ConeGeometry(3, 4, 12)
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(towerX, 27, towerZ)
    scene.add(roof)
  }
  
  // Mansiones nobles circundantes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const mansionX = palermoAltoCenter.x + Math.cos(angle) * 18
    const mansionZ = palermoAltoCenter.z + Math.sin(angle) * 18
    
    const mansionGeometry = new THREE.BoxGeometry(6, 12, 8)
    const mansion = new THREE.Mesh(mansionGeometry, materials.noble)
    mansion.position.set(mansionX, 6, mansionZ)
    mansion.castShadow = true
    scene.add(mansion)
    
    // Tejado de mansión
    const mansionRoofGeometry = new THREE.BoxGeometry(7, 2, 9)
    const mansionRoof = new THREE.Mesh(mansionRoofGeometry, roofMaterial)
    mansionRoof.position.set(mansionX, 13, mansionZ)
    scene.add(mansionRoof)
}

// ============ PALERMO MEDIO - BARRIO NOBLE ============
async function createPalermoMedio(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO MEDIO - Noble District...')
  
  const palermoMedioCenter = { x: -140, z: -70 }
  const radius = 22
  
  // Base territorial
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x778899 })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(palermoMedioCenter.x, 1.5, palermoMedioCenter.z)
  scene.add(districtBase)
  
  // Mansiones nobles medianas
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const mansionX = palermoMedioCenter.x + Math.cos(angle) * 15
    const mansionZ = palermoMedioCenter.z + Math.sin(angle) * 15
    
    const mansionGeometry = new THREE.BoxGeometry(5, 10, 6)
    const mansion = new THREE.Mesh(mansionGeometry, materials.wealthy)
    mansion.position.set(mansionX, 5, mansionZ)
    mansion.castShadow = true
    scene.add(mansion)
  }
}

// ============ PALERMO BAJO - COMERCIANTES RICOS ============
async function createPalermoBajo(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO BAJO - Wealthy Merchants District...')
  
  const palermoBajoCenter = { x: -190, z: -70 }
  const radius = 20
  
  // Base territorial
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(palermoBajoCenter.x, 1, palermoBajoCenter.z)
  scene.add(districtBase)
  
  // Casas comerciales
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    const houseX = palermoBajoCenter.x + Math.cos(angle) * 12
    const houseZ = palermoBajoCenter.z + Math.sin(angle) * 12
    
    const houseGeometry = new THREE.BoxGeometry(4, 8, 5)
    const house = new THREE.Mesh(houseGeometry, materials.merchant)
    house.position.set(houseX, 4, houseZ)
    house.castShadow = true
    scene.add(house)
  }
}

// ============ INFRAESTRUCTURA DE PALERMO ============
async function createPalermoInfrastructure(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO Infrastructure...')
  
  // Carreteras principales conectando los 3 distritos
  const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  
  // Carretera entre Alto y Medio
  const road1Geometry = new THREE.BoxGeometry(50, 0.2, 4)
  const road1 = new THREE.Mesh(road1Geometry, roadMaterial)
  road1.position.set(-115, 0.1, -70)
  scene.add(road1)
  
  // Carretera entre Medio y Bajo
  const road2Geometry = new THREE.BoxGeometry(50, 0.2, 4)
  const road2 = new THREE.Mesh(road2Geometry, roadMaterial)
  road2.position.set(-165, 0.1, -70)
  scene.add(road2)
}

const createPalermoDistrict = async (): Promise<void> => {
  if (!scene) return

  console.log('Creating PALERMO District with 3 massive sub-districts...')

  // ============ MATERIALES REALISTAS MEDIEVALES ============
  const luxuryMaterials = {
    imperial: new THREE.MeshLambertMaterial({ color: 0x8B8B83 }),      // Piedra gris clara imperial
    ducal: new THREE.MeshLambertMaterial({ color: 0x778899 }),         // Piedra azul-gris noble
    noble: new THREE.MeshLambertMaterial({ color: 0x696969 }),         // Piedra gris medio
    wealthy: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),       // Piedra beige-marrón
    merchant: new THREE.MeshLambertMaterial({ color: 0x654321 }),      // Madera oscura
    marble: new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }),        // Piedra clara natural
    gold: new THREE.MeshLambertMaterial({ color: 0xB8860B }),          // Bronce envejecido
    bronze: new THREE.MeshLambertMaterial({ color: 0x8C6239 })         // Cobre oxidado
  }

  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4E37 })  // Madera castaña oscura
  const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })  // Piedra gris para calles

  // ============ PALERMO ALTO - DISTRITO DUCAL (Zona más noble) ============
  await createPalermoAlto(luxuryMaterials)

  // ============ PALERMO MEDIO - BARRIO NOBLE (Nobleza media) ============
  await createPalermoMedio(luxuryMaterials)

  // ============ PALERMO BAJO - COMERCIANTES RICOS (Burguesía próspera) ============
  await createPalermoBajo(luxuryMaterials)

  // ============ INFRAESTRUCTURA UNIFICADA DE PALERMO ============
  await createPalermoInfrastructure(luxuryMaterials)

  console.log('PALERMO District with 3 sub-districts completed!')
}

// ============ PALERMO ALTO - DISTRITO DUCAL SUPREMO ============
async function createPalermoAlto(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO ALTO - Supreme Ducal District...')
  
  const palermoAltoCenter = { x: -90, z: -70 }
  const radius = 25
  
  // Base territorial elevada
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x8FBC8F, // Verde mar pálido natural
    transparent: true, 
    opacity: 0.8 
  })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(palermoAltoCenter.x, 0.1, palermoAltoCenter.z)
  scene.add(districtBase)
  
  // PALACIOS DUCALES - Los más magnificos de la ciudad
  const ducalPalaces = [
    { 
      name: 'Palacio del Gran Duque Imperial', 
      x: palermoAltoCenter.x, 
      z: palermoAltoCenter.z - 8, 
      width: 20, 
      height: 12, 
      depth: 25, 
      type: 'grand_palace',
      owner: 'Su Alteza el Gran Duque'
    },
    { 
      name: 'Palacio de la Emperatriz Madre', 
      x: palermoAltoCenter.x - 15, 
      z: palermoAltoCenter.z + 8, 
      width: 16, 
      height: 10, 
      depth: 18, 
      type: 'imperial_palace',
      owner: 'Emperatriz Viuda'
    },
    { 
      name: 'Palacio del Príncipe Heredero', 
      x: palermoAltoCenter.x + 18, 
      z: palermoAltoCenter.z - 5, 
      width: 14, 
      height: 9, 
      depth: 16, 
      type: 'crown_palace',
      owner: 'Príncipe Heredero'
    },
    { 
      name: 'Palacio del Archiduque del Norte', 
      x: palermoAltoCenter.x - 12, 
      z: palermoAltoCenter.z - 18, 
      width: 12, 
      height: 8, 
      depth: 14, 
      type: 'archduke_palace',
      owner: 'Archiduque del Norte'
    },
    { 
      name: 'Palacio del Duque de las Islas', 
      x: palermoAltoCenter.x + 10, 
      z: palermoAltoCenter.z + 12, 
      width: 11, 
      height: 7, 
      depth: 13, 
      type: 'duke_palace',
      owner: 'Duque de las Islas'
    }
  ]
  
  for (const palace of ducalPalaces) {
    // Edificio principal del palacio
    const palaceGeometry = new THREE.BoxGeometry(palace.width, palace.height, palace.depth)
    let palaceMaterial = materials.ducal
    
    if (palace.type === 'grand_palace') palaceMaterial = materials.imperial
    else if (palace.type === 'imperial_palace') palaceMaterial = materials.marble
    
    const palaceMesh = new THREE.Mesh(palaceGeometry, palaceMaterial)
    palaceMesh.position.set(palace.x, palace.height/2, palace.z)
    palaceMesh.castShadow = true
    scene.add(palaceMesh)
    
    // Cúpula dorada central
    const domeGeometry = new THREE.SphereGeometry(palace.width * 0.3, 16, 12)
    const dome = new THREE.Mesh(domeGeometry, materials.gold)
    dome.position.set(palace.x, palace.height + palace.width * 0.2, palace.z)
    scene.add(dome)
    
    // Torres de esquina múltiples
    const numTowers = palace.type === 'grand_palace' ? 8 : 6
    for (let i = 0; i < numTowers; i++) {
      const angle = (i / numTowers) * Math.PI * 2
      const towerRadius = Math.min(palace.width, palace.depth) * 0.4
      const towerX = palace.x + Math.cos(angle) * towerRadius
      const towerZ = palace.z + Math.sin(angle) * towerRadius
      
      const towerGeometry = new THREE.CylinderGeometry(2, 2.5, palace.height + 4, 12)
      const tower = new THREE.Mesh(towerGeometry, palaceMaterial)
      tower.position.set(towerX, (palace.height + 4)/2, towerZ)
      scene.add(tower)
      
      // Cúpula de torre
      const towerDomeGeometry = new THREE.SphereGeometry(2.5, 12, 8)
      const towerDome = new THREE.Mesh(towerDomeGeometry, materials.gold)
      towerDome.position.set(towerX, palace.height + 6, towerZ)
      scene.add(towerDome)
      
      // Bandera ducal
      const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8)
      const flagPole = new THREE.Mesh(flagPoleGeometry, materials.bronze)
      flagPole.position.set(towerX, palace.height + 8.5, towerZ)
      scene.add(flagPole)
      
      const flagGeometry = new THREE.PlaneGeometry(3, 2)
      const flagColors = [0xFF0000, 0x0000FF, 0xFFD700, 0x800080]
      const flagMaterial = new THREE.MeshLambertMaterial({ 
        color: flagColors[i % flagColors.length] 
      })
      const flag = new THREE.Mesh(flagGeometry, flagMaterial)
      flag.position.set(towerX + 1.5, palace.height + 9, towerZ)
      scene.add(flag)
    }
    
    // Jardines palatinos masivos
    const gardenGeometry = new THREE.CircleGeometry(palace.width * 0.8, 24)
    const gardenMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x32CD32, 
      transparent: true, 
      opacity: 0.7 
    })
    const garden = new THREE.Mesh(gardenGeometry, gardenMaterial)
    garden.rotation.x = -Math.PI / 2
    garden.position.set(palace.x + palace.width * 1.2, 0.02, palace.z)
    scene.add(garden)
    
    // Fuentes ornamentales en jardines
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      const fountainX = garden.position.x + Math.cos(angle) * palace.width * 0.5
      const fountainZ = garden.position.z + Math.sin(angle) * palace.width * 0.5
      
      const fountainGeometry = new THREE.CylinderGeometry(2, 2.5, 2, 16)
      const fountain = new THREE.Mesh(fountainGeometry, materials.marble)
      fountain.position.set(fountainX, 1, fountainZ)
      scene.add(fountain)
      
      // Estatua en la fuente
      const statueGeometry = new THREE.CylinderGeometry(0.5, 0.8, 3, 8)
      const statue = new THREE.Mesh(statueGeometry, materials.bronze)
      statue.position.set(fountainX, 3.5, fountainZ)
      scene.add(statue)
    }
    
    // Establos ducales de lujo
    const stableGeometry = new THREE.BoxGeometry(12, 5, 8)
    const stableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const stable = new THREE.Mesh(stableGeometry, stableMaterial)
    stable.position.set(palace.x - palace.width - 8, 2.5, palace.z)
    scene.add(stable)
    
    // Carroza ducal
    const carriageGeometry = new THREE.BoxGeometry(4, 3, 6)
    const carriageMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    const carriage = new THREE.Mesh(carriageGeometry, carriageMaterial)
    carriage.position.set(stable.position.x, 1.5, stable.position.z + 6)
    scene.add(carriage)
  }
  
  // Plaza Ducal Central
  const ducalPlazaGeometry = new THREE.CircleGeometry(12, 24)
  const ducalPlazaMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C })  // Tan natural
  const ducalPlaza = new THREE.Mesh(ducalPlazaGeometry, ducalPlazaMaterial)
  ducalPlaza.rotation.x = -Math.PI / 2
  ducalPlaza.position.set(palermoAltoCenter.x, 0.05, palermoAltoCenter.z + 20)
  scene.add(ducalPlaza)
  
  // Monumento al Gran Duque
  const monumentGeometry = new THREE.CylinderGeometry(3, 4, 8, 16)
  const monument = new THREE.Mesh(monumentGeometry, materials.marble)
  monument.position.set(ducalPlaza.position.x, 4, ducalPlaza.position.z)
  scene.add(monument)
  
  // Estatua ecuestre del Gran Duque
  const equestrianStatueGeometry = new THREE.BoxGeometry(4, 6, 2)
  const equestrianStatue = new THREE.Mesh(equestrianStatueGeometry, materials.bronze)
  equestrianStatue.position.set(monument.position.x, 9, monument.position.z)
  scene.add(equestrianStatue)
}

// ============ PALERMO MEDIO - BARRIO NOBLE PRINCIPAL ============
async function createPalermoMedio(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO MEDIO - Main Noble Quarter...')
  
  const palermoMedioCenter = { x: -60, z: -40 }
  const radius = 30
  
  // Base territorial 
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x9ACD32, // Verde oliva natural
    transparent: true, 
    opacity: 0.6 
  })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(palermoMedioCenter.x, 0.08, palermoMedioCenter.z)
  scene.add(districtBase)
  
  // MANSIONES NOBILIARIAS - Condes, Marqueses y Barones
  const nobleMansions = [
    { name: 'Mansión del Conde de Palermo', x: -60, z: -45, width: 12, height: 8, depth: 10, type: 'count_mansion', rank: 'count' },
    { name: 'Palacio del Marqués del Sur', x: -75, z: -35, width: 10, height: 7, depth: 9, type: 'marquis_palace', rank: 'marquis' },
    { name: 'Casa del Barón de Oro', x: -45, z: -50, width: 8, height: 6, depth: 8, type: 'baron_house', rank: 'baron' },
    { name: 'Mansión del Conde del Río', x: -70, z: -25, width: 11, height: 7.5, depth: 9.5, type: 'count_mansion', rank: 'count' },
    { name: 'Villa del Vizconde Real', x: -50, z: -30, width: 9, height: 6.5, depth: 8.5, type: 'viscount_villa', rank: 'viscount' },
    { name: 'Palacio del Marqués de la Costa', x: -40, z: -40, width: 10.5, height: 7.2, depth: 9.2, type: 'marquis_palace', rank: 'marquis' },
    { name: 'Casa del Barón del Norte', x: -65, z: -50, width: 7.5, height: 5.8, depth: 7.8, type: 'baron_house', rank: 'baron' },
    { name: 'Mansión del Conde de las Aguas', x: -55, z: -20, width: 11.5, height: 8.2, depth: 10.2, type: 'count_mansion', rank: 'count' }
  ]
  
  for (const mansion of nobleMansions) {
    // Material según rango nobiliario
    let buildingMaterial = materials.noble
    if (mansion.rank === 'count') buildingMaterial = materials.ducal
    else if (mansion.rank === 'marquis') buildingMaterial = materials.wealthy
    else if (mansion.rank === 'baron') buildingMaterial = materials.noble
    
    // Edificio principal
    const mansionGeometry = new THREE.BoxGeometry(mansion.width, mansion.height, mansion.depth)
    const mansionMesh = new THREE.Mesh(mansionGeometry, buildingMaterial)
    mansionMesh.position.set(mansion.x, mansion.height/2, mansion.z)
    mansionMesh.castShadow = true
    scene.add(mansionMesh)
    
    // Torres según rango (más torres = mayor rango)
    const numTowers = mansion.rank === 'count' ? 4 : mansion.rank === 'marquis' ? 3 : 2
    for (let i = 0; i < numTowers; i++) {
      const angle = (i / numTowers) * Math.PI * 2
      const towerRadius = Math.min(mansion.width, mansion.depth) * 0.35
      const towerX = mansion.x + Math.cos(angle) * towerRadius
      const towerZ = mansion.z + Math.sin(angle) * towerRadius
      
      const towerGeometry = new THREE.CylinderGeometry(1.5, 2, mansion.height + 2, 8)
      const tower = new THREE.Mesh(towerGeometry, buildingMaterial)
      tower.position.set(towerX, (mansion.height + 2)/2, towerZ)
      scene.add(tower)
      
      // Tejado cónico
      const roofGeometry = new THREE.ConeGeometry(2.2, 3, 8)
      const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      roof.position.set(towerX, mansion.height + 3.5, towerZ)
      scene.add(roof)
    }
    
    // Jardín privado
    const gardenGeometry = new THREE.CircleGeometry(mansion.width * 0.6, 16)
    const gardenMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x7CFC00, 
      transparent: true, 
      opacity: 0.6 
    })
    const garden = new THREE.Mesh(gardenGeometry, gardenMaterial)
    garden.rotation.x = -Math.PI / 2
    garden.position.set(mansion.x + mansion.width * 1.1, 0.02, mansion.z)
    scene.add(garden)
    
    // Fuente en jardín privado
    const fountainGeometry = new THREE.CylinderGeometry(1.5, 1.8, 1.2, 12)
    const fountain = new THREE.Mesh(fountainGeometry, materials.marble)
    fountain.position.set(garden.position.x, 0.6, garden.position.z)
    scene.add(fountain)
    
    // Establos nobiliarios
    const stableGeometry = new THREE.BoxGeometry(6, 4, 8)
    const stableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const stable = new THREE.Mesh(stableGeometry, stableMaterial)
    stable.position.set(mansion.x - mansion.width - 4, 2, mansion.z)
    scene.add(stable)
  }
  
  // EMBAJADAS Y RESIDENCIAS DIPLOMÁTICAS
  const embassies = [
    { name: 'Embajada del Reino del Norte', x: -35, z: -35, width: 10, height: 7, depth: 8 },
    { name: 'Consulado de las Islas del Sur', x: -80, z: -45, width: 8, height: 6, depth: 7 },
    { name: 'Legación Imperial del Este', x: -40, z: -25, width: 9, height: 6.5, depth: 7.5 }
  ]
  
  for (const embassy of embassies) {
    const embassyGeometry = new THREE.BoxGeometry(embassy.width, embassy.height, embassy.depth)
    const embassyMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
    const embassyMesh = new THREE.Mesh(embassyGeometry, embassyMaterial)
    embassyMesh.position.set(embassy.x, embassy.height/2, embassy.z)
    scene.add(embassyMesh)
    
    // Bandera nacional
    const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8)
    const flagPole = new THREE.Mesh(flagPoleGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
    flagPole.position.set(embassy.x, embassy.height + 4, embassy.z + embassy.depth/2 + 2)
    scene.add(flagPole)
    
    const flagGeometry = new THREE.PlaneGeometry(4, 3)
    const flagColors = [0xFF0000, 0x00FF00, 0x0000FF]
    const flagMaterial = new THREE.MeshLambertMaterial({ 
      color: flagColors[Math.floor(Math.random() * flagColors.length)] 
    })
    const flag = new THREE.Mesh(flagGeometry, flagMaterial)
    flag.position.set(embassy.x + 2, embassy.height + 6, embassy.z + embassy.depth/2 + 2)
    scene.add(flag)
  }
}

// ============ PALERMO BAJO - COMERCIANTES RICOS ============
async function createPalermoBajo(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO BAJO - Wealthy Merchants Quarter...')
  
  const palermoBajoCenter = { x: -40, z: -10 }
  const radius = 25
  
  // Base territorial
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xDEB887, 
    transparent: true, 
    opacity: 0.5 
  })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(palermoBajoCenter.x, 0.06, palermoBajoCenter.z)
  scene.add(districtBase)
  
  // RESIDENCIAS DE COMERCIANTES PRÓSPEROS
  const merchantHouses = [
    { name: 'Casa del Gran Mercader de Sedas', x: -40, z: -15, width: 9, height: 6, depth: 8, trade: 'silk' },
    { name: 'Mansión del Banquero Imperial', x: -55, z: -5, width: 10, height: 6.5, depth: 9, trade: 'banking' },
    { name: 'Villa del Armero Real', x: -25, z: -20, width: 8, height: 5.5, depth: 7, trade: 'weapons' },
    { name: 'Casa del Joyero de la Corte', x: -45, z: 5, width: 7, height: 5, depth: 6, trade: 'jewelry' },
    { name: 'Mansión del Naviero', x: -30, z: -5, width: 9.5, height: 6.2, depth: 8.2, trade: 'shipping' },
    { name: 'Villa del Especiero', x: -50, z: -20, width: 7.5, height: 5.2, depth: 6.8, trade: 'spices' },
    { name: 'Casa del Pelotero', x: -35, z: 8, width: 8.2, height: 5.8, depth: 7.5, trade: 'furs' },
    { name: 'Mansión del Vinatero', x: -60, z: -10, width: 8.8, height: 6, depth: 8, trade: 'wine' }
  ]
  
  for (const house of merchantHouses) {
    // Material según tipo de comercio
    let buildingMaterial = materials.merchant
    if (house.trade === 'banking' || house.trade === 'jewelry') buildingMaterial = materials.wealthy
    else if (house.trade === 'silk' || house.trade === 'shipping') buildingMaterial = materials.noble
    
    // Edificio principal
    const houseGeometry = new THREE.BoxGeometry(house.width, house.height, house.depth)
    const houseMesh = new THREE.Mesh(houseGeometry, buildingMaterial)
    houseMesh.position.set(house.x, house.height/2, house.z)
    houseMesh.castShadow = true
    scene.add(houseMesh)
    
    // Torre comercial (para mostrar prosperidad)
    const towerGeometry = new THREE.CylinderGeometry(1.2, 1.5, house.height + 1.5, 8)
    const tower = new THREE.Mesh(towerGeometry, buildingMaterial)
    tower.position.set(
      house.x + house.width/3,
      (house.height + 1.5)/2,
      house.z + house.depth/3
    )
    scene.add(tower)
    
    // Tejado de torre
    const towerRoofGeometry = new THREE.ConeGeometry(1.8, 2, 8)
    const towerRoof = new THREE.Mesh(towerRoofGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
    towerRoof.position.set(tower.position.x, house.height + 2.5, tower.position.z)
    scene.add(towerRoof)
    
    // Almacén/taller según el comercio
    const warehouseGeometry = new THREE.BoxGeometry(6, 4, house.depth + 2)
    let warehouseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    if (house.trade === 'banking') warehouseMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
    
    const warehouse = new THREE.Mesh(warehouseGeometry, warehouseMaterial)
    warehouse.position.set(house.x - house.width - 4, 2, house.z)
    scene.add(warehouse)
    
    // Características específicas según comercio
    if (house.trade === 'silk' || house.trade === 'furs') {
      // Tendederos para secar mercancías
      for (let i = 0; i < 3; i++) {
        const lineGeometry = new THREE.BoxGeometry(4, 0.1, 0.1)
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
        const line = new THREE.Mesh(lineGeometry, lineMaterial)
        line.position.set(
          warehouse.position.x,
          3.5,
          warehouse.position.z + (i - 1) * 1.5
        )
        scene.add(line)
        
        // "Telas" colgando
        const fabricGeometry = new THREE.PlaneGeometry(1, 1.5)
        const fabricColors = [0xFF6B9D, 0x4ECDC4, 0xFFE66D, 0x6C5CE7]
        const fabricMaterial = new THREE.MeshLambertMaterial({ 
          color: fabricColors[i % fabricColors.length] 
        })
        const fabric = new THREE.Mesh(fabricGeometry, fabricMaterial)
        fabric.position.set(line.position.x + 1, 2.8, line.position.z)
        scene.add(fabric)
      }
    }
    
    if (house.trade === 'weapons') {
      // Yunque y fragua
      const anvilGeometry = new THREE.BoxGeometry(1.5, 0.8, 1)
      const anvil = new THREE.Mesh(anvilGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
      anvil.position.set(warehouse.position.x + 2, 0.4, warehouse.position.z)
      scene.add(anvil)
      
      // Bastidores de armas
      for (let i = 0; i < 4; i++) {
        const rackGeometry = new THREE.BoxGeometry(0.3, 3, 0.3)
        const rack = new THREE.Mesh(rackGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
        rack.position.set(
          warehouse.position.x - 2,
          1.5,
          warehouse.position.z + (i - 1.5) * 1.2
        )
        scene.add(rack)
      }
    }
    
    if (house.trade === 'spices') {
      // Barriles y sacos
      for (let i = 0; i < 6; i++) {
        const barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 8)
        const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        barrel.position.set(
          warehouse.position.x + (i % 3 - 1) * 1.5,
          0.5,
          warehouse.position.z + Math.floor(i / 3) * 2 - 1
        )
        scene.add(barrel)
      }
    }
    
    // Jardín próspero pero más modesto
    const gardenGeometry = new THREE.CircleGeometry(house.width * 0.4, 12)
    const gardenMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x32CD32, 
      transparent: true, 
      opacity: 0.5 
    })
    const garden = new THREE.Mesh(gardenGeometry, gardenMaterial)
    garden.rotation.x = -Math.PI / 2
    garden.position.set(house.x + house.width * 0.8, 0.02, house.z + house.depth * 0.8)
    scene.add(garden)
  }
  
  // MERCADO EXCLUSIVO DE LUJO
  const luxuryMarketGeometry = new THREE.CircleGeometry(8, 16)
  const luxuryMarketMaterial = new THREE.MeshLambertMaterial({ color: 0xF0E68C })
  const luxuryMarket = new THREE.Mesh(luxuryMarketGeometry, luxuryMarketMaterial)
  luxuryMarket.rotation.x = -Math.PI / 2
  luxuryMarket.position.set(palermoBajoCenter.x, 0.08, palermoBajoCenter.z + 15)
  scene.add(luxuryMarket)
  
  // Puestos de lujo especializados
  const luxuryStalls = [
    { name: 'Sedas Imperiales', x: palermoBajoCenter.x - 6, z: palermoBajoCenter.z + 15, color: 0xFF6B9D },
    { name: 'Joyas Reales', x: palermoBajoCenter.x + 6, z: palermoBajoCenter.z + 15, color: 0xFFD700 },
    { name: 'Especias Exóticas', x: palermoBajoCenter.x, z: palermoBajoCenter.z + 9, color: 0xFF8C00 },
    { name: 'Pieles Finas', x: palermoBajoCenter.x, z: palermoBajoCenter.z + 21, color: 0x8B4513 }
  ]
  
  for (const stall of luxuryStalls) {
    const stallGeometry = new THREE.BoxGeometry(3, 3, 3)
    const stallMaterial = new THREE.MeshLambertMaterial({ color: stall.color })
    const stallMesh = new THREE.Mesh(stallGeometry, stallMaterial)
    stallMesh.position.set(stall.x, 1.5, stall.z)
    scene.add(stallMesh)
    
    // Toldo elegante
    const canopyGeometry = new THREE.BoxGeometry(4, 0.2, 4)
    const canopyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial)
    canopy.position.set(stall.x, 3.5, stall.z)
    scene.add(canopy)
  }
}

// ============ INFRAESTRUCTURA UNIFICADA DE PALERMO ============
async function createPalermoInfrastructure(materials: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating PALERMO unified infrastructure...')
  
  // ============ GRAN AVENIDA DE PALERMO ============
  // Conecta los tres sub-distritos
  const grandAvenueGeometry = new THREE.BoxGeometry(120, 0.2, 8)
  const grandAvenueMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
  const grandAvenue = new THREE.Mesh(grandAvenueGeometry, grandAvenueMaterial)
  grandAvenue.position.set(-60, 0.05, -40)
  scene.add(grandAvenue)
  
  // ============ PLAZA MAYOR DE PALERMO ============
  // Plaza central del distrito noble
  const majorPlazaGeometry = new THREE.CircleGeometry(18, 32)
  const majorPlazaMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFACD })
  const majorPlaza = new THREE.Mesh(majorPlazaGeometry, majorPlazaMaterial)
  majorPlaza.rotation.x = -Math.PI / 2
  majorPlaza.position.set(-60, 0.1, -40)
  scene.add(majorPlaza)
  
  // ============ CATEDRAL DE PALERMO ============
  // Magnífica catedral del distrito
  const cathedralGeometry = new THREE.BoxGeometry(15, 20, 25)
  const cathedral = new THREE.Mesh(cathedralGeometry, materials.marble)
  cathedral.position.set(-60, 10, -65)
  cathedral.castShadow = true
  scene.add(cathedral)
  
  // Torres gemelas de la catedral
  for (let side = -1; side <= 1; side += 2) {
    const towerGeometry = new THREE.BoxGeometry(4, 30, 4)
    const tower = new THREE.Mesh(towerGeometry, materials.marble)
    tower.position.set(-60 + side * 8, 15, -52)
    scene.add(tower)
    
    // Campanas en torres
    for (let i = 0; i < 3; i++) {
      const bellGeometry = new THREE.SphereGeometry(0.8, 8, 6)
      const bellMaterial = new THREE.MeshLambertMaterial({ color: 0xB8860B })
      const bell = new THREE.Mesh(bellGeometry, bellMaterial)
      bell.position.set(-60 + side * 8, 25 + i * 2, -52)
      scene.add(bell)
    }
    
    // Tejado puntiagudo
    const spireGeometry = new THREE.ConeGeometry(3, 8, 8)
    const spire = new THREE.Mesh(spireGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
    spire.position.set(-60 + side * 8, 34, -52)
    scene.add(spire)
  }
  
  // Cúpula central de la catedral
  const cathedralDomeGeometry = new THREE.SphereGeometry(8, 16, 12)
  const cathedralDome = new THREE.Mesh(cathedralDomeGeometry, materials.gold)
  cathedralDome.position.set(-60, 25, -65)
  scene.add(cathedralDome)
  
  // ============ UNIVERSIDAD DE PALERMO ============
  // Centro de educación nobiliaria
  const universityGeometry = new THREE.BoxGeometry(20, 8, 15)
  const universityMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
  const university = new THREE.Mesh(universityGeometry, universityMaterial)
  university.position.set(-80, 4, -15)
  scene.add(university)
  
  // Torre del reloj de la universidad
  const clockTowerGeometry = new THREE.CylinderGeometry(2, 3, 15, 12)
  const clockTower = new THREE.Mesh(clockTowerGeometry, universityMaterial)
  clockTower.position.set(-80, 7.5, -8)
  scene.add(clockTower)
  
  // Reloj
  const clockGeometry = new THREE.CircleGeometry(2, 16)
  const clockMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const clock = new THREE.Mesh(clockGeometry, clockMaterial)
  clock.position.set(-78, 12, -8)
  scene.add(clock)
  
  // ============ JARDINES PÚBLICOS DE PALERMO ============
  // Extensos jardines para la nobleza
  const publicGardensGeometry = new THREE.CircleGeometry(25, 32)
  const publicGardensMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x228B22, 
    transparent: true, 
    opacity: 0.7 
  })
  const publicGardens = new THREE.Mesh(publicGardensGeometry, publicGardensMaterial)
  publicGardens.rotation.x = -Math.PI / 2
  publicGardens.position.set(-30, 0.02, -40)
  scene.add(publicGardens)
  
  // Fuentes ornamentales en jardines
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const fountainX = -30 + Math.cos(angle) * 15
    const fountainZ = -40 + Math.sin(angle) * 15
    
    const fountainGeometry = new THREE.CylinderGeometry(3, 3.5, 2, 16)
    const fountain = new THREE.Mesh(fountainGeometry, materials.marble)
    fountain.position.set(fountainX, 1, fountainZ)
    scene.add(fountain)
  }
  
  // Árboles ornamentales
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 5 + Math.random() * 15
    const treeX = -30 + Math.cos(angle) * radius
    const treeZ = -40 + Math.sin(angle) * radius
    
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 6, 8)
    const trunk = new THREE.Mesh(trunkGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
    trunk.position.set(treeX, 3, treeZ)
    scene.add(trunk)
    
    const leavesGeometry = new THREE.SphereGeometry(2.5, 12, 8)
    const leaves = new THREE.Mesh(leavesGeometry, new THREE.MeshLambertMaterial({ color: 0x228B22 }))
    leaves.position.set(treeX, 7, treeZ)
    scene.add(leaves)
  }
  
  console.log('PALERMO infrastructure completed!')
}

const createOpusDistrict = async (): Promise<void> => {
  if (!scene) return

  const materials = {
    iron: new THREE.MeshLambertMaterial({ color: 0x4A4A4A }),     // Hierro gris
    wood: new THREE.MeshLambertMaterial({ color: 0x654321 }),     // Madera marrón
    stone: new THREE.MeshLambertMaterial({ color: 0x696969 }),    // Piedra gris
    bronze: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),   // Bronce
    brick: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),    // Ladrillo
    fire: new THREE.MeshLambertMaterial({ 
      color: 0xFF4500, 
      emissive: 0xFF2200, 
      emissiveIntensity: 0.3 
    })  // Fuego de forjas
  }

  // ============ DISTRITO OPUS MASIVO - ZONA INDUSTRIAL ÉPICA ============
  // Posicionado fuera de la muralla exterior (oeste)
  const opusCenter = { x: -350, z: 0 }
  const opusRadius = 85 // Ligeramente más grande que el castillo

  console.log('Creating MASSIVE OPUS INDUSTRIAL DISTRICT outside city walls...')

  // Base del distrito industrial
  const opusBaseGeometry = new THREE.CircleGeometry(opusRadius, 32)
  const opusBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x654321,  // Tierra industrial marrón
    transparent: true, 
    opacity: 0.7 
  })
  const opusBase = new THREE.Mesh(opusBaseGeometry, opusBaseMaterial)
  opusBase.rotation.x = -Math.PI / 2
  opusBase.position.set(opusCenter.x, 0.1, opusCenter.z)
  scene.add(opusBase)

  // ========== ZONA NORTE - FORJAS IMPERIALES MASIVAS ==========
  const forgeZoneCenter = { x: opusCenter.x, z: opusCenter.z - 40 }

  // GRAN FORJA IMPERIAL CENTRAL
  const grandForgeGeometry = new THREE.BoxGeometry(50, 20, 30)
  const grandForge = new THREE.Mesh(grandForgeGeometry, materials.stone)
  grandForge.position.set(forgeZoneCenter.x, 10, forgeZoneCenter.z)
  scene.add(grandForge)

  // Chimeneas masivas de la gran forja (12 chimeneas)
  for (let i = 0; i < 12; i++) {
    const chimneyX = forgeZoneCenter.x - 20 + (i % 6) * 8
    const chimneyZ = forgeZoneCenter.z - 10 + Math.floor(i / 6) * 20

    const chimneyGeometry = new THREE.CylinderGeometry(2, 3, 35, 8)
    const chimney = new THREE.Mesh(chimneyGeometry, materials.brick)
    chimney.position.set(chimneyX, 37.5, chimneyZ)
    scene.add(chimney)

    // Humo/fuego saliendo de las chimeneas
    const smokeGeometry = new THREE.CylinderGeometry(1.5, 0.5, 8, 6)
    const smoke = new THREE.Mesh(smokeGeometry, materials.fire)
    smoke.position.set(chimneyX, 45, chimneyZ)
    scene.add(smoke)
  }

  // FORJAS ESPECIALIZADAS (6 forjas menores)
  const specializedForges = [
    { name: 'Forja de Armas', x: forgeZoneCenter.x - 30, z: forgeZoneCenter.z + 20, type: 'weapons' },
    { name: 'Forja de Armaduras', x: forgeZoneCenter.x + 30, z: forgeZoneCenter.z + 20, type: 'armor' },
    { name: 'Fundición de Bronce', x: forgeZoneCenter.x - 35, z: forgeZoneCenter.z - 25, type: 'bronze' },
    { name: 'Forja de Herramientas', x: forgeZoneCenter.x + 35, z: forgeZoneCenter.z - 25, type: 'tools' },
    { name: 'Forja de Joyas', x: forgeZoneCenter.x - 20, z: forgeZoneCenter.z + 35, type: 'jewelry' },
    { name: 'Forja Real', x: forgeZoneCenter.x + 20, z: forgeZoneCenter.z + 35, type: 'royal' }
  ]

  specializedForges.forEach(forge => {
    const forgeGeometry = new THREE.BoxGeometry(15, 12, 20)
    const forgeMesh = new THREE.Mesh(forgeGeometry, materials.stone)
    forgeMesh.position.set(forge.x, 6, forge.z)
    scene.add(forgeMesh)

    // Chimeneas de forjas especializadas
    for (let i = 0; i < 3; i++) {
      const chimneyGeometry = new THREE.CylinderGeometry(1.5, 2, 25, 8)
      const chimney = new THREE.Mesh(chimneyGeometry, materials.brick)
      chimney.position.set(forge.x + (i - 1) * 6, 24.5, forge.z + 8)
      scene.add(chimney)

      // Fuego
      const fireGeometry = new THREE.CylinderGeometry(1, 0.3, 5, 6)
      const fire = new THREE.Mesh(fireGeometry, materials.fire)
      fire.position.set(forge.x + (i - 1) * 6, 29, forge.z + 8)
      scene.add(fire)
    }

    // Yunques masivos (10 por forja)
    for (let i = 0; i < 10; i++) {
      const anvilX = forge.x - 8 + (i % 5) * 4
      const anvilZ = forge.z - 8 + Math.floor(i / 5) * 8

      const anvilBaseGeometry = new THREE.BoxGeometry(2, 1, 1.5)
      const anvilBase = new THREE.Mesh(anvilBaseGeometry, materials.stone)
      anvilBase.position.set(anvilX, 0.5, anvilZ)
      scene.add(anvilBase)

      const anvilTopGeometry = new THREE.BoxGeometry(1.5, 0.5, 1)
      const anvilTop = new THREE.Mesh(anvilTopGeometry, materials.iron)
      anvilTop.position.set(anvilX, 1.25, anvilZ)
      scene.add(anvilTop)
    }
  })

  // ========== ZONA CENTRO - ASTILLEROS Y CARPINTERÍAS MASIVAS ==========
  const carpentryZoneCenter = { x: opusCenter.x, z: opusCenter.z }

  // GRAN ASTILLERO TERRESTRE
  const shipyardGeometry = new THREE.BoxGeometry(60, 8, 40)
  const shipyard = new THREE.Mesh(shipyardGeometry, materials.wood)
  shipyard.position.set(carpentryZoneCenter.x, 4, carpentryZoneCenter.z)
  scene.add(shipyard)

  // Barcos en construcción terrestre (3 barcos)
  for (let i = 0; i < 3; i++) {
    const shipX = carpentryZoneCenter.x - 15 + (i * 15)
    
    const shipHullGeometry = new THREE.BoxGeometry(20, 6, 12)
    const shipHull = new THREE.Mesh(shipHullGeometry, materials.wood)
    shipHull.position.set(shipX, 7, carpentryZoneCenter.z)
    scene.add(shipHull)

    // Mástiles
    for (let m = 0; m < 3; m++) {
      const mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 8)
      const mast = new THREE.Mesh(mastGeometry, materials.wood)
      mast.position.set(shipX + (m - 1) * 6, 17, carpentryZoneCenter.z)
      scene.add(mast)
    }
  }

  // CARPINTERÍAS ESPECIALIZADAS (8 talleres)
  const carpentryShops = [
    { name: 'Taller de Muebles Reales', x: carpentryZoneCenter.x - 40, z: carpentryZoneCenter.z - 30 },
    { name: 'Taller de Carretería', x: carpentryZoneCenter.x + 40, z: carpentryZoneCenter.z - 30 },
    { name: 'Taller de Instrumentos', x: carpentryZoneCenter.x - 40, z: carpentryZoneCenter.z + 30 },
    { name: 'Taller de Construcción', x: carpentryZoneCenter.x + 40, z: carpentryZoneCenter.z + 30 },
    { name: 'Carpintería Naval', x: carpentryZoneCenter.x - 25, z: carpentryZoneCenter.z - 45 },
    { name: 'Taller de Esculturas', x: carpentryZoneCenter.x + 25, z: carpentryZoneCenter.z - 45 },
    { name: 'Ebanistería Fina', x: carpentryZoneCenter.x - 25, z: carpentryZoneCenter.z + 45 },
    { name: 'Taller de Arcos', x: carpentryZoneCenter.x + 25, z: carpentryZoneCenter.z + 45 }
  ]

  carpentryShops.forEach(shop => {
    const shopGeometry = new THREE.BoxGeometry(20, 10, 15)
    const shopMesh = new THREE.Mesh(shopGeometry, materials.wood)
    shopMesh.position.set(shop.x, 5, shop.z)
    scene.add(shopMesh)

    // Ruedas hidráulicas para cada taller
    const wheelGeometry = new THREE.CylinderGeometry(4, 4, 2, 16)
    const wheel = new THREE.Mesh(wheelGeometry, materials.wood)
    wheel.position.set(shop.x + 12, 8, shop.z)
    wheel.rotation.z = Math.PI / 2
    scene.add(wheel)

    // Productos exhibidos afuera
    for (let i = 0; i < 6; i++) {
      const productGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
      const product = new THREE.Mesh(productGeometry, materials.wood)
      product.position.set(
        shop.x - 12 + (i % 3) * 2,
        0.75,
        shop.z - 8 + Math.floor(i / 3) * 4
      )
      scene.add(product)
    }
  })

  // ========== ZONA SUR - TEXTILES Y COMERCIO MASIVO ==========
  const textileZoneCenter = { x: opusCenter.x, z: opusCenter.z + 45 }

  // FÁBRICA TEXTIL PRINCIPAL
  const textileFactoryGeometry = new THREE.BoxGeometry(50, 15, 25)
  const textileFactory = new THREE.Mesh(textileFactoryGeometry, materials.stone)
  textileFactory.position.set(textileZoneCenter.x, 7.5, textileZoneCenter.z)
  scene.add(textileFactory)

  // Telares masivos dentro (vista desde arriba)
  for (let i = 0; i < 20; i++) {
    const loomX = textileZoneCenter.x - 20 + (i % 10) * 4
    const loomZ = textileZoneCenter.z - 8 + Math.floor(i / 10) * 8

    const loomGeometry = new THREE.BoxGeometry(2, 3, 1.5)
    const loom = new THREE.Mesh(loomGeometry, materials.wood)
    loom.position.set(loomX, 1.5, loomZ)
    scene.add(loom)
  }

  // TALLERES DE TINTURAS (4 talleres)
  const dyeWorkshops = [
    { x: textileZoneCenter.x - 30, z: textileZoneCenter.z + 20 },
    { x: textileZoneCenter.x + 30, z: textileZoneCenter.z + 20 },
    { x: textileZoneCenter.x - 30, z: textileZoneCenter.z - 25 },
    { x: textileZoneCenter.x + 30, z: textileZoneCenter.z - 25 }
  ]

  dyeWorkshops.forEach((pos, index) => {
    const workshopGeometry = new THREE.BoxGeometry(15, 8, 12)
    const workshop = new THREE.Mesh(workshopGeometry, materials.stone)
    workshop.position.set(pos.x, 4, pos.z)
    scene.add(workshop)

    // Calderos de tintes (colores diferentes)
    const dyeColors = [0xFF0000, 0x0000FF, 0xFFD700, 0x800080]
    for (let i = 0; i < 6; i++) {
      const cauldronGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 12)
      const cauldronMaterial = new THREE.MeshLambertMaterial({ color: dyeColors[index] })
      const cauldron = new THREE.Mesh(cauldronGeometry, cauldronMaterial)
      cauldron.position.set(
        pos.x - 6 + (i % 3) * 4,
        1,
        pos.z - 3 + Math.floor(i / 3) * 6
      )
      scene.add(cauldron)
    }
  })

  // HILANDERÍA IMPERIAL
  const spinneryGeometry = new THREE.BoxGeometry(40, 12, 20)
  const spinnery = new THREE.Mesh(spinneryGeometry, materials.wood)
  spinnery.position.set(textileZoneCenter.x, 6, textileZoneCenter.z + 35)
  scene.add(spinnery)

  // Ruedas de hilar masivas (12 ruedas)
  for (let i = 0; i < 12; i++) {
    const wheelX = textileZoneCenter.x - 15 + (i % 6) * 5
    const wheelZ = textileZoneCenter.z + 30 + Math.floor(i / 6) * 10

    const spinningWheelGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 16)
    const spinningWheel = new THREE.Mesh(spinningWheelGeometry, materials.wood)
    spinningWheel.position.set(wheelX, 2, wheelZ)
    scene.add(spinningWheel)
  }

  // PLAZA CENTRAL DEL DISTRITO OPUS
  const opusPlazaGeometry = new THREE.CircleGeometry(15, 24)
  const opusPlaza = new THREE.Mesh(opusPlazaGeometry, materials.stone)
  opusPlaza.rotation.x = -Math.PI / 2
  opusPlaza.position.set(opusCenter.x, 0.15, opusCenter.z + 20)
  scene.add(opusPlaza)

  // ESTATUA DEL GRAN MAESTRO ARTESANO
  const statueBaseGeometry = new THREE.CylinderGeometry(3, 4, 6, 16)
  const statueBase = new THREE.Mesh(statueBaseGeometry, materials.stone)
  statueBase.position.set(opusCenter.x, 3, opusCenter.z + 20)
  scene.add(statueBase)

  const statueGeometry = new THREE.CylinderGeometry(1.5, 2, 8, 8)
  const statue = new THREE.Mesh(statueGeometry, materials.bronze)
  statue.position.set(opusCenter.x, 10, opusCenter.z + 20)
  scene.add(statue)

  // INFRAESTRUCTURA: Canales hidráulicos para las ruedas
  const canalPositions = [
    { start: { x: opusCenter.x - 60, z: opusCenter.z - 60 }, end: { x: opusCenter.x + 60, z: opusCenter.z + 60 } },
    { start: { x: opusCenter.x - 60, z: opusCenter.z + 60 }, end: { x: opusCenter.x + 60, z: opusCenter.z - 60 } }
  ]

  canalPositions.forEach(canal => {
    const canalLength = Math.sqrt(
      Math.pow(canal.end.x - canal.start.x, 2) + 
      Math.pow(canal.end.z - canal.start.z, 2)
    )
    const canalAngle = Math.atan2(canal.end.z - canal.start.z, canal.end.x - canal.start.x)

    const canalGeometry = new THREE.BoxGeometry(canalLength, 1, 3)
    const canalMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4682B4,
      transparent: true,
      opacity: 0.8 
    })
    const canalMesh = new THREE.Mesh(canalGeometry, canalMaterial)
    canalMesh.position.set(
      (canal.start.x + canal.end.x) / 2,
      0.5,
      (canal.start.z + canal.end.z) / 2
    )
    canalMesh.rotation.y = canalAngle
    scene.add(canalMesh)
  })
}

// ============ OPUS NORTE - FORJAS IMPERIALES ============
async function createOpusNorte(workshopMaterial: any, metalMaterial: any, brickMaterial: any, smokeMaterial: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating OPUS NORTE - Imperial Forges...')
  
  const opusNorteCenter = { x: 60, z: 40 }
  const radius = 30
  
  // Base territorial industrial
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x654321, // Marrón oscuro industrial
    transparent: true, 
    opacity: 0.7 
  })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(opusNorteCenter.x, 0.05, opusNorteCenter.z)
  scene.add(districtBase)
  
  // FORJAS MASIVAS - Complejos metalúrgicos
  const forges = [
    { 
      name: 'Gran Forja Imperial', 
      x: opusNorteCenter.x, 
      z: opusNorteCenter.z - 10, 
      width: 18, 
      height: 12, 
      depth: 15, 
      type: 'mega_forge',
      chimneys: 8
    },
    { 
      name: 'Forja de Armas Reales', 
      x: opusNorteCenter.x - 20, 
      z: opusNorteCenter.z + 5, 
      width: 12, 
      height: 8, 
      depth: 10, 
      type: 'weapon_forge',
      chimneys: 4
    },
    { 
      name: 'Fundición de Bronce Imperial', 
      x: opusNorteCenter.x + 18, 
      z: opusNorteCenter.z - 5, 
      width: 14, 
      height: 10, 
      depth: 12, 
      type: 'foundry',
      chimneys: 6
    },
    { 
      name: 'Herrería de Herraduras', 
      x: opusNorteCenter.x - 15, 
      z: opusNorteCenter.z - 15, 
      width: 8, 
      height: 6, 
      depth: 8, 
      type: 'horseshoe_forge',
      chimneys: 2
    },
    { 
      name: 'Forja de Herramientas', 
      x: opusNorteCenter.x + 12, 
      z: opusNorteCenter.z + 12, 
      width: 10, 
      height: 7, 
      depth: 9, 
      type: 'tool_forge',
      chimneys: 3
    }
  ]
  
  for (const forge of forges) {
    // Edificio principal de la forja
    const forgeGeometry = new THREE.BoxGeometry(forge.width, forge.height, forge.depth)
    const forgeMesh = new THREE.Mesh(forgeGeometry, brickMaterial)
    forgeMesh.position.set(forge.x, forge.height/2, forge.z)
    forgeMesh.castShadow = true
    scene.add(forgeMesh)
    
    // Múltiples chimeneas según tamaño
    for (let i = 0; i < forge.chimneys; i++) {
      const angle = (i / forge.chimneys) * Math.PI * 2
      const chimneyRadius = Math.min(forge.width, forge.depth) * 0.3
      const chimneyX = forge.x + Math.cos(angle) * chimneyRadius
      const chimneyZ = forge.z + Math.sin(angle) * chimneyRadius
      
      const chimneyGeometry = new THREE.CylinderGeometry(1.2, 1.5, forge.height + 8, 8)
      const chimney = new THREE.Mesh(chimneyGeometry, metalMaterial)
      chimney.position.set(chimneyX, (forge.height + 8)/2, chimneyZ)
      scene.add(chimney)
      
      // Humo saliendo
      const smokeGeometry = new THREE.CylinderGeometry(2, 1, 5, 6)
      const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
      smoke.position.set(chimneyX, forge.height + 10, chimneyZ)
      scene.add(smoke)
    }
    
    // Yunques masivos exteriores
    const numAnvils = forge.type === 'mega_forge' ? 8 : 4
    for (let i = 0; i < numAnvils; i++) {
      const anvilX = forge.x + forge.width/2 + 3 + (i % 4) * 2
      const anvilZ = forge.z + (Math.floor(i / 4) - 0.5) * 4
      
      const anvilGeometry = new THREE.BoxGeometry(2.5, 1.2, 1.5)
      const anvil = new THREE.Mesh(anvilGeometry, metalMaterial)
      anvil.position.set(anvilX, 0.6, anvilZ)
      scene.add(anvil)
      
      // Martillos y herramientas
      for (let j = 0; j < 3; j++) {
        const hammerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6)
        const hammer = new THREE.Mesh(hammerGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
        hammer.position.set(
          anvilX + (Math.random() - 0.5) * 3,
          0.8,
          anvilZ + (Math.random() - 0.5) * 3
        )
        hammer.rotation.z = Math.random() * Math.PI
        scene.add(hammer)
      }
    }
    
    // Depósitos de carbón y materiales
    for (let i = 0; i < 5; i++) {
      const coalGeometry = new THREE.SphereGeometry(2.5, 8, 6)
      const coalMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
      const coal = new THREE.Mesh(coalGeometry, coalMaterial)
      coal.position.set(
        forge.x - forge.width/2 - 5,
        1.2,
        forge.z + (i - 2) * 3
      )
      coal.scale.y = 0.7
      scene.add(coal)
    }
    
    // Almacén de productos terminados
    const warehouseGeometry = new THREE.BoxGeometry(8, 5, 6)
    const warehouse = new THREE.Mesh(warehouseGeometry, workshopMaterial)
    warehouse.position.set(forge.x - forge.width - 6, 2.5, forge.z)
    scene.add(warehouse)
  }
  
  // Plaza de herreros central
  const forgePlazaGeometry = new THREE.CircleGeometry(12, 24)
  const forgePlazaMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
  const forgePlaza = new THREE.Mesh(forgePlazaGeometry, forgePlazaMaterial)
  forgePlaza.rotation.x = -Math.PI / 2
  forgePlaza.position.set(opusNorteCenter.x, 0.08, opusNorteCenter.z + 20)
  scene.add(forgePlaza)
  
  // Estatua del Dios Herrero
  const statueGeometry = new THREE.CylinderGeometry(3, 4, 8, 12)
  const statue = new THREE.Mesh(statueGeometry, metalMaterial)
  statue.position.set(forgePlaza.position.x, 4, forgePlaza.position.z)
  scene.add(statue)
}

// ============ OPUS CENTRO - GREMIOS ARTESANALES ============
async function createOpusCentro(workshopMaterial: any, metalMaterial: any, stoneMaterial: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating OPUS CENTRO - Artisan Guilds...')
  
  const opusCentroCenter = { x: 80, z: 60 }
  const radius = 32
  
  // Base territorial artesanal
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x8B7355, // Marrón artesanal
    transparent: true, 
    opacity: 0.6 
  })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(opusCentroCenter.x, 0.04, opusCentroCenter.z)
  scene.add(districtBase)
  
  // ASTILLEROS TERRESTRES - Construcción naval masiva
  const shipyards = [
    {
      name: 'Gran Astillero Imperial',
      x: opusCentroCenter.x - 8,
      z: opusCentroCenter.z - 12,
      width: 25,
      height: 8,
      depth: 18,
      ships: 3
    },
    {
      name: 'Astillero de Barcos Mercantes',
      x: opusCentroCenter.x + 12,
      z: opusCentroCenter.z + 8,
      width: 20,
      height: 6,
      depth: 15,
      ships: 2
    }
  ]
  
  for (const shipyard of shipyards) {
    // Edificio principal del astillero
    const shipyardGeometry = new THREE.BoxGeometry(shipyard.width, shipyard.height, shipyard.depth)
    const shipyardMesh = new THREE.Mesh(shipyardGeometry, workshopMaterial)
    shipyardMesh.position.set(shipyard.x, shipyard.height/2, shipyard.z)
    shipyardMesh.castShadow = true
    scene.add(shipyardMesh)
    
    // Barcos en construcción
    for (let i = 0; i < shipyard.ships; i++) {
      const shipX = shipyard.x + (i - (shipyard.ships-1)/2) * 8
      const shipZ = shipyard.z + shipyard.depth/2 + 5
      
      const shipHullGeometry = new THREE.BoxGeometry(15, 4, 5)
      const shipMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
      const shipHull = new THREE.Mesh(shipHullGeometry, shipMaterial)
      shipHull.position.set(shipX, 2.5, shipZ)
      shipHull.rotation.y = Math.PI / 8
      scene.add(shipHull)
      
      // Andamios masivos alrededor del barco
      for (let j = 0; j < 16; j++) {
        const angle = (j / 16) * Math.PI * 2
        const scaffoldX = shipX + Math.cos(angle) * 10
        const scaffoldZ = shipZ + Math.sin(angle) * 8
        
        const scaffoldGeometry = new THREE.BoxGeometry(0.4, 8, 0.4)
        const scaffold = new THREE.Mesh(scaffoldGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        scaffold.position.set(scaffoldX, 4, scaffoldZ)
        scene.add(scaffold)
      }
    }
    
    // Depósitos de madera masivos
    for (let i = 0; i < 20; i++) {
      const logX = shipyard.x - shipyard.width/2 - 5 + (i % 5) * 2
      const logY = 0.3 + Math.floor(i / 5) * 0.6
      const logZ = shipyard.z + (Math.floor(i / 10) - 0.5) * 8
      
      const logGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 8)
      const log = new THREE.Mesh(logGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      log.position.set(logX, logY, logZ)
      log.rotation.z = Math.PI / 2
      scene.add(log)
    }
  }
  
  // CARPINTERÍAS ESPECIALIZADAS
  const carpentries = [
    { name: 'Carpintería Real', x: opusCentroCenter.x + 15, z: opusCentroCenter.z - 8, width: 12, height: 6, depth: 10, type: 'royal' },
    { name: 'Taller de Muebles Finos', x: opusCentroCenter.x - 18, z: opusCentroCenter.z + 10, width: 10, height: 5, depth: 8, type: 'furniture' },
    { name: 'Carpintería de Instrumentos', x: opusCentroCenter.x + 8, z: opusCentroCenter.z + 18, width: 8, height: 4, depth: 6, type: 'instruments' },
    { name: 'Taller de Carretas', x: opusCentroCenter.x - 12, z: opusCentroCenter.z - 18, width: 15, height: 5, depth: 12, type: 'carts' }
  ]
  
  for (const carpentry of carpentries) {
    // Edificio de la carpintería
    const carpentryGeometry = new THREE.BoxGeometry(carpentry.width, carpentry.height, carpentry.depth)
    const carpentryMesh = new THREE.Mesh(carpentryGeometry, workshopMaterial)
    carpentryMesh.position.set(carpentry.x, carpentry.height/2, carpentry.z)
    carpentryMesh.castShadow = true
    scene.add(carpentryMesh)
    
    // Aserraderos con ruedas hidráulicas
    const wheelGeometry = new THREE.CylinderGeometry(4, 4, 1.5, 16)
    const wheel = new THREE.Mesh(wheelGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
    wheel.position.set(carpentry.x + carpentry.width/2 + 3, 4, carpentry.z)
    wheel.rotation.z = Math.PI / 2
    scene.add(wheel)
    
    // Productos según especialidad
    if (carpentry.type === 'furniture') {
      // Muebles exhibidos
      for (let i = 0; i < 6; i++) {
        const tableGeometry = new THREE.BoxGeometry(1.5, 0.8, 1)
        const table = new THREE.Mesh(tableGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        table.position.set(
          carpentry.x + carpentry.width/2 + 2,
          0.4,
          carpentry.z + (i - 2.5) * 1.5
        )
        scene.add(table)
      }
    }
    
    if (carpentry.type === 'carts') {
      // Carretas terminadas
      for (let i = 0; i < 3; i++) {
        const cartBodyGeometry = new THREE.BoxGeometry(3, 1.5, 1.5)
        const cartBody = new THREE.Mesh(cartBodyGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        cartBody.position.set(
          carpentry.x + carpentry.width/2 + 4,
          0.75,
          carpentry.z + (i - 1) * 3
        )
        scene.add(cartBody)
        
        // Ruedas
        for (let j = 0; j < 4; j++) {
          const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12)
          const wheel = new THREE.Mesh(wheelGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
          wheel.position.set(
            cartBody.position.x + (j % 2 === 0 ? -1.2 : 1.2),
            0.8,
            cartBody.position.z + (j < 2 ? -0.6 : 0.6)
          )
          wheel.rotation.x = Math.PI / 2
          scene.add(wheel)
        }
      }
    }
  }
  
  // Plaza Artesanal Central
  const artisanPlazaGeometry = new THREE.CircleGeometry(10, 20)
  const artisanPlazaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 })
  const artisanPlaza = new THREE.Mesh(artisanPlazaGeometry, artisanPlazaMaterial)
  artisanPlaza.rotation.x = -Math.PI / 2
  artisanPlaza.position.set(opusCentroCenter.x, 0.06, opusCentroCenter.z + 25)
  scene.add(artisanPlaza)
}

// ============ OPUS SUR - TEXTILES Y COMERCIO ============
async function createOpusSur(workshopMaterial: any, metalMaterial: any, stoneMaterial: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating OPUS SUR - Textiles and Commerce...')
  
  const opusSurCenter = { x: 70, z: 80 }
  const radius = 28
  
  // Base territorial textil
  const districtBaseGeometry = new THREE.CircleGeometry(radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x9ACD32, // Verde textil
    transparent: true, 
    opacity: 0.5 
  })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(opusSurCenter.x, 0.03, opusSurCenter.z)
  scene.add(districtBase)
  
  // FÁBRICAS TEXTILES MASIVAS
  const textileFactories = [
    {
      name: 'Gran Fábrica de Tapices',
      x: opusSurCenter.x - 10,
      z: opusSurCenter.z - 8,
      width: 18,
      height: 8,
      depth: 12,
      looms: 12
    },
    {
      name: 'Hilandería Imperial',
      x: opusSurCenter.x + 12,
      z: opusSurCenter.z + 5,
      width: 15,
      height: 6,
      depth: 10,
      looms: 8
    },
    {
      name: 'Taller de Sedas',
      x: opusSurCenter.x - 5,
      z: opusSurCenter.z + 15,
      width: 12,
      height: 5,
      depth: 8,
      looms: 6
    }
  ]
  
  for (const factory of textileFactories) {
    // Edificio principal
    const factoryGeometry = new THREE.BoxGeometry(factory.width, factory.height, factory.depth)
    const factoryMesh = new THREE.Mesh(factoryGeometry, workshopMaterial)
    factoryMesh.position.set(factory.x, factory.height/2, factory.z)
    factoryMesh.castShadow = true
    scene.add(factoryMesh)
    
    // Telares masivos
    for (let i = 0; i < factory.looms; i++) {
      const loomX = factory.x + (i % 4 - 1.5) * 3
      const loomZ = factory.z + factory.depth/2 + 2 + Math.floor(i / 4) * 2
      
      const loomGeometry = new THREE.BoxGeometry(2.5, 2, 1.5)
      const loom = new THREE.Mesh(loomGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      loom.position.set(loomX, 1, loomZ)
      scene.add(loom)
      
      // Hilos y telas en el telar
      const threadColors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x6C5CE7, 0xFD79A8]
      for (let j = 0; j < 5; j++) {
        const threadGeometry = new THREE.BoxGeometry(2, 0.1, 0.1)
        const threadMaterial = new THREE.MeshLambertMaterial({ 
          color: threadColors[j % threadColors.length] 
        })
        const thread = new THREE.Mesh(threadGeometry, threadMaterial)
        thread.position.set(loomX, 1.8 + j * 0.2, loomZ)
        scene.add(thread)
      }
    }
    
    // Almacén de materias primas
    const warehouseGeometry = new THREE.BoxGeometry(10, 4, 8)
    const warehouse = new THREE.Mesh(warehouseGeometry, stoneMaterial)
    warehouse.position.set(factory.x - factory.width - 8, 2, factory.z)
    scene.add(warehouse)
    
    // Balas de lana y algodón
    for (let i = 0; i < 12; i++) {
      const baleGeometry = new THREE.BoxGeometry(1, 1, 1.5)
      const baleMaterial = new THREE.MeshLambertMaterial({ 
        color: i % 2 === 0 ? 0xFFFAF0 : 0xF5DEB3 // Alternando blanco y beige
      })
      const bale = new THREE.Mesh(baleGeometry, baleMaterial)
      bale.position.set(
        warehouse.position.x + (i % 4 - 1.5) * 1.5,
        0.5 + Math.floor(i / 8) * 1.2,
        warehouse.position.z + (Math.floor(i / 4) % 2 - 0.5) * 2
      )
      scene.add(bale)
    }
  }
  
  // TALLERES DE TINTURAS
  const dyeShops = [
    { name: 'Tinturas Imperiales', x: opusSurCenter.x + 8, z: opusSurCenter.z - 15, width: 8, height: 4, depth: 6 },
    { name: 'Taller de Colores Exóticos', x: opusSurCenter.x - 15, z: opusSurCenter.z + 8, width: 6, height: 3.5, depth: 5 }
  ]
  
  for (const dyeShop of dyeShops) {
    // Edificio del taller
    const shopGeometry = new THREE.BoxGeometry(dyeShop.width, dyeShop.height, dyeShop.depth)
    const shopMesh = new THREE.Mesh(shopGeometry, workshopMaterial)
    shopMesh.position.set(dyeShop.x, dyeShop.height/2, dyeShop.z)
    scene.add(shopMesh)
    
    // Calderos de tinte
    for (let i = 0; i < 6; i++) {
      const cauldronGeometry = new THREE.CylinderGeometry(1, 1.2, 1.5, 12)
      const dyeColors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00, 0xFF00FF, 0x00FFFF]
      const cauldronMaterial = new THREE.MeshLambertMaterial({ color: dyeColors[i] })
      const cauldron = new THREE.Mesh(cauldronGeometry, cauldronMaterial)
      cauldron.position.set(
        dyeShop.x + dyeShop.width/2 + 2,
        0.75,
        dyeShop.z + (i - 2.5) * 1.5
      )
      scene.add(cauldron)
    }
    
    // Tendederos con telas teñidas
    for (let i = 0; i < 4; i++) {
      const lineGeometry = new THREE.BoxGeometry(6, 0.1, 0.1)
      const line = new THREE.Mesh(lineGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
      line.position.set(dyeShop.x - dyeShop.width/2 - 3, 3, dyeShop.z + (i - 1.5) * 1.5)
      scene.add(line)
      
      // Telas colgando
      for (let j = 0; j < 3; j++) {
        const clothGeometry = new THREE.PlaneGeometry(1.5, 2)
        const clothColors = [0xFF6B9D, 0x4ECDC4, 0xFFE66D, 0x6C5CE7, 0xFD79A8, 0x96CEB4]
        const clothMaterial = new THREE.MeshLambertMaterial({ 
          color: clothColors[(i * 3 + j) % clothColors.length] 
        })
        const cloth = new THREE.Mesh(clothGeometry, clothMaterial)
        cloth.position.set(
          line.position.x + (j - 1) * 1.8,
          2,
          line.position.z
        )
        scene.add(cloth)
      }
    }
  }
  
  // Mercado Textil
  const textileMarketGeometry = new THREE.CircleGeometry(8, 16)
  const textileMarketMaterial = new THREE.MeshLambertMaterial({ color: 0xBDB76B })
  const textileMarket = new THREE.Mesh(textileMarketGeometry, textileMarketMaterial)
  textileMarket.rotation.x = -Math.PI / 2
  textileMarket.position.set(opusSurCenter.x, 0.05, opusSurCenter.z - 25)
  scene.add(textileMarket)
}

// ============ INFRAESTRUCTURA COMPARTIDA DE OPUS ============
async function createOpusInfrastructure(metalMaterial: any, stoneMaterial: any): Promise<void> {
  if (!scene) return
  
  console.log('Creating OPUS infrastructure...')
  
  // Red de canales industriales (para energía hidráulica)
  const canals = [
    { from: { x: 45, z: 35 }, to: { x: 95, z: 85 }, width: 3 },
    { from: { x: 55, z: 30 }, to: { x: 85, z: 70 }, width: 2.5 },
    { from: { x: 50, z: 90 }, to: { x: 90, z: 60 }, width: 2 }
  ]
  
  for (const canal of canals) {
    const length = Math.sqrt(Math.pow(canal.to.x - canal.from.x, 2) + Math.pow(canal.to.z - canal.from.z, 2))
    const angle = Math.atan2(canal.to.z - canal.from.z, canal.to.x - canal.from.x)
    const midX = (canal.from.x + canal.to.x) / 2
    const midZ = (canal.from.z + canal.to.z) / 2
    
    const canalGeometry = new THREE.BoxGeometry(length, 1, canal.width)
    const canalMaterial = new THREE.MeshLambertMaterial({ color: 0x4682B4, transparent: true, opacity: 0.8 })
    const canalMesh = new THREE.Mesh(canalGeometry, canalMaterial)
    canalMesh.position.set(midX, -0.3, midZ)
    canalMesh.rotation.y = angle
    scene.add(canalMesh)
  }
  
  // Torre de vigilancia industrial
  const watchTowerGeometry = new THREE.CylinderGeometry(3, 4, 20, 12)
  const watchTower = new THREE.Mesh(watchTowerGeometry, stoneMaterial)
  watchTower.position.set(70, 10, 65)
  scene.add(watchTower)
  
  console.log('OPUS infrastructure completed!')
}

// ============ DISTRITOS ÉPICOS FUERA DE LAS MURALLAS ============
// Cada distrito debe ser del tamaño del castillo central o más grande

const createPort = async (): Promise<void> => {
  if (!scene) return

  const materials = {
    wood: new THREE.MeshLambertMaterial({ color: 0x654321 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x696969 }),
    marble: new THREE.MeshLambertMaterial({ color: 0x778899 }),
    gold: new THREE.MeshLambertMaterial({ color: 0xDAA520 }),
    steel: new THREE.MeshLambertMaterial({ color: 0x4A4A4A }),
    bronze: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),
    warehouse: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
    water: new THREE.MeshLambertMaterial({ color: 0x4682B4, transparent: true, opacity: 0.8 })
  }

  // ============ PUERTO IMPERIAL MASIVO - Mismo tamaño que el castillo ============
  // Posicionado FUERA de la muralla exterior (radio 220x180)
  const portCenter = { x: 300, z: 0 }  // Bien fuera de las murallas
  const portRadius = 80 // Mismo radio que la muralla interior

  console.log('Creating MASSIVE IMPERIAL PORT outside city walls...')

  // Base del puerto
  const portBaseGeometry = new THREE.CircleGeometry(portRadius, 32)
  const portBase = new THREE.Mesh(portBaseGeometry, materials.water)
  portBase.rotation.x = -Math.PI / 2
  portBase.position.set(portCenter.x, -1, portCenter.z)
  scene.add(portBase)

  // ========== BAHÍA IMPERIAL (Norte del Puerto) ==========
  const imperialBayCenter = { x: portCenter.x - 30, z: portCenter.z - 50 }

  // PALACIO PORTUARIO DEL EMPERADOR
  const harborPalaceGeometry = new THREE.BoxGeometry(25, 12, 20)
  const harborPalace = new THREE.Mesh(harborPalaceGeometry, materials.marble)
  harborPalace.position.set(imperialBayCenter.x, 6, imperialBayCenter.z)
  scene.add(harborPalace)

  // Cúpula dorada del palacio portuario
  const palaceDomeGeometry = new THREE.SphereGeometry(8, 16, 12)
  const palaceDome = new THREE.Mesh(palaceDomeGeometry, materials.gold)
  palaceDome.position.set(imperialBayCenter.x, 18, imperialBayCenter.z)
  scene.add(palaceDome)

  // MUELLE IMPERIAL PRINCIPAL (Masivo)
  const imperialDockGeometry = new THREE.BoxGeometry(60, 2, 20)
  const imperialDock = new THREE.Mesh(imperialDockGeometry, materials.marble)
  imperialDock.position.set(imperialBayCenter.x + 20, 1, imperialBayCenter.z + 15)
  scene.add(imperialDock)

  // Torres imperiales del muelle (8 torres)
  for (let i = 0; i < 8; i++) {
    const towerX = imperialBayCenter.x + 20 - 30 + (i * 8)
    const towerGeometry = new THREE.CylinderGeometry(3, 4, 18, 12)
    const tower = new THREE.Mesh(towerGeometry, materials.stone)
    tower.position.set(towerX, 9, imperialBayCenter.z + 25)
    scene.add(tower)

    // Coronas doradas
    const crownGeometry = new THREE.CylinderGeometry(3.5, 3, 2, 12)
    const crown = new THREE.Mesh(crownGeometry, materials.gold)
    crown.position.set(towerX, 19, imperialBayCenter.z + 25)
    scene.add(crown)
  }

  // ========== BAHÍA COMERCIAL MASIVA (Centro del Puerto) ==========
  const commercialBayCenter = { x: portCenter.x + 10, z: portCenter.z }

  // GRAN LONJA COMERCIAL
  const exchangeGeometry = new THREE.BoxGeometry(40, 15, 30)
  const exchange = new THREE.Mesh(exchangeGeometry, materials.stone)
  exchange.position.set(commercialBayCenter.x, 7.5, commercialBayCenter.z - 20)
  scene.add(exchange)

  // Torres de comercio (4 esquinas)
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2
    const towerX = commercialBayCenter.x + Math.cos(angle) * 25
    const towerZ = commercialBayCenter.z - 20 + Math.sin(angle) * 20

    const commerceTowerGeometry = new THREE.CylinderGeometry(2.5, 3, 20, 8)
    const commerceTower = new THREE.Mesh(commerceTowerGeometry, materials.bronze)
    commerceTower.position.set(towerX, 10, towerZ)
    scene.add(commerceTower)
  }

  // MUELLES COMERCIALES MASIVOS (6 muelles gigantes)
  for (let i = 0; i < 6; i++) {
    const dockX = commercialBayCenter.x - 20 + (i * 12)
    const dockZ = commercialBayCenter.z + 25

    const dockGeometry = new THREE.BoxGeometry(25, 2, 15)
    const dock = new THREE.Mesh(dockGeometry, materials.wood)
    dock.position.set(dockX, 1, dockZ)
    scene.add(dock)

    // Grúa masiva en cada muelle
    const craneBaseGeometry = new THREE.CylinderGeometry(2, 3, 25, 8)
    const craneBase = new THREE.Mesh(craneBaseGeometry, materials.steel)
    craneBase.position.set(dockX, 12.5, dockZ - 10)
    scene.add(craneBase)

    // Brazo de grúa
    const craneBoomGeometry = new THREE.BoxGeometry(1, 1, 30)
    const craneBoom = new THREE.Mesh(craneBoomGeometry, materials.steel)
    craneBoom.position.set(dockX + 15, 20, dockZ - 10)
    craneBoom.rotation.y = i * Math.PI / 8
    scene.add(craneBoom)
  }

  // ALMACENES MASIVOS DE MERCANCÍAS
  const warehousePositions = [
    { x: commercialBayCenter.x - 40, z: commercialBayCenter.z - 40 },
    { x: commercialBayCenter.x + 40, z: commercialBayCenter.z - 40 },
    { x: commercialBayCenter.x - 40, z: commercialBayCenter.z + 40 },
    { x: commercialBayCenter.x + 40, z: commercialBayCenter.z + 40 }
  ]

  warehousePositions.forEach((pos, index) => {
    const warehouseGeometry = new THREE.BoxGeometry(30, 12, 25)
    const warehouseColors = [0x8B4513, 0xD2691E, 0x9370DB, 0x708090] // Diferentes colores por tipo
    const warehouseMaterial = new THREE.MeshLambertMaterial({ color: warehouseColors[index] })
    const warehouse = new THREE.Mesh(warehouseGeometry, warehouseMaterial)
    warehouse.position.set(pos.x, 6, pos.z)
    scene.add(warehouse)

    // Techo del almacén
    const roofGeometry = new THREE.BoxGeometry(32, 2, 27)
    const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x5D4E37 }))
    roof.position.set(pos.x, 13, pos.z)
    scene.add(roof)
  })

  // ========== BAHÍA NAVAL (Sur del Puerto) ==========
  const navalBayCenter = { x: portCenter.x + 20, z: portCenter.z + 60 }

  // ASTILLERO IMPERIAL MASIVO
  const shipyardGeometry = new THREE.BoxGeometry(80, 5, 40)
  const shipyard = new THREE.Mesh(shipyardGeometry, materials.stone)
  shipyard.position.set(navalBayCenter.x, 2.5, navalBayCenter.z)
  scene.add(shipyard)

  // DIQUES SECOS MASIVOS (3 diques)
  for (let i = 0; i < 3; i++) {
    const dryDockGeometry = new THREE.BoxGeometry(30, 4, 20)
    const dryDock = new THREE.Mesh(dryDockGeometry, materials.stone)
    dryDock.position.set(navalBayCenter.x - 20 + (i * 25), 1, navalBayCenter.z)
    scene.add(dryDock)

    // Barco en construcción en cada dique
    const shipHullGeometry = new THREE.BoxGeometry(28, 8, 15)
    const shipHull = new THREE.Mesh(shipHullGeometry, materials.wood)
    shipHull.position.set(dryDock.position.x, 6, dryDock.position.z)
    scene.add(shipHull)

    // Mástiles en construcción
    for (let m = 0; m < 3; m++) {
      const mastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 25, 8)
      const mast = new THREE.Mesh(mastGeometry, materials.wood)
      mast.position.set(shipHull.position.x + (m - 1) * 10, 16.5, shipHull.position.z)
      scene.add(mast)
    }

    // Andamios masivos
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2
      const scaffoldX = shipHull.position.x + Math.cos(angle) * 20
      const scaffoldZ = shipHull.position.z + Math.sin(angle) * 12

      const scaffoldGeometry = new THREE.BoxGeometry(0.5, 20, 0.5)
      const scaffold = new THREE.Mesh(scaffoldGeometry, materials.wood)
      scaffold.position.set(scaffoldX, 10, scaffoldZ)
      scene.add(scaffold)
    }
  }

  // ARSENAL NAVAL MASIVO
  const arsenalGeometry = new THREE.BoxGeometry(50, 15, 30)
  const arsenal = new THREE.Mesh(arsenalGeometry, materials.stone)
  arsenal.position.set(navalBayCenter.x, 7.5, navalBayCenter.z + 40)
  scene.add(arsenal)

  // Torres defensivas del arsenal
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const towerX = navalBayCenter.x + Math.cos(angle) * 35
    const towerZ = navalBayCenter.z + 40 + Math.sin(angle) * 20

    const defenseGeometry = new THREE.CylinderGeometry(3, 4, 22, 8)
    const defenseTower = new THREE.Mesh(defenseGeometry, materials.stone)
    defenseTower.position.set(towerX, 11, towerZ)
    scene.add(defenseTower)

    // Cañones navales
    const cannonGeometry = new THREE.CylinderGeometry(0.4, 0.6, 8, 8)
    const cannon = new THREE.Mesh(cannonGeometry, materials.bronze)
    cannon.rotation.z = Math.PI / 2
    cannon.position.set(towerX + 4, 18, towerZ)
    scene.add(cannon)
  }

  // FARO IMPERIAL MASIVO
  const lighthouseGeometry = new THREE.CylinderGeometry(4, 6, 50, 16)
  const lighthouse = new THREE.Mesh(lighthouseGeometry, materials.marble)
  lighthouse.position.set(portCenter.x + 60, 25, portCenter.z - 60)
  scene.add(lighthouse)

  // Luz del faro
  const lightGeometry = new THREE.SphereGeometry(3, 16, 12)
  const lightMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xFFFFFF, 
    emissive: 0xFFFF00, 
    emissiveIntensity: 0.3 
  })
  const light = new THREE.Mesh(lightGeometry, lightMaterial)
  light.position.set(portCenter.x + 60, 52, portCenter.z - 60)
  scene.add(light)
}
  
  // CONSTRUIR TODOS LOS MUELLES CON CARACTERÍSTICAS ESPECIALIZADAS
  dockConfigs.forEach(dock => {
    // Muelle principal
    const dockGeometry = new THREE.BoxGeometry(dock.width, 1.2, dock.depth)
    let dockMaterial = woodMaterial
    
    // Material especializado según tipo
    if (['emperor', 'empress', 'princes'].includes(dock.type)) {
      dockMaterial = materials.marble // Mármol para realeza
    } else if (['main_shipyard', 'naval_arsenal'].includes(dock.type)) {
      dockMaterial = materials.stone // Piedra para estructuras navales
    }
    
    const dockMesh = new THREE.Mesh(dockGeometry, dockMaterial)
    dockMesh.position.set(dock.x, 0.6, dock.z)
    scene.add(dockMesh)
    
    // Pilotes de soporte reforzados
    const numPiles = Math.max(dock.width / 2, dock.depth / 2)
    for (let i = 0; i < numPiles; i++) {
      const pileRadius = dock.type.includes('emperor') ? 0.8 : 0.4
      const pileGeometry = new THREE.CylinderGeometry(pileRadius * 0.8, pileRadius, 6, 8)
      const pile = new THREE.Mesh(pileGeometry, woodMaterial)
      pile.position.set(
        dock.x - dock.width/2 + (i % 6) * dock.width/5,
        2,
        dock.z - dock.depth/2 + Math.floor(i / 6) * dock.depth/4
      )
      scene.add(pile)
    }
    
    // ========== CARACTERÍSTICAS IMPERIALES ==========
    if (dock.type === 'emperor') {
      // Palacio flotante del emperador
      const palaceGeometry = new THREE.BoxGeometry(15, 8, 12)
      const palace = new THREE.Mesh(palaceGeometry, materials.gold)
      palace.position.set(dock.x, 5, dock.z - 8)
      scene.add(palace)
      
      // Cúpula imperial
      const domeGeometry = new THREE.SphereGeometry(4, 16, 12)
      const dome = new THREE.Mesh(domeGeometry, materials.gold)
      dome.position.set(palace.position.x, 10, palace.position.z)
      scene.add(dome)
      
      // 8 torres imperiales
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const towerX = palace.position.x + Math.cos(angle) * 10
        const towerZ = palace.position.z + Math.sin(angle) * 8
        
        const towerGeometry = new THREE.CylinderGeometry(1.5, 2, 12, 12)
        const tower = new THREE.Mesh(towerGeometry, materials.marble)
        tower.position.set(towerX, 6, towerZ)
        scene.add(tower)
        
        // Corona dorada en cada torre
        const crownGeometry = new THREE.CylinderGeometry(2, 1.8, 1, 8)
        const crown = new THREE.Mesh(crownGeometry, materials.gold)
        crown.position.set(towerX, 13, towerZ)
        scene.add(crown)
        
        // Estandarte imperial
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6, 8)
        const pole = new THREE.Mesh(poleGeometry, materials.bronze)
        pole.position.set(towerX, 16, towerZ)
        scene.add(pole)
        
        const bannerGeometry = new THREE.PlaneGeometry(4, 3)
        const bannerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 })
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial)
        banner.position.set(towerX + 2, 17, towerZ)
        scene.add(banner)
      }
      
      // Alfombra dorada en el muelle
      const carpetGeometry = new THREE.PlaneGeometry(dock.width, dock.depth)
      const carpetMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xFFD700, 
        transparent: true, 
        opacity: 0.7 
      })
      const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial)
      carpet.rotation.x = -Math.PI / 2
      carpet.position.set(dock.x, 1.3, dock.z)
      scene.add(carpet)
    }
    
    if (['empress', 'princes'].includes(dock.type)) {
      // Pabellones nobles
      const pavilionSize = dock.type === 'empress' ? 10 : 8
      const pavilionGeometry = new THREE.BoxGeometry(pavilionSize, 6, pavilionSize)
      const pavilionMaterial = dock.type === 'empress' ? materials.marble : materials.stone
      const pavilion = new THREE.Mesh(pavilionGeometry, pavilionMaterial)
      pavilion.position.set(dock.x, 3.8, dock.z - 6)
      scene.add(pavilion)
      
      // Banderas nobles (4-6 dependiendo del rango)
      const numFlags = dock.type === 'empress' ? 6 : 4
      for (let i = 0; i < numFlags; i++) {
        const flagX = dock.x + (i - (numFlags-1)/2) * dock.width/(numFlags-1)
        const flagPoleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8)
        const flagPole = new THREE.Mesh(flagPoleGeometry, materials.bronze)
        flagPole.position.set(flagX, 5, dock.z + dock.depth/2)
        scene.add(flagPole)
        
        const flagGeometry = new THREE.PlaneGeometry(3, 2)
        const flagColor = dock.type === 'empress' ? 0x800080 : 0x0000FF
        const flagMaterial = new THREE.MeshLambertMaterial({ color: flagColor })
        const flag = new THREE.Mesh(flagGeometry, flagMaterial)
        flag.position.set(flagX + 1.5, 7, dock.z + dock.depth/2)
        scene.add(flag)
      }
    }
    
    // ========== CARACTERÍSTICAS COMERCIALES ==========
    if (dock.type === 'mega_cargo') {
      // Grúas masivas industriales
      for (let i = 0; i < 6; i++) {
        const craneX = dock.x - dock.width/2 + (i + 1) * dock.width/7
        const craneZ = dock.z - dock.depth/2 - 3
        
        // Base de grúa reforzada
        const craneBaseGeometry = new THREE.CylinderGeometry(2, 3, 15, 12)
        const craneBase = new THREE.Mesh(craneBaseGeometry, materials.steel)
        craneBase.position.set(craneX, 8, craneZ)
        scene.add(craneBase)
        
        // Brazo de grúa masivo
        const craneBoomGeometry = new THREE.BoxGeometry(0.8, 0.8, 20)
        const craneBoom = new THREE.Mesh(craneBoomGeometry, materials.steel)
        craneBoom.position.set(craneX + 10, 15, craneZ)
        craneBoom.rotation.y = (i * Math.PI / 12) - Math.PI/6
        scene.add(craneBoom)
        
        // Polea principal
        const pulleyGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 12)
        const pulley = new THREE.Mesh(pulleyGeometry, materials.bronze)
        pulley.position.set(craneBoom.position.x + 8, craneBoom.position.y, craneBoom.position.z)
        scene.add(pulley)
        
        // Cable y gancho
        const cableGeometry = new THREE.CylinderGeometry(0.1, 0.1, 12, 6)
        const cable = new THREE.Mesh(cableGeometry, ropeMaterial)
        cable.position.set(pulley.position.x, pulley.position.y - 6, pulley.position.z)
        scene.add(cable)
      }
      
      // Almacenes masivos de mercancías
      const warehouseGeometry = new THREE.BoxGeometry(dock.width - 4, 8, 12)
      const warehouse = new THREE.Mesh(warehouseGeometry, materials.warehouse)
      warehouse.position.set(dock.x, 4, dock.z + dock.depth + 8)
      scene.add(warehouse)
      
      // Montañas organizadas de contenedores
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
          const containerGeometry = new THREE.BoxGeometry(3, 2.5, 6)
          const containerColors = [0x8B4513, 0x4A4A4A, 0x006400, 0x8B0000]
          const containerMaterial = new THREE.MeshLambertMaterial({ 
            color: containerColors[Math.floor(Math.random() * containerColors.length)] 
          })
          const container = new THREE.Mesh(containerGeometry, containerMaterial)
          container.position.set(
            dock.x - dock.width/2 + col * 3.5,
            1.25 + row * 2.5,
            dock.z + dock.depth/2 + 6 + row * 2
          )
          scene.add(container)
        }
      }
    }
    
    if (['spices', 'textiles', 'metals', 'grains'].includes(dock.type)) {
      // Almacenes especializados por tipo
      const warehouseGeometry = new THREE.BoxGeometry(dock.width - 2, 6, 8)
      let warehouseMaterial = materials.warehouse
      let warehouseColor = 0x8B4513
      
      if (dock.type === 'spices') warehouseColor = 0xD2691E // Naranja especias
      else if (dock.type === 'textiles') warehouseColor = 0x9370DB // Púrpura sedas
      else if (dock.type === 'metals') warehouseColor = 0x708090 // Gris acero
      else if (dock.type === 'grains') warehouseColor = 0xF4A460 // Beige grano
      
      warehouseMaterial = new THREE.MeshLambertMaterial({ color: warehouseColor })
      const warehouse = new THREE.Mesh(warehouseGeometry, warehouseMaterial)
      warehouse.position.set(dock.x, 3, dock.z + dock.depth + 6)
      scene.add(warehouse)
      
      // Mercancías específicas por tipo
      if (dock.type === 'spices') {
        // Sacos de especias apilados
        for (let i = 0; i < 12; i++) {
          const sackGeometry = new THREE.CylinderGeometry(0.8, 1, 2, 8)
          const sackColors = [0xFF4500, 0xFFD700, 0x8B4513, 0xDC143C]
          const sackMaterial = new THREE.MeshLambertMaterial({ 
            color: sackColors[Math.floor(Math.random() * sackColors.length)] 
          })
          const sack = new THREE.Mesh(sackGeometry, sackMaterial)
          sack.position.set(
            dock.x - dock.width/2 + (i % 6) * 3,
            1 + Math.floor(i / 6) * 2,
            dock.z + dock.depth/2 + 2
          )
          scene.add(sack)
        }
      }
      
      if (dock.type === 'textiles') {
        // Rollos de tela y sedas
        for (let i = 0; i < 16; i++) {
          const rollGeometry = new THREE.CylinderGeometry(0.6, 0.6, 4, 12)
          const rollColors = [0x8B008B, 0x4169E1, 0xFFD700, 0xDC143C]
          const rollMaterial = new THREE.MeshLambertMaterial({ 
            color: rollColors[Math.floor(Math.random() * rollColors.length)] 
          })
          const roll = new THREE.Mesh(rollGeometry, rollMaterial)
          roll.rotation.z = Math.PI / 2
          roll.position.set(
            dock.x - dock.width/2 + (i % 8) * 2.5,
            1.5 + Math.floor(i / 8) * 3,
            dock.z + dock.depth/2 + 2
          )
          scene.add(roll)
        }
      }
    }
    
    // ========== CARACTERÍSTICAS NAVALES ==========
    if (dock.type === 'main_shipyard') {
      // Astillero masivo con múltiples diques
      for (let i = 0; i < 3; i++) {
        const dryDockGeometry = new THREE.BoxGeometry(25, 3, 18)
        const dryDock = new THREE.Mesh(dryDockGeometry, materials.stone)
        dryDock.position.set(dock.x + (i - 1) * 30, 0, dock.z - 15)
        scene.add(dryDock)
        
        // Barco en construcción
        const shipHullGeometry = new THREE.BoxGeometry(22, 8, 12)
        const shipHull = new THREE.Mesh(shipHullGeometry, materials.wood)
        shipHull.position.set(dryDock.position.x, 5.5, dryDock.position.z)
        scene.add(shipHull)
        
        // Mástiles en construcción
        for (let m = 0; m < 3; m++) {
          const mastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 12)
          const mast = new THREE.Mesh(mastGeometry, woodMaterial)
          mast.position.set(
            shipHull.position.x + (m - 1) * 8,
            15.5,
            shipHull.position.z
          )
          scene.add(mast)
        }
        
        // Grúas especializadas de astillero
        for (let c = 0; c < 4; c++) {
          const craneGeometry = new THREE.CylinderGeometry(1, 1.5, 18, 10)
          const crane = new THREE.Mesh(craneGeometry, materials.steel)
          crane.position.set(
            dryDock.position.x + (c - 1.5) * 12,
            9,
            dryDock.position.z + 12
          )
          scene.add(crane)
        }
      }
    }
    
    if (dock.type === 'warship_dock') {
      // Fortaleza naval
      const fortressGeometry = new THREE.BoxGeometry(15, 8, 12)
      const fortress = new THREE.Mesh(fortressGeometry, materials.stone)
      fortress.position.set(dock.x, 4, dock.z - 10)
      scene.add(fortress)
      
      // Torres de defensa
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2
        const towerX = fortress.position.x + Math.cos(angle) * 10
        const towerZ = fortress.position.z + Math.sin(angle) * 8
        
        const towerGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 8)
        const tower = new THREE.Mesh(towerGeometry, materials.stone)
        tower.position.set(towerX, 6, towerZ)
        scene.add(tower)
        
        // Cañones en las torres
        const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8)
        const cannon = new THREE.Mesh(cannonGeometry, materials.steel)
        cannon.rotation.z = Math.PI / 2
        cannon.position.set(towerX + 2, 10, towerZ)
        scene.add(cannon)
      }
    }
    
    if (dock.type === 'naval_arsenal') {
      // Arsenal naval con armamento
      const arsenalGeometry = new THREE.BoxGeometry(dock.width - 2, 10, dock.depth)
      const arsenal = new THREE.Mesh(arsenalGeometry, materials.stone)
      arsenal.position.set(dock.x, 5, dock.z - 8)
      scene.add(arsenal)
      
      // Depósitos de armas ordenados
      for (let i = 0; i < 20; i++) {
        const weaponRackGeometry = new THREE.BoxGeometry(1, 3, 0.5)
        const weaponRack = new THREE.Mesh(weaponRackGeometry, woodMaterial)
        weaponRack.position.set(
          dock.x - dock.width/2 + (i % 10) * 2,
          1.5,
          dock.z + dock.depth/2 + Math.floor(i / 10) * 3
        )
        scene.add(weaponRack)
        
        // Armas en los racks
        for (let w = 0; w < 6; w++) {
          const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 6)
          const weapon = new THREE.Mesh(weaponGeometry, materials.steel)
          weapon.position.set(
            weaponRack.position.x + (w - 2.5) * 0.3,
            weaponRack.position.y + 0.5,
            weaponRack.position.z
          )
          scene.add(weapon)
        }
      }
    }
  })
  
  // ASTILLERO - Construcción naval épica
  const shipyardX = portBaseX + 25
  const shipyardZ = portBaseZ
  
  // Dique seco masivo
  const dryDockGeometry = new THREE.BoxGeometry(25, 2, 15)
  const dryDockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  const dryDock = new THREE.Mesh(dryDockGeometry, dryDockMaterial)
  dryDock.position.set(shipyardX, 0, shipyardZ)
  scene.add(dryDock)
  
  // Barco en construcción (galeón masivo)
  const shipHullGeometry = new THREE.BoxGeometry(20, 6, 8)
  const shipMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
  const shipHull = new THREE.Mesh(shipHullGeometry, shipMaterial)
  shipHull.position.set(shipyardX, 3, shipyardZ)
  scene.add(shipHull)
  
  // Mástiles en construcción
  for (let i = 0; i < 3; i++) {
    const mastGeometry = new THREE.CylinderGeometry(0.4, 0.4, 15, 12)
    const mast = new THREE.Mesh(mastGeometry, woodMaterial)
    mast.position.set(shipyardX + (i - 1) * 6, 10.5, shipyardZ)
    scene.add(mast)
  }
  
  // Andamios masivos alrededor del barco
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2
    const scaffoldX = shipyardX + Math.cos(angle) * 15
    const scaffoldZ = shipyardZ + Math.sin(angle) * 10
    
    const scaffoldGeometry = new THREE.BoxGeometry(0.5, 12, 0.5)
    const scaffold = new THREE.Mesh(scaffoldGeometry, woodMaterial)
    scaffold.position.set(scaffoldX, 6, scaffoldZ)
    scene.add(scaffold)
    
    // Plataformas de trabajo
    if (i % 3 === 0) {
      const platformGeometry = new THREE.BoxGeometry(4, 0.3, 4)
      const platform = new THREE.Mesh(platformGeometry, woodMaterial)
      platform.position.set(scaffoldX, 8, scaffoldZ)
      scene.add(platform)
    }
  }
  
  // FLOTA EN EL PUERTO - Barcos de diferentes tamaños y tipos
  const ships = [
    { name: 'Galeón Imperial', x: portBaseX + 12, z: portBaseZ - 15, length: 18, width: 6, height: 4, type: 'galleon' },
    { name: 'Navío de Guerra', x: portBaseX + 8, z: portBaseZ + 20, length: 16, width: 5, height: 3.5, type: 'warship' },
    { name: 'Mercante Mayor', x: portBaseX + 15, z: portBaseZ + 8, length: 14, width: 5, height: 3, type: 'merchant' },
    { name: 'Mercante Menor', x: portBaseX + 5, z: portBaseZ - 5, length: 12, width: 4, height: 2.5, type: 'merchant' },
    { name: 'Barco Pesquero Grande', x: portBaseX - 5, z: portBaseZ + 15, length: 10, width: 4, height: 2, type: 'fishing' },
    { name: 'Barco Pesquero Menor', x: portBaseX - 8, z: portBaseZ + 8, length: 8, width: 3, height: 1.5, type: 'fishing' },
    { name: 'Patrullera Real', x: portBaseX + 10, z: portBaseZ - 8, length: 12, width: 3, height: 2, type: 'patrol' },
    { name: 'Barca de Suministros', x: portBaseX - 2, z: portBaseZ + 3, length: 6, width: 3, height: 1.5, type: 'supply' }
  ]
  
  ships.forEach(ship => {
    // Casco del barco
    const hullGeometry = new THREE.BoxGeometry(ship.length, ship.height, ship.width)
    const hull = new THREE.Mesh(hullGeometry, shipMaterial)
    hull.position.set(ship.x, ship.height/2, ship.z)
    scene.add(hull)
    
    // Proa
    const prowGeometry = new THREE.ConeGeometry(ship.width/2, ship.length/4, 6)
    const prow = new THREE.Mesh(prowGeometry, shipMaterial)
    prow.position.set(ship.x + ship.length/2 + ship.length/8, ship.height/2, ship.z)
    prow.rotation.z = -Math.PI / 2
    scene.add(prow)
    
    // Mástiles y velas según tipo
    const numMasts = ship.type === 'galleon' ? 3 : ship.type === 'warship' ? 3 : ship.type === 'merchant' ? 2 : 1
    
    for (let i = 0; i < numMasts; i++) {
      const mastHeight = ship.height + 6 + (ship.type === 'galleon' ? 4 : 2)
      const mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, mastHeight, 8)
      const mast = new THREE.Mesh(mastGeometry, woodMaterial)
      mast.position.set(
        ship.x + (i - (numMasts-1)/2) * ship.length/numMasts,
        mastHeight/2,
        ship.z
      )
      scene.add(mast)
      
      // Velas
      const sailWidth = ship.length / numMasts - 1
      const sailHeight = mastHeight * 0.6
      const sailGeometry = new THREE.PlaneGeometry(sailWidth, sailHeight)
      const sail = new THREE.Mesh(sailGeometry, sailMaterial)
      sail.position.set(mast.position.x + sailWidth/2, mastHeight * 0.6, ship.z)
      scene.add(sail)
      
      // Vergas (palos horizontales)
      for (let j = 0; j < 2; j++) {
        const yardGeometry = new THREE.BoxGeometry(sailWidth + 1, 0.2, 0.2)
        const yard = new THREE.Mesh(yardGeometry, woodMaterial)
        yard.position.set(mast.position.x, mastHeight * (0.3 + j * 0.4), ship.z)
        scene.add(yard)
      }
    }
    
    // Cañones para barcos de guerra
    if (ship.type === 'warship' || ship.type === 'galleon') {
      const numCannons = Math.floor(ship.length / 2)
      for (let i = 0; i < numCannons; i++) {
        const cannonGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8)
        const cannon = new THREE.Mesh(cannonGeometry, metalMaterial)
        cannon.position.set(
          ship.x - ship.length/2 + (i + 1) * ship.length/(numCannons + 1),
          ship.height * 0.7,
          ship.z + ship.width/2 + 0.3
        )
        cannon.rotation.z = Math.PI / 2
        scene.add(cannon)
      }
    }
  })
  
  // ALMACENES PORTUARIOS - Complejos de almacenamiento masivos
  const warehouses = [
    { x: portBaseX - 15, z: portBaseZ + 5, width: 12, height: 6, depth: 20, type: 'general' },
    { x: portBaseX - 15, z: portBaseZ - 10, width: 10, height: 5, depth: 15, type: 'spices' },
    { x: portBaseX - 25, z: portBaseZ + 15, width: 8, height: 4, depth: 12, type: 'textiles' },
    { x: portBaseX - 25, z: portBaseZ - 5, width: 15, height: 7, depth: 18, type: 'weapons' }
  ]
  
  warehouses.forEach(warehouse => {
    const warehouseGeometry = new THREE.BoxGeometry(warehouse.width, warehouse.height, warehouse.depth)
    const warehouseMaterial = new THREE.MeshLambertMaterial({ 
      color: warehouse.type === 'weapons' ? 0x696969 : 0x8B7355 
    })
    const warehouseMesh = new THREE.Mesh(warehouseGeometry, warehouseMaterial)
    warehouseMesh.position.set(warehouse.x, warehouse.height/2, warehouse.z)
    warehouseMesh.castShadow = true
    scene.add(warehouseMesh)
    
    // Tejado
    const roofGeometry = new THREE.BoxGeometry(warehouse.width + 0.5, 1, warehouse.depth + 0.5)
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(warehouse.x, warehouse.height + 0.5, warehouse.z)
    scene.add(roof)
    
    // Puertas grandes
    const doorGeometry = new THREE.BoxGeometry(3, 4, 0.3)
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(warehouse.x, 2, warehouse.z + warehouse.depth/2 + 0.2)
    scene.add(door)
  })
  
  // FARO - Guía para los navegantes
  const lighthouseX = portBaseX + 35
  const lighthouseZ = portBaseZ - 20
  
  const lighthouseGeometry = new THREE.CylinderGeometry(3, 4, 25, 12)
  const lighthouseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const lighthouse = new THREE.Mesh(lighthouseGeometry, lighthouseMaterial)
  lighthouse.position.set(lighthouseX, 12.5, lighthouseZ)
  scene.add(lighthouse)
  
  // Linterna del faro
  const lanternGeometry = new THREE.CylinderGeometry(4, 4, 3, 16)
  const lanternMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
  const lantern = new THREE.Mesh(lanternGeometry, lanternMaterial)
  lantern.position.set(lighthouseX, 26.5, lighthouseZ)
  scene.add(lantern)
  
  // Luz del faro
  const lightGeometry = new THREE.SphereGeometry(1, 8, 6)
  const lightMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xFFFFFF,
    emissive: 0xFFFF00,
    emissiveIntensity: 0.5
  })
  const light = new THREE.Mesh(lightGeometry, lightMaterial)
  light.position.set(lighthouseX, 26.5, lighthouseZ)
  scene.add(light)
}

const createMassiveVillaDistricts = async (): Promise<void> => {
  if (!scene) return
  
  console.log('Creating MASSIVE residential villa districts across the entire region...')
  
  // MATERIALES PARA DIFERENTES TIPOS DE VIVIENDAS
  const residentialMaterials = {
    common: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),      // Casas comunes - piedra natural
    middle: new THREE.MeshLambertMaterial({ color: 0x696969 }),      // Clase media - gris medio
    prosperous: new THREE.MeshLambertMaterial({ color: 0x778899 }),  // Prósperas - gris azulado
    artisan: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),     // Artesanos - marrón tierra
    working: new THREE.MeshLambertMaterial({ color: 0x654321 })      // Trabajadores - marrón oscuro
  }
  
  const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4E37 })
  const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  
  // ============ VILLAS PRINCIPALES MASIVAS ============
  
  // VILLA NORTE MAYOR - Expandida masivamente
  const villaNorteMayor = {
    center: { x: 0, z: -200 },
    radius: 80,  // Duplicado
    population: 500,  // 500 casas
    type: 'middle_class',
    subdistricts: 4
  }
  await createMassiveVillaComplex(villaNorteMayor, residentialMaterials.middle, 'Villa Norte Mayor')
  
  // VILLA ESTE INDUSTRIAL - Cerca del distrito Opus
  const villaEsteIndustrial = {
    center: { x: 200, z: 0 },
    radius: 90,  // Mucho más grande
    population: 600,  // 600 casas
    type: 'working_class',
    subdistricts: 5
  }
  await createMassiveVillaComplex(villaEsteIndustrial, residentialMaterials.working, 'Villa Este Industrial')
  
  // VILLA SUR AGRÍCOLA - Expandida por las llanuras
  const villaSurAgricola = {
    center: { x: 0, z: 220 },
    radius: 100,  // La más grande
    population: 800,  // 800 casas
    type: 'agricultural',
    subdistricts: 6
  }
  await createMassiveVillaComplex(villaSurAgricola, residentialMaterials.common, 'Villa Sur Agrícola')
  
  // VILLA OESTE ARTESANAL - En los bosques
  const villaOesteArtesanal = {
    center: { x: -200, z: 0 },
    radius: 85,
    population: 550,  // 550 casas
    type: 'artisan',
    subdistricts: 4
  }
  await createMassiveVillaComplex(villaOesteArtesanal, residentialMaterials.artisan, 'Villa Oeste Artesanal')
  
  // ============ VILLAS DIRECCIONALES EXPANDIDAS ============
  
  // Cuadrantes intermedios
  const intermediateVillas = [
    { center: { x: -140, z: -140 }, radius: 60, population: 350, type: 'prosperous', name: 'Villa Noroeste Próspera' },
    { center: { x: 140, z: -140 }, radius: 65, population: 380, type: 'middle_class', name: 'Villa Noreste Comercial' },
    { center: { x: 140, z: 140 }, radius: 70, population: 420, type: 'working_class', name: 'Villa Sureste Portuaria' },
    { center: { x: -140, z: 140 }, radius: 58, population: 320, type: 'artisan', name: 'Villa Suroeste Ganadera' }
  ]
  
  for (const villa of intermediateVillas) {
    await createVillaDistrict(villa, residentialMaterials[villa.type as keyof typeof residentialMaterials], villa.name)
  }
  
  // ============ SUBURBIOS SATÉLITES MASIVOS ============
  
  const satelliteSuburbs = [
    // Anillo interior de suburbios
    { center: { x: -100, z: -100 }, radius: 40, population: 180, type: 'middle_class' },
    { center: { x: 100, z: -100 }, radius: 42, population: 190, type: 'prosperous' },
    { center: { x: 100, z: 100 }, radius: 45, population: 200, type: 'working_class' },
    { center: { x: -100, z: 100 }, radius: 38, population: 170, type: 'artisan' },
    
    // Anillo exterior de suburbios
    { center: { x: -160, z: -80 }, radius: 35, population: 150, type: 'common' },
    { center: { x: 0, z: -160 }, radius: 40, population: 180, type: 'middle_class' },
    { center: { x: 160, z: -80 }, radius: 38, population: 160, type: 'working_class' },
    { center: { x: 160, z: 80 }, radius: 42, population: 185, type: 'prosperous' },
    { center: { x: 0, z: 160 }, radius: 45, population: 200, type: 'common' },
    { center: { x: -160, z: 80 }, radius: 36, population: 155, type: 'artisan' },
    
    // Suburbios extremos
    { center: { x: -220, z: -120 }, radius: 30, population: 120, type: 'common' },
    { center: { x: -80, z: -220 }, radius: 32, population: 130, type: 'middle_class' },
    { center: { x: 80, z: -220 }, radius: 35, population: 140, type: 'working_class' },
    { center: { x: 220, z: -120 }, radius: 33, population: 135, type: 'prosperous' },
    { center: { x: 220, z: 120 }, radius: 38, population: 160, type: 'working_class' },
    { center: { x: 80, z: 220 }, radius: 40, population: 170, type: 'common' },
    { center: { x: -80, z: 220 }, radius: 35, population: 145, type: 'artisan' },
    { center: { x: -220, z: 120 }, radius: 30, population: 125, type: 'common' }
  ]
  
  for (const suburb of satelliteSuburbs) {
    await createVillaDistrict(suburb, residentialMaterials[suburb.type as keyof typeof residentialMaterials], `Suburbio ${suburb.center.x}/${suburb.center.z}`)
  }
  
  // ============ ALDEAS RURALES DISPERSAS ============
  
  const ruralVillages = [
    // Aldeas al norte (en las montañas)
    { center: { x: -50, z: -280 }, radius: 20, population: 60, type: 'common' },
    { center: { x: 50, z: -300 }, radius: 18, population: 55, type: 'common' },
    { center: { x: 120, z: -260 }, radius: 22, population: 65, type: 'working_class' },
    
    // Aldeas al este (costeras)
    { center: { x: 280, z: -50 }, radius: 25, population: 70, type: 'prosperous' },
    { center: { x: 300, z: 50 }, radius: 20, population: 60, type: 'working_class' },
    { center: { x: 260, z: 120 }, radius: 18, population: 55, type: 'common' },
    
    // Aldeas al sur (agrícolas)
    { center: { x: -80, z: 300 }, radius: 28, population: 80, type: 'common' },
    { center: { x: 0, z: 320 }, radius: 30, population: 90, type: 'common' },
    { center: { x: 80, z: 300 }, radius: 25, population: 75, type: 'common' },
    
    // Aldeas al oeste (forestales)
    { center: { x: -300, z: -50 }, radius: 22, population: 65, type: 'artisan' },
    { center: { x: -280, z: 50 }, radius: 20, population: 60, type: 'artisan' },
    { center: { x: -260, z: 120 }, radius: 24, population: 70, type: 'common' }
  ]
  
  for (const village of ruralVillages) {
    await createVillaDistrict(village, residentialMaterials[village.type as keyof typeof residentialMaterials], `Aldea Rural ${village.center.x}/${village.center.z}`)
  }
  
  console.log('MASSIVE villa districts completed - Total coverage: 7000+ houses!')
}

async function createMassiveVillaComplex(villa: any, houseMaterial: THREE.Material, districtName: string): Promise<void> {
  if (!scene) return
  
  console.log(`Creating massive villa complex: ${districtName}`)
  
  // Base principal del distrito
  const mainDistrictGeometry = new THREE.CircleGeometry(villa.radius, 64)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x9ACD32, 
    transparent: true, 
    opacity: 0.2 
  })
  const mainDistrictBase = new THREE.Mesh(mainDistrictGeometry, districtBaseMaterial)
  mainDistrictBase.rotation.x = -Math.PI / 2
  mainDistrictBase.position.set(villa.center.x, 0.01, villa.center.z)
  scene.add(mainDistrictBase)
  
  // ============ SISTEMA DE CALLES MASIVO Y COMPLEJO ============
  
  // Avenidas principales (8 direcciones)
  const mainAvenues = 8
  for (let i = 0; i < mainAvenues; i++) {
    const angle = (i / mainAvenues) * Math.PI * 2
    const avenueLength = villa.radius * 0.95
    
    const avenueGeometry = new THREE.BoxGeometry(avenueLength, 0.15, 4)
    const avenue = new THREE.Mesh(avenueGeometry, new THREE.MeshLambertMaterial({ color: 0x696969 }))
    avenue.position.set(
      villa.center.x + Math.cos(angle) * avenueLength/2,
      0.04,
      villa.center.z + Math.sin(angle) * avenueLength/2
    )
    avenue.rotation.y = angle
    scene.add(avenue)
  }
  
  // Calles circulares (6 anillos concéntricos)
  for (let ring = 1; ring <= 6; ring++) {
    const ringRadius = (villa.radius / 7) * ring
    const circumference = 2 * Math.PI * ringRadius
    const numSegments = Math.floor(circumference / 3)
    
    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2
      const nextAngle = ((i + 1) / numSegments) * Math.PI * 2
      
      const segmentLength = ringRadius * Math.abs(nextAngle - angle)
      const streetGeometry = new THREE.BoxGeometry(segmentLength, 0.12, 2.5)
      const street = new THREE.Mesh(streetGeometry, new THREE.MeshLambertMaterial({ color: 0x778899 }))
      
      street.position.set(
        villa.center.x + Math.cos(angle + (nextAngle - angle)/2) * ringRadius,
        0.03,
        villa.center.z + Math.sin(angle + (nextAngle - angle)/2) * ringRadius
      )
      street.rotation.y = angle + (nextAngle - angle)/2 + Math.PI/2
      scene.add(street)
    }
  }
  
  // ============ SUBDIVISIÓN EN BARRIOS ESPECIALIZADOS ============
  
  for (let district = 0; district < villa.subdistricts; district++) {
    const districtAngle = (district / villa.subdistricts) * Math.PI * 2
    const districtDistance = villa.radius * 0.6
    const subDistrictCenter = {
      x: villa.center.x + Math.cos(districtAngle) * districtDistance,
      z: villa.center.z + Math.sin(districtAngle) * districtDistance
    }
    
    // Plaza de barrio
    const neighborhoodPlazaGeometry = new THREE.CircleGeometry(8, 20)
    const plazaMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C })
    const neighborhoodPlaza = new THREE.Mesh(neighborhoodPlazaGeometry, plazaMaterial)
    neighborhoodPlaza.rotation.x = -Math.PI / 2
    neighborhoodPlaza.position.set(subDistrictCenter.x, 0.05, subDistrictCenter.z)
    scene.add(neighborhoodPlaza)
    
    // Fuente de barrio
    const fountainGeometry = new THREE.CylinderGeometry(2, 2.5, 1.5, 16)
    const fountain = new THREE.Mesh(fountainGeometry, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }))
    fountain.position.set(subDistrictCenter.x, 0.75, subDistrictCenter.z)
    scene.add(fountain)
    
    // Infraestructura de barrio
    await createNeighborhoodInfrastructure(subDistrictCenter, villa.type)
  }
  
  // ============ GENERACIÓN MASIVA DE CASAS EN PATRONES ORGÁNICOS ============
  
  let housesCreated = 0
  
  // Distribución en múltiples anillos con variación orgánica
  for (let ring = 1; ring <= 10; ring++) {
    const ringRadius = (villa.radius * 0.85 / 10) * ring
    const housesInRing = Math.min(ring * 15, villa.population - housesCreated)
    
    for (let i = 0; i < housesInRing && housesCreated < villa.population; i++) {
      const angle = (i / housesInRing) * Math.PI * 2 + Math.random() * 0.3 // Variación angular
      const radiusVariation = ringRadius + (Math.random() - 0.5) * ringRadius * 0.4 // Variación radial
      
      const houseX = villa.center.x + Math.cos(angle) * radiusVariation
      const houseZ = villa.center.z + Math.sin(angle) * radiusVariation
      
      // Variación masiva en tamaños y tipos de casas
      const houseSize = {
        width: 2 + Math.random() * 2.5,
        height: 2.5 + Math.random() * 2,
        depth: 2 + Math.random() * 2.5
      }
      
      const houseType = Math.random()
      let currentHouseMaterial = houseMaterial
      
      // Variedad de tipos de casa según la zona
      if (houseType < 0.6) {
        // Casa estándar
      } else if (houseType < 0.8) {
        // Casa próspera (más grande)
        houseSize.width *= 1.3
        houseSize.depth *= 1.3
        houseSize.height *= 1.2
        if (villa.type !== 'working_class') {
          currentHouseMaterial = new THREE.MeshLambertMaterial({ color: 0x778899 })
        }
      } else {
        // Casa modesta (más pequeña)
        houseSize.width *= 0.8
        houseSize.depth *= 0.8
        houseSize.height *= 0.9
      }
      
      // Crear la casa
      const houseGeometry = new THREE.BoxGeometry(houseSize.width, houseSize.height, houseSize.depth)
      const house = new THREE.Mesh(houseGeometry, currentHouseMaterial)
      house.position.set(houseX, houseSize.height/2, houseZ)
      house.rotation.y = Math.random() * Math.PI * 2 // Rotación aleatoria
      house.castShadow = true
      scene.add(house)
      
      // Tejado variado
      const roofType = Math.random()
      if (roofType < 0.7) {
        // Tejado a dos aguas
        const roofGeometry = new THREE.BoxGeometry(houseSize.width + 0.3, 0.8, houseSize.depth + 0.3)
        const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x5D4E37 }))
        roof.position.set(houseX, houseSize.height + 0.4, houseZ)
        roof.rotation.y = house.rotation.y
        scene.add(roof)
      } else {
        // Tejado cónico
        const roofGeometry = new THREE.ConeGeometry(Math.max(houseSize.width, houseSize.depth) * 0.7, 1.5, 8)
        const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x5D4E37 }))
        roof.position.set(houseX, houseSize.height + 0.75, houseZ)
        scene.add(roof)
      }
      
      // Chimenea (60% de las casas)
      if (Math.random() < 0.6) {
        const chimneyGeometry = new THREE.BoxGeometry(0.4, 2, 0.4)
        const chimney = new THREE.Mesh(chimneyGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
        chimney.position.set(
          houseX + (Math.random() - 0.5) * houseSize.width * 0.6,
          houseSize.height + 1.8,
          houseZ + (Math.random() - 0.5) * houseSize.depth * 0.6
        )
        scene.add(chimney)
      }
      
      // Jardín pequeño (40% de las casas)
      if (Math.random() < 0.4) {
        const gardenGeometry = new THREE.CircleGeometry(1.5, 8)
        const gardenMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x32CD32, 
          transparent: true, 
          opacity: 0.6 
        })
        const garden = new THREE.Mesh(gardenGeometry, gardenMaterial)
        garden.rotation.x = -Math.PI / 2
        garden.position.set(
          houseX + (Math.random() - 0.5) * 4,
          0.02,
          houseZ + (Math.random() - 0.5) * 4
        )
        scene.add(garden)
      }
      
      housesCreated++
    }
  }
}

async function createNeighborhoodInfrastructure(center: {x: number, z: number}, villageType: string): Promise<void> {
  if (!scene) return
  
  // Iglesia/capilla de barrio
  const churchGeometry = new THREE.BoxGeometry(6, 8, 10)
  const church = new THREE.Mesh(churchGeometry, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }))
  church.position.set(center.x - 12, 4, center.z)
  scene.add(church)
  
  // Torre de la iglesia
  const towerGeometry = new THREE.BoxGeometry(2.5, 12, 2.5)
  const tower = new THREE.Mesh(towerGeometry, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }))
  tower.position.set(center.x - 12, 6, center.z + 4)
  scene.add(tower)
  
  // Mercado de barrio
  const marketGeometry = new THREE.BoxGeometry(8, 4, 6)
  const market = new THREE.Mesh(marketGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
  market.position.set(center.x + 12, 2, center.z)
  scene.add(market)
  
  // Escuela según el tipo de barrio
  if (villageType !== 'working_class') {
    const schoolGeometry = new THREE.BoxGeometry(10, 5, 8)
    const school = new THREE.Mesh(schoolGeometry, new THREE.MeshLambertMaterial({ color: 0xDEB887 }))
    school.position.set(center.x, 2.5, center.z - 15)
    scene.add(school)
  }
  
  // Taller especializado según tipo
  let workshopColor = 0x8B7355
  if (villageType === 'artisan') workshopColor = 0x654321
  else if (villageType === 'working_class') workshopColor = 0x696969
  
  const workshopGeometry = new THREE.BoxGeometry(6, 4, 8)
  const workshop = new THREE.Mesh(workshopGeometry, new THREE.MeshLambertMaterial({ color: workshopColor }))
  workshop.position.set(center.x, 2, center.z + 12)
  scene.add(workshop)
}

async function createVillaDistrict(villa: any, houseMaterial: THREE.Material, districtName: string): Promise<void> {
  if (!scene) return
  
  // Crear base del distrito
  const districtBaseGeometry = new THREE.CircleGeometry(villa.radius, 32)
  const districtBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xE6D3A3, transparent: true, opacity: 0.3 })
  const districtBase = new THREE.Mesh(districtBaseGeometry, districtBaseMaterial)
  districtBase.rotation.x = -Math.PI / 2
  districtBase.position.set(villa.center.x, 0.01, villa.center.z)
  scene.add(districtBase)
  
  // ============ SISTEMA DE CALLES RADIALES ============
  const numRadialStreets = 8
  for (let i = 0; i < numRadialStreets; i++) {
    const angle = (i / numRadialStreets) * Math.PI * 2
    const streetLength = villa.radius * 0.9
    
    const streetGeometry = new THREE.BoxGeometry(streetLength, 0.1, 2)
    const street = new THREE.Mesh(streetGeometry, new THREE.MeshLambertMaterial({ color: 0x969696 }))
    street.position.set(
      villa.center.x + Math.cos(angle) * streetLength/2,
      0.03,
      villa.center.z + Math.sin(angle) * streetLength/2
    )
    street.rotation.y = angle
    scene.add(street)
  }
  
  // Calles circulares concéntricas
  for (let ring = 1; ring <= 3; ring++) {
    const ringRadius = (villa.radius / 4) * ring
    const circumference = 2 * Math.PI * ringRadius
    const numSegments = Math.floor(circumference / 4)  // Un segmento cada 4 unidades
    
    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2
      const nextAngle = ((i + 1) / numSegments) * Math.PI * 2
      
      const segmentLength = ringRadius * Math.abs(nextAngle - angle)
      const streetGeometry = new THREE.BoxGeometry(segmentLength, 0.1, 1.5)
      const street = new THREE.Mesh(streetGeometry, new THREE.MeshLambertMaterial({ color: 0x969696 }))
      
      street.position.set(
        villa.center.x + Math.cos(angle + (nextAngle - angle)/2) * ringRadius,
        0.03,
        villa.center.z + Math.sin(angle + (nextAngle - angle)/2) * ringRadius
      )
      street.rotation.y = angle + (nextAngle - angle)/2 + Math.PI/2
      scene.add(street)
    }
  }
  
  // ============ GENERACIÓN MASIVA DE CASAS ============
  const houses = []
  let housesCreated = 0
  
  // Distribución en anillos concéntricos
  for (let ring = 1; ring <= 6; ring++) {
    const ringRadius = (villa.radius * 0.8 / 6) * ring
    const housesInRing = Math.min(ring * 12, villa.population - housesCreated)
    
    for (let i = 0; i < housesInRing && housesCreated < villa.population; i++) {
      const angle = (i / housesInRing) * Math.PI * 2
      const radiusVariation = ringRadius + (Math.random() - 0.5) * ringRadius * 0.3
      
      const houseX = villa.center.x + Math.cos(angle) * radiusVariation
      const houseZ = villa.center.z + Math.sin(angle) * radiusVariation
      
      // Variación en tamaños de casas
      const houseSize = {
        width: 2.5 + Math.random() * 1.5,
        height: 3 + Math.random() * 1,
        depth: 2.5 + Math.random() * 1.5
      }
      
      // Crear casa
      const houseGeometry = new THREE.BoxGeometry(houseSize.width, houseSize.height, houseSize.depth)
      const house = new THREE.Mesh(houseGeometry, houseMaterial)
      house.position.set(houseX, houseSize.height/2, houseZ)
      house.rotation.y = angle + (Math.random() - 0.5) * 0.5  // Ligera rotación aleatoria
      house.castShadow = true
      scene.add(house)
      
      // Tejado
      const roofGeometry = new THREE.BoxGeometry(houseSize.width + 0.3, 0.8, houseSize.depth + 0.3)
      const roof = new THREE.Mesh(roofGeometry, roofMaterial)
      roof.position.set(houseX, houseSize.height + 0.4, houseZ)
      roof.rotation.y = house.rotation.y
      scene.add(roof)
      
      // Chimenea (80% de las casas)
      if (Math.random() > 0.2) {
        const chimneyGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4)
        const chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial)
        chimney.position.set(
          houseX + (Math.random() - 0.5) * houseSize.width * 0.7,
          houseSize.height + 1.2,
          houseZ + (Math.random() - 0.5) * houseSize.depth * 0.7
        )
        scene.add(chimney)
      }
      
      // Pequeño jardín/patio (40% de las casas)
      if (Math.random() > 0.6) {
        const gardenGeometry = new THREE.CircleGeometry(houseSize.width * 0.8, 8)
        const gardenMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x90EE90, 
          transparent: true, 
          opacity: 0.6 
        })
        const garden = new THREE.Mesh(gardenGeometry, gardenMaterial)
        garden.rotation.x = -Math.PI / 2
        garden.position.set(
          houseX + Math.cos(angle + Math.PI) * houseSize.width * 1.2,
          0.02,
          houseZ + Math.sin(angle + Math.PI) * houseSize.depth * 1.2
        )
        scene.add(garden)
      }
      
      houses.push({ x: houseX, z: houseZ, size: houseSize })
      housesCreated++
    }
  }
  
  // ============ INFRAESTRUCTURA DEL DISTRITO ============
  
  // Plaza central del distrito
  const centralPlazaGeometry = new THREE.CircleGeometry(villa.radius * 0.15, 16)
  const centralPlazaMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 })
  const centralPlaza = new THREE.Mesh(centralPlazaGeometry, centralPlazaMaterial)
  centralPlaza.rotation.x = -Math.PI / 2
  centralPlaza.position.set(villa.center.x, 0.05, villa.center.z)
  scene.add(centralPlaza)
  
  // Fuente central
  const fountainGeometry = new THREE.CylinderGeometry(2, 2.5, 1.5, 12)
  const fountainMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAFA })
  const fountain = new THREE.Mesh(fountainGeometry, fountainMaterial)
  fountain.position.set(villa.center.x, 0.75, villa.center.z)
  scene.add(fountain)
  
  // Iglesia/capilla local
  const chapelGeometry = new THREE.BoxGeometry(6, 8, 10)
  const chapelMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAFA })
  const chapel = new THREE.Mesh(chapelGeometry, chapelMaterial)
  chapel.position.set(
    villa.center.x + villa.radius * 0.3,
    4,
    villa.center.z - villa.radius * 0.2
  )
  scene.add(chapel)
  
  // Torre de campana
  const bellTowerGeometry = new THREE.BoxGeometry(2, 12, 2)
  const bellTower = new THREE.Mesh(bellTowerGeometry, chapelMaterial)
  bellTower.position.set(chapel.position.x, 6, chapel.position.z + 6)
  scene.add(bellTower)
  
  // Tejado de iglesia
  const chapelRoofGeometry = new THREE.ConeGeometry(1.5, 3, 4)
  const chapelRoof = new THREE.Mesh(chapelRoofGeometry, roofMaterial)
  chapelRoof.position.set(bellTower.position.x, 13, bellTower.position.z)
  chapelRoof.rotation.y = Math.PI / 4
  scene.add(chapelRoof)
  
  // Mercadillo local (3-5 puestos)
  const numMarketStalls = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < numMarketStalls; i++) {
    const angle = (i / numMarketStalls) * Math.PI * 2
    const stallX = villa.center.x + Math.cos(angle) * villa.radius * 0.6
    const stallZ = villa.center.z + Math.sin(angle) * villa.radius * 0.6
    
    const stallGeometry = new THREE.BoxGeometry(2, 2.5, 2)
    const stallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const stall = new THREE.Mesh(stallGeometry, stallMaterial)
    stall.position.set(stallX, 1.25, stallZ)
    scene.add(stall)
    
    // Toldo
    const canopyGeometry = new THREE.BoxGeometry(2.5, 0.1, 2.5)
    const canopyColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57]
    const canopyMaterial = new THREE.MeshLambertMaterial({ 
      color: canopyColors[Math.floor(Math.random() * canopyColors.length)] 
    })
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial)
    canopy.position.set(stallX, 3, stallZ)
    scene.add(canopy)
  }
  
  // Molino de viento (en algunos distritos)
  if (villa.type === 'agricultural' || Math.random() > 0.7) {
    const millX = villa.center.x + villa.radius * 0.8
    const millZ = villa.center.z + villa.radius * 0.4
    
    // Torre del molino
    const millTowerGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 8)
    const millTowerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAFA })
    const millTower = new THREE.Mesh(millTowerGeometry, millTowerMaterial)
    millTower.position.set(millX, 6, millZ)
    scene.add(millTower)
    
    // Aspas del molino
    for (let i = 0; i < 4; i++) {
      const bladeAngle = (i / 4) * Math.PI * 2
      const bladeGeometry = new THREE.BoxGeometry(0.5, 8, 0.2)
      const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
      blade.position.set(
        millX + Math.cos(bladeAngle) * 4,
        10,
        millZ + Math.sin(bladeAngle) * 4
      )
      blade.rotation.z = bladeAngle
      scene.add(blade)
    }
  }
  
  // Pozo comunitario
  const wellGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 12)
  const wellMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
  const well = new THREE.Mesh(wellGeometry, wellMaterial)
  well.position.set(
    villa.center.x - villa.radius * 0.4,
    1,
    villa.center.z + villa.radius * 0.3
  )
  scene.add(well)
  
  // Estructura del pozo
  const wellFrameGeometry = new THREE.BoxGeometry(3, 4, 0.5)
  const wellFrame = new THREE.Mesh(wellFrameGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
  wellFrame.position.set(well.position.x, 3, well.position.z)
  scene.add(wellFrame)
  
  console.log(`Created ${districtName} with ${housesCreated} houses`)
}

const createLakeAndSurroundings = async (): Promise<void> => {
  if (!scene) return

  console.log('Creating lake and surroundings...')

  const materials = {
    water: new THREE.MeshLambertMaterial({ 
      color: 0x4682B4, 
      transparent: true, 
      opacity: 0.8 
    }),
    stone: new THREE.MeshLambertMaterial({ color: 0x696969 }),
    marble: new THREE.MeshLambertMaterial({ color: 0x778899 }),
    gold: new THREE.MeshLambertMaterial({ color: 0xDAA520 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x654321 }),
    bronze: new THREE.MeshLambertMaterial({ color: 0x8B7D6B }),
    grass: new THREE.MeshLambertMaterial({ color: 0x8FBC8F }),
    reed: new THREE.MeshLambertMaterial({ color: 0x9ACD32 })
  }

  // ============ DISTRITO DEL LAGO LAFE MASIVO ============
  // Posicionado fuera de la muralla exterior (norte)
  const lafeCenter = { x: 0, z: -400 }
  const lafeRadius = 90 // Más grande que el castillo
  const lakeBaseX = lafeCenter.x
  const lakeBaseZ = lafeCenter.z

  console.log('Creating MASSIVE LAFE LAKE DISTRICT outside city walls...')

  // ========== GRAN LAGO LAFE CENTRAL ==========
  const lakeGeometry = new THREE.CircleGeometry(lafeRadius, 64)
  const lake = new THREE.Mesh(lakeGeometry, materials.water)
  lake.rotation.x = -Math.PI / 2
  lake.position.set(lafeCenter.x, -1, lafeCenter.z)
  scene.add(lake)

  // ========== PALACIO LACUSTRE IMPERIAL ==========
  // Palacio flotante en el centro del lago
  const lakePalaceGeometry = new THREE.BoxGeometry(40, 18, 30)
  const lakePalace = new THREE.Mesh(lakePalaceGeometry, materials.marble)
  lakePalace.position.set(lafeCenter.x, 9, lafeCenter.z)
  scene.add(lakePalace)

  // Cúpulas doradas del palacio lacustre (3 cúpulas principales)
  const domePositions = [
    { x: lafeCenter.x, z: lafeCenter.z, size: 10 },
    { x: lafeCenter.x - 15, z: lafeCenter.z - 8, size: 6 },
    { x: lafeCenter.x + 15, z: lafeCenter.z + 8, size: 6 }
  ]

  domePositions.forEach(dome => {
    const domeGeometry = new THREE.SphereGeometry(dome.size, 16, 12)
    const domeMesh = new THREE.Mesh(domeGeometry, materials.gold)
    domeMesh.position.set(dome.x, 18 + dome.size, dome.z)
    scene.add(domeMesh)
  })

  // Torres del palacio flotante (8 torres en el perímetro)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const towerX = lafeCenter.x + Math.cos(angle) * 25
    const towerZ = lafeCenter.z + Math.sin(angle) * 18

    const towerGeometry = new THREE.CylinderGeometry(3, 4, 22, 12)
    const tower = new THREE.Mesh(towerGeometry, materials.stone)
    tower.position.set(towerX, 11, towerZ)
    scene.add(tower)

    // Corona dorada en cada torre
    const crownGeometry = new THREE.CylinderGeometry(3.5, 3, 2, 12)
    const crown = new THREE.Mesh(crownGeometry, materials.gold)
    crown.position.set(towerX, 23, towerZ)
    scene.add(crown)

    // Banderas imperiales
    const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8)
    const flagPole = new THREE.Mesh(flagPoleGeometry, materials.bronze)
    flagPole.position.set(towerX, 27, towerZ)
    scene.add(flagPole)

    const flagGeometry = new THREE.PlaneGeometry(4, 3)
    const flagMaterial = new THREE.MeshLambertMaterial({ color: 0x800080 })
    const flag = new THREE.Mesh(flagGeometry, flagMaterial)
    flag.position.set(towerX + 2, 28, towerZ)
    scene.add(flag)
  }

  // ========== PUENTES MONUMENTALES AL PALACIO ==========
  const bridgePositions = [
    { start: { x: lafeCenter.x, z: lafeCenter.z + 70 }, end: { x: lafeCenter.x, z: lafeCenter.z + 15 } },
    { start: { x: lafeCenter.x + 70, z: lafeCenter.z }, end: { x: lafeCenter.x + 20, z: lafeCenter.z } },
    { start: { x: lafeCenter.x - 70, z: lafeCenter.z }, end: { x: lafeCenter.x - 20, z: lafeCenter.z } },
    { start: { x: lafeCenter.x, z: lafeCenter.z - 70 }, end: { x: lafeCenter.x, z: lafeCenter.z - 15 } }
  ]

  bridgePositions.forEach(bridge => {
    const bridgeLength = Math.sqrt(
      Math.pow(bridge.end.x - bridge.start.x, 2) + 
      Math.pow(bridge.end.z - bridge.start.z, 2)
    )
    const bridgeAngle = Math.atan2(bridge.end.z - bridge.start.z, bridge.end.x - bridge.start.x)

    const bridgeGeometry = new THREE.BoxGeometry(bridgeLength, 3, 8)
    const bridgeMesh = new THREE.Mesh(bridgeGeometry, materials.marble)
    bridgeMesh.position.set(
      (bridge.start.x + bridge.end.x) / 2,
      1.5,
      (bridge.start.z + bridge.end.z) / 2
    )
    bridgeMesh.rotation.y = bridgeAngle
    scene.add(bridgeMesh)

    // Pilares del puente (cada 15 unidades)
    const numPillars = Math.floor(bridgeLength / 15)
    for (let i = 1; i < numPillars; i++) {
      const pillarX = bridge.start.x + (bridge.end.x - bridge.start.x) * (i / numPillars)
      const pillarZ = bridge.start.z + (bridge.end.z - bridge.start.z) * (i / numPillars)

      const pillarGeometry = new THREE.CylinderGeometry(2, 3, 8, 12)
      const pillar = new THREE.Mesh(pillarGeometry, materials.stone)
      pillar.position.set(pillarX, 0, pillarZ)
      scene.add(pillar)
    }

    // Barandillas ornamentales
    for (let i = 0; i < bridgeLength; i += 3) {
      const railX = bridge.start.x + (bridge.end.x - bridge.start.x) * (i / bridgeLength)
      const railZ = bridge.start.z + (bridge.end.z - bridge.start.z) * (i / bridgeLength)

      const railGeometry = new THREE.BoxGeometry(0.3, 2, 0.3)
      const rail = new THREE.Mesh(railGeometry, materials.bronze)
      rail.position.set(railX + 3 * Math.cos(bridgeAngle + Math.PI/2), 4, railZ + 3 * Math.sin(bridgeAngle + Math.PI/2))
      scene.add(rail)
    }
  })

  // ========== VILLAS LACUSTRES EN LA ORILLA ==========
  // Residencias de lujo alrededor del lago
  const lakeVillas = [
    // Norte del lago
    { name: 'Villa del Gran Duque', x: lafeCenter.x - 30, z: lafeCenter.z - 80, size: 'large' },
    { name: 'Villa de la Condesa', x: lafeCenter.x + 30, z: lafeCenter.z - 80, size: 'large' },
    { name: 'Villa del Embajador', x: lafeCenter.x - 50, z: lafeCenter.z - 70, size: 'medium' },
    { name: 'Villa del Almirante', x: lafeCenter.x + 50, z: lafeCenter.z - 70, size: 'medium' },
    
    // Este del lago
    { name: 'Villa de los Mercaderes', x: lafeCenter.x + 75, z: lafeCenter.z - 20, size: 'large' },
    { name: 'Villa del Arzobispo', x: lafeCenter.x + 70, z: lafeCenter.z + 20, size: 'medium' },
    { name: 'Villa del Tesorero Real', x: lafeCenter.x + 80, z: lafeCenter.z + 40, size: 'medium' },
    
    // Sur del lago
    { name: 'Villa de los Artistas', x: lafeCenter.x - 25, z: lafeCenter.z + 85, size: 'large' },
    { name: 'Villa del Maestro de Armas', x: lafeCenter.x + 25, z: lafeCenter.z + 85, size: 'large' },
    { name: 'Villa de los Eruditos', x: lafeCenter.x, z: lafeCenter.z + 75, size: 'medium' },
    
    // Oeste del lago
    { name: 'Villa del Canciller', x: lafeCenter.x - 75, z: lafeCenter.z - 15, size: 'large' },
    { name: 'Villa del Capitán', x: lafeCenter.x - 70, z: lafeCenter.z + 25, size: 'medium' },
    { name: 'Villa de la Academia', x: lafeCenter.x - 80, z: lafeCenter.z + 45, size: 'medium' }
  ]

  lakeVillas.forEach(villa => {
    let villaSize = { width: 15, height: 8, depth: 12 }
    if (villa.size === 'large') {
      villaSize = { width: 20, height: 12, depth: 18 }
    }

    const villaGeometry = new THREE.BoxGeometry(villaSize.width, villaSize.height, villaSize.depth)
    const villaMaterial = villa.size === 'large' ? materials.marble : materials.stone
    const villaMesh = new THREE.Mesh(villaGeometry, villaMaterial)
    villaMesh.position.set(villa.x, villaSize.height/2, villa.z)
    scene.add(villaMesh)

    // Torres en villas grandes
    if (villa.size === 'large') {
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2
        const towerX = villa.x + Math.cos(angle) * villaSize.width/2
        const towerZ = villa.z + Math.sin(angle) * villaSize.depth/2

        const towerGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 8)
        const tower = new THREE.Mesh(towerGeometry, materials.stone)
        tower.position.set(towerX, 7.5, towerZ)
        scene.add(tower)

        // Techos puntiagudos
        const roofGeometry = new THREE.ConeGeometry(2.5, 4, 8)
        const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x5D4E37 }))
        roof.position.set(towerX, 17, towerZ)
        scene.add(roof)
      }
    }

    // Jardines de las villas
    const gardenGeometry = new THREE.CircleGeometry(villaSize.width * 0.8, 16)
    const garden = new THREE.Mesh(gardenGeometry, materials.grass)
    garden.rotation.x = -Math.PI / 2
    garden.position.set(villa.x + villaSize.width + 5, 0.02, villa.z)
    scene.add(garden)

    // Muelles privados
    const dockGeometry = new THREE.BoxGeometry(10, 1, 4)
    const dock = new THREE.Mesh(dockGeometry, materials.wood)
    
    // Calcular posición del muelle hacia el lago
    const angleToLake = Math.atan2(lafeCenter.z - villa.z, lafeCenter.x - villa.x)
    const dockX = villa.x + Math.cos(angleToLake) * 35
    const dockZ = villa.z + Math.sin(angleToLake) * 35
    
    dock.position.set(dockX, 0.5, dockZ)
    dock.rotation.y = angleToLake
    scene.add(dock)
  })

  // ========== EMBARCACIONES EN EL LAGO ==========
  const lakeBoats = [
    { name: 'Galera Imperial', x: lafeCenter.x - 20, z: lafeCenter.z - 25, type: 'imperial', size: 'large' },
    { name: 'Barca Real', x: lafeCenter.x + 25, z: lafeCenter.z + 15, type: 'royal', size: 'medium' },
    { name: 'Barca de Placer', x: lafeCenter.x - 15, z: lafeCenter.z + 30, type: 'pleasure', size: 'small' },
    { name: 'Barca de Pesca', x: lafeCenter.x + 40, z: lafeCenter.z - 35, type: 'fishing', size: 'small' },
    { name: 'Barge de Suministros', x: lafeCenter.x - 35, z: lafeCenter.z + 20, type: 'supply', size: 'medium' },
    { name: 'Góndola Noble', x: lafeCenter.x + 15, z: lafeCenter.z - 40, type: 'noble', size: 'small' }
  ]

  lakeBoats.forEach(boat => {
    let boatSize = { length: 8, width: 3, height: 1.5 }
    if (boat.size === 'large') {
      boatSize = { length: 16, width: 6, height: 3 }
    } else if (boat.size === 'medium') {
      boatSize = { length: 12, width: 4, height: 2 }
    }

    const boatGeometry = new THREE.BoxGeometry(boatSize.length, boatSize.height, boatSize.width)
    let boatMaterial = materials.wood
    if (boat.type === 'imperial') boatMaterial = materials.gold
    else if (boat.type === 'royal') boatMaterial = materials.marble

    const boatMesh = new THREE.Mesh(boatGeometry, boatMaterial)
    boatMesh.position.set(boat.x, 0, boat.z)
    scene.add(boatMesh)

    // Mástil para barcos grandes y medianos
    if (boat.size !== 'small') {
      const mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, boatSize.height + 8, 8)
      const mast = new THREE.Mesh(mastGeometry, materials.wood)
      mast.position.set(boat.x, boatSize.height + 4, boat.z)
      scene.add(mast)

      // Vela
      const sailGeometry = new THREE.PlaneGeometry(boatSize.length * 0.6, boatSize.height + 6)
      const sailMaterial = new THREE.MeshLambertMaterial({ 
        color: boat.type === 'imperial' ? 0x800080 : 0xFFFACD 
      })
      const sail = new THREE.Mesh(sailGeometry, sailMaterial)
      sail.position.set(boat.x + boatSize.length * 0.3, boatSize.height + 4, boat.z)
      scene.add(sail)
    }
  })

  // ========== TEMPLO LACUSTRE ==========
  // Templo dedicado a la diosa del agua en una isla artificial
  const templeIslandGeometry = new THREE.CircleGeometry(15, 16)
  const templeIsland = new THREE.Mesh(templeIslandGeometry, materials.stone)
  templeIsland.rotation.x = -Math.PI / 2
  templeIsland.position.set(lafeCenter.x + 60, -0.5, lafeCenter.z + 60)
  scene.add(templeIsland)

  const templeGeometry = new THREE.BoxGeometry(12, 15, 12)
  const temple = new THREE.Mesh(templeGeometry, materials.marble)
  temple.position.set(lafeCenter.x + 60, 7.5, lafeCenter.z + 60)
  scene.add(temple)

  // Cúpula del templo
  const templeDomeGeometry = new THREE.SphereGeometry(7, 16, 12)
  const templeDome = new THREE.Mesh(templeDomeGeometry, materials.gold)
  templeDome.position.set(lafeCenter.x + 60, 22, lafeCenter.z + 60)
  scene.add(templeDome)

  // Columnas del templo (8 columnas)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const columnX = lafeCenter.x + 60 + Math.cos(angle) * 8
    const columnZ = lafeCenter.z + 60 + Math.sin(angle) * 8

    const columnGeometry = new THREE.CylinderGeometry(1, 1, 12, 12)
    const column = new THREE.Mesh(columnGeometry, materials.marble)
    column.position.set(columnX, 6, columnZ)
    scene.add(column)
  }

  // ========== JARDINES ACUÁTICOS Y VEGETACIÓN ==========
  // Juncos alrededor del lago
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2
    const distance = lafeRadius + 3 + Math.random() * 8
    const reedX = lafeCenter.x + Math.cos(angle) * distance
    const reedZ = lafeCenter.z + Math.sin(angle) * distance

    const reedGeometry = new THREE.CylinderGeometry(0.1, 0.2, 3 + Math.random() * 2, 6)
    const reed = new THREE.Mesh(reedGeometry, materials.reed)
    reed.position.set(reedX, 1.5, reedZ)
    scene.add(reed)
  }

  // Nenúfares en el lago
  for (let i = 0; i < 25; i++) {
    const lilyX = lafeCenter.x + (Math.random() - 0.5) * lafeRadius * 1.8
    const lilyZ = lafeCenter.z + (Math.random() - 0.5) * lafeRadius * 1.8
    
    // Solo si está dentro del lago
    const distanceFromCenter = Math.sqrt(Math.pow(lilyX - lafeCenter.x, 2) + Math.pow(lilyZ - lafeCenter.z, 2))
    if (distanceFromCenter < lafeRadius - 10) {
      const lilyGeometry = new THREE.CircleGeometry(1 + Math.random(), 8)
      const lilyMaterial = new THREE.MeshLambertMaterial({ 
        color: Math.random() > 0.5 ? 0xFFFFFF : 0xFFB6C1 
      })
      const lily = new THREE.Mesh(lilyGeometry, lilyMaterial)
      lily.rotation.x = -Math.PI / 2
      lily.position.set(lilyX, -0.8, lilyZ)
      scene.add(lily)
    }
  }

  // ========== FUENTES ORNAMENTALES EN LAS ORILLAS ==========
  const fountainPositions = [
    { x: lafeCenter.x, z: lafeCenter.z + 100 },
    { x: lafeCenter.x + 85, z: lafeCenter.z },
    { x: lafeCenter.x, z: lafeCenter.z - 100 },
    { x: lafeCenter.x - 85, z: lafeCenter.z }
  ]

  fountainPositions.forEach(pos => {
    const fountainBaseGeometry = new THREE.CylinderGeometry(4, 5, 3, 16)
    const fountainBase = new THREE.Mesh(fountainBaseGeometry, materials.marble)
    fountainBase.position.set(pos.x, 1.5, pos.z)
    scene.add(fountainBase)

    const fountainGeometry = new THREE.CylinderGeometry(2, 3, 8, 16)
    const fountain = new THREE.Mesh(fountainGeometry, materials.marble)
    fountain.position.set(pos.x, 7, pos.z)
    scene.add(fountain)

    // Estatua en la fuente
    const statueGeometry = new THREE.CylinderGeometry(1, 1.5, 4, 8)
    const statue = new THREE.Mesh(statueGeometry, materials.bronze)
    statue.position.set(pos.x, 13, pos.z)
    scene.add(statue)
  })

  // ============ PUEBLO PESQUERO PRINCIPAL - "VILLA LAFE" ============
  const villageX = lakeBaseX + 20
  const villageZ = lakeBaseZ - 8

  const fisherHouses = [
    { name: 'Casa del Pescador Mayor', x: villageX, z: villageZ, width: 4, height: 3, depth: 5, type: 'chief' },
    { name: 'Posada del Lago', x: villageX + 6, z: villageZ - 3, width: 6, height: 4, depth: 8, type: 'inn' },
    { name: 'Herrería de Anzuelos', x: villageX - 5, z: villageZ + 4, width: 3, height: 2.5, depth: 4, type: 'smithy' },
    { name: 'Casa de Redes', x: villageX + 3, z: villageZ + 6, width: 4, height: 2.5, depth: 4, type: 'nets' },
    { name: 'Ahumadero', x: villageX - 8, z: villageZ, width: 5, height: 3, depth: 6, type: 'smokehouse' },
    { name: 'Capilla de San Pez', x: villageX + 8, z: villageZ + 5, width: 4, height: 5, depth: 6, type: 'chapel' },
    { name: 'Almacén de Sal', x: villageX - 3, z: villageZ - 6, width: 6, height: 3, depth: 4, type: 'storage' },
    { name: 'Casa del Barquero', x: villageX + 10, z: villageZ - 8, width: 3, height: 2.5, depth: 4, type: 'house' },
    { name: 'Casa de la Viuda', x: villageX - 10, z: villageZ + 8, width: 3, height: 2, depth: 3, type: 'house' },
    { name: 'Taller de Botes', x: villageX + 5, z: villageZ + 12, width: 8, height: 3, depth: 12, type: 'boatyard' }
  ]
  
  fisherHouses.forEach(house => {
    let houseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    if (house.type === 'chief') houseMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 })
    else if (house.type === 'inn') houseMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C })
    else if (house.type === 'chapel') houseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAFA })
    
    // Edificio principal
    const houseGeometry = new THREE.BoxGeometry(house.width, house.height, house.depth)
    const houseMesh = new THREE.Mesh(houseGeometry, houseMaterial)
    houseMesh.position.set(house.x, house.height/2, house.z)
    houseMesh.castShadow = true
    scene.add(houseMesh)
    
    // Tejado específico por tipo
    if (house.type === 'chapel') {
      // Tejado a dos aguas para capilla
      const roofGeometry = new THREE.BoxGeometry(house.width + 0.5, 2, house.depth + 0.5)
      const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
      roof.position.set(house.x, house.height + 1, house.z)
      scene.add(roof)
      
      // Campanario
      const bellTowerGeometry = new THREE.BoxGeometry(1.5, 4, 1.5)
      const bellTower = new THREE.Mesh(bellTowerGeometry, houseMaterial)
      bellTower.position.set(house.x, house.height + 2, house.z + house.depth/2)
      scene.add(bellTower)
      
      // Campana
      const bellGeometry = new THREE.SphereGeometry(0.3, 8, 6)
      const bell = new THREE.Mesh(bellGeometry, new THREE.MeshLambertMaterial({ color: 0xB8860B }))
      bell.position.set(house.x, house.height + 3.5, house.z + house.depth/2)
      scene.add(bell)
    } else {
      // Tejado estándar
      const roofGeometry = new THREE.BoxGeometry(house.width + 0.3, 0.8, house.depth + 0.3)
      const roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
      roof.position.set(house.x, house.height + 0.4, house.z)
      scene.add(roof)
    }
    
    // Características específicas por tipo
    if (house.type === 'smokehouse') {
      // Chimeneas múltiples para ahumar pescado
      for (let i = 0; i < 3; i++) {
        const chimneyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 8)
        const chimney = new THREE.Mesh(chimneyGeometry, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }))
        chimney.position.set(house.x + (i - 1) * 1.5, house.height + 1.5, house.z)
        scene.add(chimney)
        
        // "Humo" del ahumadero
        const smokeGeometry = new THREE.CylinderGeometry(0.6, 0.3, 2, 6)
        const smokeMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x808080, 
          transparent: true, 
          opacity: 0.3 
        })
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial)
        smoke.position.set(chimney.position.x, house.height + 3.5, chimney.position.z)
        scene.add(smoke)
      }
      
      // Pescados colgando para secar
      for (let i = 0; i < 8; i++) {
        const fishGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.2)
        const fish = new THREE.Mesh(fishGeometry, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }))
        fish.position.set(
          house.x + house.width/2 + 1,
          house.height - 0.5,
          house.z - house.depth/2 + (i + 1) * house.depth/9
        )
        scene.add(fish)
      }
    }
    
    if (house.type === 'boatyard') {
      // Bote en construcción
      const boatHullGeometry = new THREE.BoxGeometry(6, 1, 2)
      const boatHull = new THREE.Mesh(boatHullGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      boatHull.position.set(house.x, 1, house.z)
      scene.add(boatHull)
      
      // Andamios alrededor
      for (let i = 0; i < 6; i++) {
        const scaffoldGeometry = new THREE.BoxGeometry(0.2, 3, 0.2)
        const scaffold = new THREE.Mesh(scaffoldGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
        scaffold.position.set(
          house.x + Math.cos(i) * 4,
          1.5,
          house.z + Math.sin(i) * 2
        )
        scene.add(scaffold)
      }
    }
    
    if (house.type === 'nets') {
      // Redes extendidas para secar
      for (let i = 0; i < 3; i++) {
        const netGeometry = new THREE.PlaneGeometry(4, 3)
        const netMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x654321, 
          transparent: true, 
          opacity: 0.7 
        })
        const net = new THREE.Mesh(netGeometry, netMaterial)
        net.position.set(
          house.x + house.width/2 + 2,
          2,
          house.z + (i - 1) * 2
        )
        scene.add(net)
      }
    }
    
    if (house.type === 'inn') {
      // Cartel de la posada
      const signGeometry = new THREE.BoxGeometry(2, 1, 0.2)
      const sign = new THREE.Mesh(signGeometry, new THREE.MeshLambertMaterial({ color: 0xF5DEB3 }))
      sign.position.set(house.x, house.height - 0.5, house.z + house.depth/2 + 0.5)
      scene.add(sign)
      
      // Establos pequeños
      const stableGeometry = new THREE.BoxGeometry(4, 2.5, 3)
      const stable = new THREE.Mesh(stableGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      stable.position.set(house.x + house.width + 2.5, 1.25, house.z)
      scene.add(stable)
    }
  })
  
  // ============ EMBARCADEROS Y MUELLES ============
  const docks = [
    { name: 'Muelle Principal', x: lakeBaseX + 12, z: lakeBaseZ + 5, length: 8, width: 3 },
    { name: 'Embarcadero Norte', x: lakeBaseX + 8, z: lakeBaseZ - 10, length: 6, width: 2.5 },
    { name: 'Muelle de Pesca', x: lakeBaseX - 8, z: lakeBaseZ + 8, length: 10, width: 4 },
    { name: 'Atracadero Sur', x: lakeBaseX + 5, z: lakeBaseZ + 12, length: 5, width: 2 }
  ]
  
  docks.forEach(dock => {
    // Estructura del muelle
    const dockGeometry = new THREE.BoxGeometry(dock.length, 0.8, dock.width)
    const dockMesh = new THREE.Mesh(dockGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
    dockMesh.position.set(dock.x, 0.4, dock.z)
    scene.add(dockMesh)
    
    // Pilotes de soporte
    const numPiles = Math.max(3, Math.floor(dock.length / 2))
    for (let i = 0; i < numPiles; i++) {
      const pileGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8)
      const pile = new THREE.Mesh(pileGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      pile.position.set(
        dock.x - dock.length/2 + (i + 1) * dock.length/(numPiles + 1),
        0.5,
        dock.z
      )
      scene.add(pile)
    }
  })
  
  // ============ FLOTA PESQUERA ============
  const boats = [
    { name: 'Pescador Real', x: lakeBaseX + 10, z: lakeBaseZ + 3, size: 'large', type: 'fishing' },
    { name: 'Sirena Azul', x: lakeBaseX + 6, z: lakeBaseZ - 8, size: 'medium', type: 'fishing' },
    { name: 'Viento del Norte', x: lakeBaseX - 5, z: lakeBaseZ + 6, size: 'medium', type: 'fishing' },
    { name: 'Gaviota Feliz', x: lakeBaseX + 3, z: lakeBaseZ + 10, size: 'small', type: 'fishing' },
    { name: 'Perla del Lago', x: lakeBaseX - 10, z: lakeBaseZ - 5, size: 'small', type: 'transport' },
    { name: 'Barquero Viejo', x: lakeBaseX + 8, z: lakeBaseZ - 12, size: 'tiny', type: 'ferry' }
  ]
  
  boats.forEach(boat => {
    const length = boat.size === 'large' ? 8 : boat.size === 'medium' ? 6 : boat.size === 'small' ? 4 : 2.5
    const width = boat.size === 'large' ? 3 : boat.size === 'medium' ? 2.5 : boat.size === 'small' ? 2 : 1.5
    const height = boat.size === 'large' ? 1.5 : boat.size === 'medium' ? 1.2 : boat.size === 'small' ? 1 : 0.8
    
    // Casco del barco
    const hullGeometry = new THREE.BoxGeometry(length, height, width)
    const hull = new THREE.Mesh(hullGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
    hull.position.set(boat.x, height/2, boat.z)
    scene.add(hull)
    
    // Proa
    const prowGeometry = new THREE.ConeGeometry(width/2, length/4, 6)
    const prow = new THREE.Mesh(prowGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }))
    prow.position.set(boat.x + length/2 + length/8, height/2, boat.z)
    prow.rotation.z = -Math.PI / 2
    scene.add(prow)
    
    // Mástil y vela (solo barcos medianos y grandes)
    if (boat.size !== 'tiny') {
      const mastHeight = height + 3
      const mastGeometry = new THREE.CylinderGeometry(0.1, 0.1, mastHeight, 6)
      const mast = new THREE.Mesh(mastGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
      mast.position.set(boat.x, mastHeight/2 + height/2, boat.z)
      scene.add(mast)
      
      const sailGeometry = new THREE.PlaneGeometry(length * 0.6, mastHeight * 0.7)
      const sailMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFACD })
      const sail = new THREE.Mesh(sailGeometry, sailMaterial)
      sail.position.set(boat.x + length * 0.3, mastHeight * 0.6, boat.z)
      scene.add(sail)
    }
    
    // Redes de pesca (barcos pesqueros)
    if (boat.type === 'fishing') {
      for (let i = 0; i < 2; i++) {
        const netGeometry = new THREE.SphereGeometry(0.8, 8, 6)
        const netMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x654321, 
          transparent: true, 
          opacity: 0.6 
        })
        const net = new THREE.Mesh(netGeometry, netMaterial)
        net.position.set(
          boat.x + (i - 0.5) * length * 0.6,
          height * 0.8,
          boat.z + width/2 + 0.5
        )
        net.scale.y = 0.3
        scene.add(net)
      }
    }
  })
  
  // ============ ISLA PEQUEÑA EN EL CENTRO DEL LAGO ============
  const islandGeometry = new THREE.CircleGeometry(3, 16)
  const islandMaterial = new THREE.MeshLambertMaterial({ color: 0x8FBC8F })
  const island = new THREE.Mesh(islandGeometry, islandMaterial)
  island.rotation.x = -Math.PI / 2
  island.position.set(lakeBaseX, 0.1, lakeBaseZ)
  scene.add(island)
  
  // Templete en la isla
  const shrineGeometry = new THREE.CylinderGeometry(1, 1.2, 2.5, 8)
  const shrineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAFA })
  const shrine = new THREE.Mesh(shrineGeometry, shrineMaterial)
  shrine.position.set(lakeBaseX, 1.5, lakeBaseZ)
  scene.add(shrine)
  
  // Techo del templete
  const shrineRoofGeometry = new THREE.ConeGeometry(1.5, 1, 8)
  const shrineRoof = new THREE.Mesh(shrineRoofGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
  shrineRoof.position.set(lakeBaseX, 3, lakeBaseZ)
  scene.add(shrineRoof)
  
  // Árboles en la isla
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const treeX = lakeBaseX + Math.cos(angle) * 2
    const treeZ = lakeBaseZ + Math.sin(angle) * 2
    
    const treeGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 6)
    const tree = new THREE.Mesh(treeGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }))
    tree.position.set(treeX, 1.5, treeZ)
    scene.add(tree)
    
    const leavesGeometry = new THREE.SphereGeometry(1, 8, 6)
    const leaves = new THREE.Mesh(leavesGeometry, new THREE.MeshLambertMaterial({ color: 0x228B22 }))
    leaves.position.set(treeX, 3.5, treeZ)
    scene.add(leaves)
  }
  
  // ============ CAMINOS HACIA LA CIUDAD ============
  const pathToCity = [
    { x: lakeBaseX + 25, z: lakeBaseZ - 5 },
    { x: lakeBaseX + 30, z: lakeBaseZ - 10 },
    { x: lakeBaseX + 35, z: lakeBaseZ - 15 },
    { x: lakeBaseX + 40, z: lakeBaseZ - 20 },
    { x: lakeBaseX + 42, z: lakeBaseZ - 25 },
    { x: lakeBaseX + 45, z: lakeBaseZ - 30 }
  ]
  
  pathToCity.forEach((point, index) => {
    const pathGeometry = new THREE.CircleGeometry(1.2, 8)
    const pathMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xA0956B, 
      transparent: true, 
      opacity: 0.6 
    })
    const pathSegment = new THREE.Mesh(pathGeometry, pathMaterial)
    pathSegment.rotation.x = -Math.PI / 2
    pathSegment.position.set(point.x, 0.02, point.z)
    scene.add(pathSegment)
    
    // Marcadores de camino (piedras)
    if (index % 2 === 0) {
      const markerGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8)
      const marker = new THREE.Mesh(markerGeometry, new THREE.MeshLambertMaterial({ color: 0x696969 }))
      marker.position.set(point.x + 1.5, 0.75, point.z)
      scene.add(marker)
    }
  })
}

const createVegetation = async (): Promise<void> => {
  if (!scene) return
  
  const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }) // Tronco más oscuro
  const leaveMaterial = new THREE.MeshLambertMaterial({ color: 0x7A8471 }) // Verde apagado pergamino
  
  // Árboles alrededor de la ciudad (bosque) con distribución más orgánica
  const forestPositions = [
    // Norte (bosque denso)
    { x: -6, z: -25 }, { x: 3, z: -27 }, { x: -10, z: -22 },
    { x: 7, z: -24 }, { x: -3, z: -30 }, { x: 10, z: -28 },
    { x: 0, z: -26 }, { x: -8, z: -29 },
    // Sur (bosque disperso)
    { x: -15, z: 25 }, { x: -8, z: 27 }, { x: 2, z: 30 },
    { x: 8, z: 26 }, { x: -18, z: 30 }, { x: 5, z: 28 },
    // Oeste (bosque cerca del lago)
    { x: -28, z: -8 }, { x: -25, z: 0 }, { x: -32, z: -5 },
    { x: -22, z: 6 }, { x: -30, z: 3 }, { x: -26, z: -12 },
    { x: -24, z: 12 }, { x: -29, z: 8 },
    // Este (menos denso por el puerto)
    { x: 22, z: -10 }, { x: 28, z: -3 }, { x: 25, z: -15 },
    { x: 30, z: -6 }, { x: 27, z: 5 }
  ]
  
  forestPositions.forEach(pos => {
    // Tronco del árbol con variación
    const trunkHeight = 2.5 + Math.random() * 2.5
    const trunkRadius = 0.15 + Math.random() * 0.15
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius + 0.1, trunkHeight, 6)
    const trunk = new THREE.Mesh(trunkGeometry, treeTrunkMaterial)
    trunk.position.set(pos.x, trunkHeight/2, pos.z)
    trunk.castShadow = true
    scene.add(trunk)
    
    // Copa del árbol con forma más irregular
    const leavesRadius = 1.2 + Math.random() * 0.8
    const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 8, 6)
    const leaves = new THREE.Mesh(leavesGeometry, leaveMaterial)
    leaves.position.set(pos.x, trunkHeight + leavesRadius * 0.6, pos.z)
    leaves.scale.y = 0.8 + Math.random() * 0.4 // Variación en altura
    leaves.castShadow = true
    scene.add(leaves)
  })
  
  // Arbustos decorativos dentro de la ciudad con colores pergamino
  const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x8A9A7A }) // Verde más claro
  const bushPositions = [
    { x: -5, z: -10 }, { x: 8, z: -8 }, { x: -9, z: 5 },
    { x: 6, z: 10 }, { x: -3, z: 7 }, { x: 10, z: -5 },
    { x: -12, z: 2 }, { x: 7, z: 3 }, { x: -6, z: 8 },
    { x: 4, z: -3 }, { x: -8, z: -1 }, { x: 9, z: 7 }
  ]
  
  bushPositions.forEach(pos => {
    const bushRadius = 0.4 + Math.random() * 0.4
    const bushGeometry = new THREE.SphereGeometry(bushRadius, 6, 4)
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.position.set(pos.x, bushRadius * 0.6, pos.z)
    bush.scale.y = 0.5 + Math.random() * 0.3
    bush.castShadow = true
    scene.add(bush)
  })
  
  // Hierba dispersa para mayor realismo
  const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x9AAA8A })
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 8 + Math.random() * 12
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance
    
    const grassGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 4, 3)
    const grass = new THREE.Mesh(grassGeometry, grassMaterial)
    grass.position.set(x, 0.1, z)
    grass.scale.y = 0.3 + Math.random() * 0.2
    scene.add(grass)
  }

  console.log('Lake and surroundings created successfully')
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanup()
})
</script>

<style scoped>
.topo-map-container canvas {
  display: block;
}
</style>
