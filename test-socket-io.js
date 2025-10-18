/**
 * Socket.IO Test Script
 * Tests the Socket.IO connection and basic events
 */

const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwicm9sZSI6ImRyaXZlciIsImlhdCI6MTcyOTI4MDAwMH0.test'; // Dummy token for testing

console.log('🧪 Socket.IO Test Suite\n');
console.log(`📍 Server URL: ${SERVER_URL}`);
console.log(`🔐 Using test token\n`);

// Test 1: Connection without authentication (should fail)
console.log('Test 1: Connection without authentication');
console.log('─'.repeat(50));

const socket1 = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 3,
  transports: ['websocket']
});

socket1.on('connect', () => {
  console.log('❌ FAILED: Connected without token (should have failed)');
  socket1.disconnect();
});

socket1.on('connect_error', (error) => {
  console.log('✅ PASSED: Connection rejected without token');
  console.log(`   Error: ${error.message}\n`);
  socket1.disconnect();
  
  // Move to Test 2 after a delay
  setTimeout(testWithAuthentication, 1000);
});

// Test 2: Connection with authentication
function testWithAuthentication() {
  console.log('Test 2: Connection with authentication');
  console.log('─'.repeat(50));

  const socket2 = io(SERVER_URL, {
    auth: {
      token: TEST_TOKEN
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 3,
    transports: ['websocket']
  });

  socket2.on('connect', () => {
    console.log('✅ PASSED: Connected with authentication');
    console.log(`   Socket ID: ${socket2.id}`);
    console.log(`   Connected: ${socket2.connected}\n`);

    // Test 3: Ping/Pong
    testPingPong(socket2);
  });

  socket2.on('connect_error', (error) => {
    console.log('❌ FAILED: Connection with token failed');
    console.log(`   Error: ${error.message}\n`);
    socket2.disconnect();
    process.exit(1);
  });
}

// Test 3: Ping/Pong
function testPingPong(socket) {
  console.log('Test 3: Ping/Pong');
  console.log('─'.repeat(50));

  socket.on('pong', () => {
    console.log('✅ PASSED: Received pong response');
    console.log('   Connection is healthy\n');
    
    // Test 4: Room operations
    testRoomOperations(socket);
  });

  socket.emit('ping');
  
  // Timeout if no pong received
  setTimeout(() => {
    console.log('❌ FAILED: No pong response received\n');
    socket.disconnect();
    process.exit(1);
  }, 5000);
}

// Test 4: Room operations
function testRoomOperations(socket) {
  console.log('Test 4: Room operations');
  console.log('─'.repeat(50));

  socket.on('joined_room', (room) => {
    console.log(`✅ PASSED: Joined room "${room}"`);
    
    socket.on('left_room', (leftRoom) => {
      console.log(`✅ PASSED: Left room "${leftRoom}"\n`);
      
      // All tests passed
      testComplete(socket);
    });

    socket.emit('leave_room', 'test-room');
  });

  socket.emit('join_room', 'test-room');
  
  // Timeout if no response
  setTimeout(() => {
    console.log('❌ FAILED: Room operation timeout\n');
    socket.disconnect();
    process.exit(1);
  }, 5000);
}

// Test complete
function testComplete(socket) {
  console.log('═'.repeat(50));
  console.log('✅ ALL TESTS PASSED!');
  console.log('═'.repeat(50));
  console.log('\n📊 Socket.IO Status:');
  console.log(`   ✓ Server is running on port 3000`);
  console.log(`   ✓ Authentication middleware is working`);
  console.log(`   ✓ Connection handling is functional`);
  console.log(`   ✓ Event emission is working`);
  console.log(`   ✓ Room operations are functional\n`);
  
  socket.disconnect();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

