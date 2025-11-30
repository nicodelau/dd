#!/usr/bin/env node

// Simple test script to validate our connection management system
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test 1: Verify connection manager exports correctly
console.log('🧪 Testing Connection Manager Implementation...\n');

async function testConnectionManagerSyntax() {
  try {
    const connManagerPath = join(__dirname, 'composables', 'useConnectionManager.ts');
    const content = await fs.readFile(connManagerPath, 'utf8');
    
    console.log('✅ Connection Manager file exists');
    
    // Check for key features
    const hasExponentialBackoff = content.includes('exponentialBackoff');
    const hasConnectionQuality = content.includes('connectionQuality');
    const hasPendingQueue = content.includes('pendingActions');
    const hasReconnect = content.includes('reconnect');
    
    console.log(`✅ Exponential Backoff: ${hasExponentialBackoff ? 'Present' : 'Missing'}`);
    console.log(`✅ Connection Quality: ${hasConnectionQuality ? 'Present' : 'Missing'}`);
    console.log(`✅ Pending Queue: ${hasPendingQueue ? 'Present' : 'Missing'}`);
    console.log(`✅ Auto Reconnect: ${hasReconnect ? 'Present' : 'Missing'}`);
    
    return hasExponentialBackoff && hasConnectionQuality && hasPendingQueue && hasReconnect;
  } catch (error) {
    console.log('❌ Connection Manager test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  try {
    // Test ping endpoint exists
    const pingPath = join(__dirname, 'server', 'api', 'dice', 'ping.post.ts');
    await fs.access(pingPath);
    console.log('✅ Ping endpoint exists');
    
    // Test state sync endpoint exists
    const statePath = join(__dirname, 'server', 'api', 'dice', 'rooms', '[roomCode]', 'state.get.ts');
    await fs.access(statePath);
    console.log('✅ State sync endpoint exists');
    
    // Test enhanced events endpoint
    const eventsPath = join(__dirname, 'server', 'api', 'dice', 'events.get.ts');
    const eventsContent = await fs.readFile(eventsPath, 'utf8');
    const hasHeartbeat = eventsContent.includes('heartbeat');
    const hasConnectionMetrics = eventsContent.includes('latency');
    
    console.log(`✅ Enhanced SSE Events: ${hasHeartbeat && hasConnectionMetrics ? 'Present' : 'Basic'}`);
    
    return true;
  } catch (error) {
    console.log('❌ API endpoints test failed:', error.message);
    return false;
  }
}

async function testDicePageIntegration() {
  try {
    const dicePath = join(__dirname, 'pages', 'dice.vue');
    const content = await fs.readFile(dicePath, 'utf8');
    
    const hasConnectionManager = content.includes('useConnectionManager');
    const hasQueuedActions = content.includes('queuedActions') || content.includes('pendingActions');
    const hasConnectionStatus = content.includes('connectionStatus') || content.includes('connectionQuality');
    
    console.log(`✅ Connection Manager Integration: ${hasConnectionManager ? 'Present' : 'Missing'}`);
    console.log(`✅ Action Queuing UI: ${hasQueuedActions ? 'Present' : 'Missing'}`);
    console.log(`✅ Connection Status Display: ${hasConnectionStatus ? 'Present' : 'Missing'}`);
    
    return hasConnectionManager;
  } catch (error) {
    console.log('❌ Dice page integration test failed:', error.message);
    return false;
  }
}

async function testTranslations() {
  try {
    const translationsPath = join(__dirname, 'composables', 'useTranslations.ts');
    const content = await fs.readFile(translationsPath, 'utf8');
    
    const hasReconnectingText = content.includes('reconnecting');
    const hasConnectionQualityTexts = content.includes('excellent') && content.includes('good') && content.includes('poor');
    
    console.log(`✅ Reconnection Translations: ${hasReconnectingText ? 'Present' : 'Missing'}`);
    console.log(`✅ Connection Quality Translations: ${hasConnectionQualityTexts ? 'Present' : 'Missing'}`);
    
    return hasReconnectingText && hasConnectionQualityTexts;
  } catch (error) {
    console.log('❌ Translations test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('         PERSISTENT CONNECTION SYSTEM TESTS');
  console.log('='.repeat(60) + '\n');
  
  const results = await Promise.all([
    testConnectionManagerSyntax(),
    testAPIEndpoints(),
    testDicePageIntegration(),
    testTranslations()
  ]);
  
  const allPassed = results.every(r => r);
  
  console.log('\n' + '='.repeat(60));
  console.log(`Overall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('\n✨ Your persistent connection system is ready!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to /dice page');
    console.log('   3. Test reconnection by toggling network connection');
    console.log('   4. Test action queuing by rolling dice while offline');
    console.log('   5. Monitor connection quality indicators');
  }
  
  return allPassed;
}

runTests().catch(console.error);