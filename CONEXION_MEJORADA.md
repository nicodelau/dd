# 🔧 Solución a Desconexiones después de 5 minutos

## 🚨 Problema Identificado
Los jugadores se desconectaban sistemáticamente después de 5 minutos, perdiendo el estado de la sala y las tiradas de dados.

## 🔍 Diagnóstico
El problema se debía a varios factores combinados:

1. **Heartbeat insuficiente**: 30 segundos era muy lento para proxies/CDNs
2. **Sin reconexión automática**: Los errores SSE simplemente activaban modo offline
3. **Timeouts de servidor por defecto**: Muchos servidores/proxies tienen timeout de 5 minutos
4. **Headers SSE básicos**: Faltaban headers para prevenir buffering de proxies
5. **Sin detección de desconexiones silenciosas**: No había monitoreo activo del heartbeat

## ✅ Soluciones Implementadas

### 1. **Heartbeat Mejorado** (`server/api/dice/events.get.ts`)
```typescript
// Reducido de 30s a 15s para prevenir timeouts de proxy
setInterval(() => {
  response.write(`event: heartbeat\ndata: ${JSON.stringify({
    timestamp: new Date().toISOString(),
    userCount: diceRoomStore.getUserCount(roomCode),
    connectionId,
    uptime: Date.now() - parseInt(connectionId.split('_')[1])
  })}\n\n`)
}, 15000) // ⚡ 15 segundos (antes 30s)
```

### 2. **Headers SSE Robustos**
```typescript
// Headers mejorados para prevenir timeouts de proxy
setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
setHeader(event, 'X-Accel-Buffering', 'no') // Deshabilita buffering de nginx
setHeader(event, 'Transfer-Encoding', 'chunked')

// Configuración de keep-alive a nivel de socket
if (event.node.req.socket) {
  event.node.req.socket.setKeepAlive(true, 30000) // 30s keep-alive
  event.node.req.socket.setTimeout(0) // Deshabilita timeout de socket
}
```

### 3. **Reconexión Automática con Backoff Exponencial** (`pages/dice.vue`)
```typescript
// Variables de estado de reconexión
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const isReconnecting = ref(false)

// Lógica de reconexión automática
eventSource.value.onerror = (error) => {
  if (reconnectAttempts.value < maxReconnectAttempts) {
    isReconnecting.value = true
    reconnectAttempts.value++
    
    // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value - 1), 16000)
    
    setTimeout(() => {
      disconnectSSE()
      setTimeout(() => initializeSSE(roomCode), 100)
    }, delay)
  }
}
```

### 4. **Detección de Desconexiones Silenciosas**
```typescript
// Monitor de heartbeat para detectar desconexiones silenciosas
const lastHeartbeat = ref<Date | null>(null)
const heartbeatTimeout = ref<NodeJS.Timeout | null>(null)
const heartbeatToleranceMs = 45000 // 3x intervalo del servidor

eventSource.value.addEventListener('heartbeat', (event) => {
  lastHeartbeat.value = new Date()
  
  // Reset timeout monitor
  if (heartbeatTimeout.value) clearTimeout(heartbeatTimeout.value)
  
  // Configurar timeout para detectar desconexión silenciosa
  heartbeatTimeout.value = setTimeout(() => {
    if (isConnected.value && !isReconnecting.value) {
      // Forzar reconexión si no hay heartbeat
      eventSource.value.dispatchEvent(new Event('error'))
    }
  }, heartbeatToleranceMs)
})
```

### 5. **UI Mejorada de Estado de Conexión**
```vue
<template>
  <div class="flex items-center space-x-2">
    <div class="h-3 w-3 rounded-full"
      :class="{
        'bg-green-500': isConnected,
        'bg-yellow-500': isOfflineMode,
        'bg-orange-500 animate-pulse': isReconnecting, ⚡ NUEVO
        'bg-red-500': !isConnected && !isOfflineMode && !isReconnecting
      }"></div>
    <span class="text-sm">
      <template v-if="isReconnecting">
        {{ t('reconnecting') }} ({{ reconnectAttempts }}/{{ maxReconnectAttempts }}) ⚡ NUEVO
      </template>
      <template v-else>
        {{ isConnected ? t('connected') : isOfflineMode ? t('offlineMode') : t('disconnected') }}
      </template>
    </span>
  </div>
</template>
```

### 6. **Configuración de Nitro Mejorada** (`nuxt.config.ts`)
```typescript
nitro: {
  routeRules: {
    '/api/dice/events': {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Accel-Buffering': 'no' // Previene buffering de proxies
      }
    }
  }
}
```

## 🎯 Resultado Esperado

Con estas mejoras implementadas:

1. ✅ **Heartbeat más frecuente** (15s vs 30s) previene timeouts de proxy
2. ✅ **Reconexión automática** con hasta 5 intentos y backoff exponencial
3. ✅ **Detección de desconexiones silenciosas** mediante monitoreo de heartbeat
4. ✅ **Headers robustos** que previenen buffering de proxies/CDNs
5. ✅ **UI informativa** que muestra el estado exacto de reconexión
6. ✅ **Configuración de socket mejorada** para mantener conexiones vivas

## 🧪 Próximos Pasos para Validar

1. **Probar en desarrollo**: Arrancar `npm run dev` y monitorear conexiones
2. **Simular desconexiones**: Deshabilitar/habilitar WiFi para probar reconexión
3. **Observar logs del cliente**: Ver intentos de reconexión en consola del navegador
4. **Monitorear después de 5+ minutos**: Verificar que ya no hay desconexiones automáticas
5. **Probar en producción**: Validar que funciona con proxies/CDNs reales

## 📊 Métricas de Éxito

- ❌ **Antes**: Desconexión garantizada a los 5 minutos
- ✅ **Ahora**: Conexión persistente con reconexión automática ante fallos
- 🎯 **Objetivo**: 0% de desconexiones permanentes, 100% de recuperación automática

---

> **Nota**: Estas mejoras mantienen 100% de compatibilidad hacia atrás. El sistema funciona igual que antes, pero ahora es resistente a fallos de red y timeouts de servidor.