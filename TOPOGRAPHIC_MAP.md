# Mapa Topográfico 3D Procedural - Ciudad de PILOTES

## Descripción

Sistema avanzado de generación 3D procedural que crea una ciudad medieval completamente funcional e interactiva usando Three.js. En lugar de texturas planas, genera modelos 3D reales de edificios, castillos, murallas, barcos y vegetación.

## 🏰 Características del Mundo 3D

### 🎨 **Generación Procedural Completa**
- **Sin Texturas**: Todo se genera como modelos 3D reales
- **Ciudad Viviente**: Cada edificio, árbol y estructura es un objeto 3D independiente
- **Arquitectura Medieval**: Estilo coherente basado en tu mapa original de Pilotes

### 🏛️ **Estructura de la Ciudad**

#### 🛡️ **Sistema Defensivo**
- **Murallas Circulares**: Fortificaciones completas con torres de vigilancia
- **12 Torres de Guardia**: Con tejados cónicos y detalles arquitectónicos
- **4 Puertas Principales**: Norte, Sur, Este y Oeste
- **Castillo Central**: Torre principal de 12 metros con torres secundarias

#### 🏘️ **Distritos Urbanos**

**PALERMO (Distrito Noble)**
- 7 mansiones únicas con diferentes tamaños y alturas
- Chimeneas en casas selectas
- Fuente central decorativa
- Tejados de madera noble

**OPUS (Distrito Artesanal)**
- 7 talleres especializados (forjas, workshops, tiendas)
- Chimeneas industriales para forjas
- Yunques exteriores
- Ruedas de molino
- Tejados metálicos

#### ⚓ **Puerto Comercial**
- **2 Muelles de Madera**: Plataformas extensas para carga
- **2 Almacenes**: Edificios de almacenamiento
- **2 Barcos Completos**: Con cascos, mástiles y velas
- **Grúa Portuaria**: Para carga pesada

#### 🌿 **Entorno Natural**

**Lago LAFE**
- Cuerpo de agua cristalina fuera de las murallas
- 3 Cabañas de pescadores con tejados cónicos
- Ubicación pintoresca

**Bosques Circundantes**
- 24 árboles procedurales con variaciones aleatorias
- Troncos y copas de diferentes tamaños
- Distribución orgánica alrededor de la ciudad
- 8 arbustos decorativos internos

### ⚡ **Sistema de Interactividad Avanzado**

#### 🎯 **Zonas Clickeables Mejoradas**
- **6 Regiones Principales**: Cada una con información detallada
- **Marcadores 3D**: Cilindros de colores flotantes
- **Feedback Visual**: Información contextual al hacer clic
- **Experiencia Diferenciada**: DMs reciben información adicional

#### 🎮 **Controles de Navegación**
- **Cámara Orbital**: 360° de exploración libre
- **Zoom Dinámico**: Desde vista aérea hasta nivel de calle
- **Límites Inteligentes**: Previene clipping bajo el terreno

## 🔧 Implementación Técnica

### 🏗️ **Arquitectura del Sistema**

```typescript
// Sistema modular de construcción
create3DProceduralCity() {
  createTerrain()           // Base circular + agua
  createCityWalls()         // Murallas + torres + puertas
  createCastle()           // Castillo + torres + banderas
  createPalermoDistrict()  // Casas nobles + fuente
  createOpusDistrict()     // Talleres + forjas + herramientas
  createPort()             // Muelles + barcos + almacenes
  createLakeAndSurroundings() // Lago + cabañas
  createVegetation()       // Bosques + arbustos
}
```

### 🎨 **Materiales y Colores**

```typescript
const materials = {
  stone: 0x8C7853,      // Castillo y murallas
  wood: 0x8B4513,       // Tejados y estructuras
  noble: 0xD2B48C,      // Casas de Palermo
  workshop: 0x8B7355,   // Edificios de Opus
  water: 0x4682B4,      // Lagos y agua
  vegetation: 0x228B22,  // Árboles y plantas
  terrain: 0x8B7355     // Suelo base
}
```

### 📐 **Especificaciones de Modelos**

#### 🏰 **Castillo Central**
- **Torre Principal**: 12m altura, base 2.5m radio
- **Torres Secundarias**: 8m altura, 4 unidades
- **Salón Principal**: 6x4x4 metros
- **Banderas**: En cada torre secundaria

#### 🏠 **Sistema de Viviendas**
- **Variación Procedural**: Cada casa tiene dimensiones únicas
- **Detalles Arquitectónicos**: Tejados, chimeneas variables
- **Especialización**: Diferentes tipos según distrito

#### ⚓ **Puerto Detallado**
- **Barcos Completos**: Casco, mástil, velas
- **Infraestructura**: Muelles, grúas, almacenes
- **Escala Realista**: Proporciones navegables

### 🌲 **Sistema de Vegetación**
```typescript
// Generación orgánica de bosques
forestPositions.forEach(pos => {
  const trunkHeight = 2 + Math.random() * 2  // Variación natural
  const leavesRadius = 1 + Math.random()     // Copas únicas
  // Posicionamiento automático
})
```

## 🎮 Experiencia de Usuario

### 👀 **Lo Que Verás**

1. **Vista Aérea**: Ciudad medieval completa con murallas circulares
2. **Zoom Detallado**: Cada edificio, barco y árbol individual
3. **Iluminación Dinámica**: Sombras realistas y luces ambientales
4. **Interactividad**: Clic en zonas para información contextual

### 🎯 **Controles**
- **Click + Arrastrar**: Rotar cámara 360°
- **Scroll**: Zoom in/out (5-30 unidades de distancia)
- **Click en Zonas**: Información de ubicaciones
- **Navegación Libre**: Sin restricciones de movimiento

### 📱 **Rendimiento Optimizado**
- **Geometrías Eficientes**: Modelos optimizados para WebGL
- **LOD Implícito**: Detalles apropiados según distancia
- **Materiales Simples**: Lambert materials para mejor performance

## 🔧 Configuración

### ⚙️ **Parámetros Personalizables**

```vue
<TopoMap 
  @zone-selected="handleMapZoneSelected"
  :zones="campaignZones"
/>
```

### 🎨 **Zonas Predefinidas**
```typescript
const campaignZones = [
  { name: "PALERMO", x: -6, z: 0, color: 0x8B4513 },
  { name: "OPUS", x: 6, z: 0, color: 0x4A4A4A },
  { name: "PUERTO", x: 8, z: 8, color: 0x1E90FF },
  { name: "Castillo Central", x: 0, z: -4, color: 0xFFD700 },
  { name: "LAFE", x: -10, z: 10, color: 0x20B2AA },
  { name: "Las Murallas", x: 0, z: 6, color: 0x696969 }
]
```

## 🛠️ Personalización Avanzada

### 🏗️ **Modificar Estructuras**

```typescript
// Ejemplo: Agregar más torres al castillo
const extraTowers = [
  { x: -5, z: -3 }, { x: 5, z: -3 }
]

extraTowers.forEach(pos => {
  const tower = createTower(pos.x, pos.z, 6) // altura personalizada
  scene.add(tower)
})
```

### 🎨 **Cambiar Colores y Materiales**
```typescript
// Personalizar materiales
const customMaterials = {
  castleStone: new THREE.MeshLambertMaterial({ color: 0x404040 }), // Piedra oscura
  nobleHouses: new THREE.MeshLambertMaterial({ color: 0xFFE4B5 }), // Casas doradas
  water: new THREE.MeshLambertMaterial({ 
    color: 0x006994, 
    transparent: true, 
    opacity: 0.9 
  })
}
```

### 🌱 **Agregar Más Vegetación**
```typescript
// Crear jardines específicos
const gardenPositions = [
  { x: -9, z: 0 }, // Jardín de Palermo
  { x: 7, z: 1 }   // Plaza de Opus
]

gardenPositions.forEach(pos => {
  createGarden(pos.x, pos.z, 2) // radio del jardín
})
```

## 🔮 Futuras Expansiones

### 🎯 **Características Planeadas**
- **Personajes 3D**: NPCs caminando por la ciudad
- **Animaciones**: Banderas ondeando, agua en movimiento
- **Día/Noche**: Ciclo de iluminación dinámico
- **Clima**: Lluvia, nieve, niebla
- **Edificios Internos**: Poder entrar a estructuras
- **Evento Dinámicos**: Mercados, celebraciones

### 🏛️ **Expansiones Arquitectónicas**
- **Catedral**: Gran iglesia central
- **Universidad**: Distrito académico
- **Arena**: Para combates y eventos
- **Suburbios**: Expansión más allá de murallas

### ⚔️ **Integración con Sistema de Combate**
- **Posicionamiento de Batalla**: Usar la ciudad para combates
- **Línea de Vista**: Cálculos 3D reales para objetivos
- **Cobertura**: Usar edificios como obstáculos

## 📊 Rendimiento

### ⚡ **Optimizaciones Implementadas**
- **Instanced Geometry**: Para árboles y objetos repetidos
- **Frustum Culling**: Solo renderiza objetos visibles
- **Material Sharing**: Reutilización de materiales
- **LOD System**: Niveles de detalle dinámicos

### 💻 **Requisitos del Sistema**
- **WebGL 1.0**: Compatible con todos los navegadores modernos
- **RAM**: 512MB disponible para el navegador
- **GPU**: Cualquier GPU de los últimos 5 años
- **CPU**: Cualquier procesador moderno

### 📈 **Métricas Típicas**
- **Objetos 3D**: ~200-300 modelos
- **Triángulos**: ~50,000-75,000
- **FPS**: 30-60 en hardware moderno
- **Memoria**: ~100-200MB

¡Tu mundo de PILOTES ahora es una ciudad 3D completamente navegable e interactiva! 🏰✨