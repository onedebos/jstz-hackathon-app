// Quick test script to verify Strapi connection
// Run with: node test-strapi.js

require('dotenv').config({ path: '.env.local' });

const STRAPI_URL = process.env.STRAPI_URL;

if (!STRAPI_URL) {
  console.error('❌ STRAPI_URL not found in .env.local');
  process.exit(1);
}

console.log('🔍 Testing Strapi connection...');
console.log('📍 URL:', STRAPI_URL);

// Try different query formats
const baseUrl = STRAPI_URL.replace(/\/$/, ''); // Remove trailing slash

// Test 1: Simple query without populate
const testUrl1 = `${baseUrl}/api/hackathons?filters[is_current][$eq]=true`;

// Test 2: With populate using different syntax
const testUrl2 = `${baseUrl}/api/hackathons?filters[is_current][$eq]=true&populate=*`;

// Test 3: With nested populate (original)
const testUrl3 = `${baseUrl}/api/hackathons?filters[is_current][$eq]=true&populate[schedule_items][populate]=*`;

console.log('Test 1: Simple query (no populate)');
console.log('Test 2: Populate all');
console.log('Test 3: Nested populate (original)\n');

// Try simple query first
console.log('🔍 Test 1: Fetching without populate...');
fetch(testUrl1)
  .then(async (res) => {
    console.log('📡 Response Status:', res.status, res.statusText);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Error:', text);
      console.log('\n🔄 Trying Test 2 (populate=*)...');
      return fetch(testUrl2);
    }
    
    const data = await res.json();
    console.log('\n✅ Test 1 Success!');
    
    if (data.data && data.data.length > 0) {
      const hackathon = data.data[0];
      console.log('🎉 Found hackathon:', hackathon.title || hackathon.attributes?.title || 'Untitled');
      console.log('📋 Available fields:', Object.keys(hackathon.attributes || hackathon).join(', '));
      
      // Now try to get schedule items
      console.log('\n🔄 Trying Test 2 (populate=*)...');
      return fetch(testUrl2);
    } else {
      console.log('\n⚠️  No current hackathon found (is_current=true)');
      console.log('💡 Make sure you have a hackathon with is_current=true in Strapi');
    }
  })
  .then(async (res) => {
    if (!res) return;
    
    console.log('📡 Response Status (Test 2):', res.status, res.statusText);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Error:', text);
      return;
    }
    
    const data = await res.json();
    console.log('\n✅ Test 2 Success!');
    
    if (data.data && data.data.length > 0) {
      const hackathon = data.data[0];
      const attrs = hackathon.attributes || hackathon;
      console.log('📋 Hackathon data structure:');
      console.log(JSON.stringify(attrs, null, 2).substring(0, 500) + '...');
      
      // Check for schedule items
      if (attrs.schedule_items || attrs.scheduleItems) {
        const items = attrs.schedule_items?.data || attrs.scheduleItems || [];
        console.log(`\n📅 Found ${items.length} schedule items!`);
      } else {
        console.log('\n⚠️  No schedule_items found. Check the relation name in Strapi.');
      }
    }
  })
  .catch(async (error) => {
    console.error('\n❌ Fetch error with unencoded URL:', error.message);
    
    // Try encoded URL as fallback
    console.log('\n🔄 Trying URL-encoded format...');
    try {
      const res2 = await fetch(testUrl2);
      console.log('📡 Response Status (encoded):', res2.status, res2.statusText);
      
      if (!res2.ok) {
        const text = await res2.text();
        console.error('❌ Error response:', text);
        return;
      }
      
      const data = await res2.json();
      console.log('\n✅ Success with encoded URL! Response data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data && data.data.length > 0) {
        console.log('\n🎉 Found hackathon:', data.data[0].title || 'Untitled');
      }
    } catch (error2) {
      console.error('❌ Both URL formats failed:', error2.message);
      if (error.code === 'ENOTFOUND') {
        console.error('   → DNS lookup failed. Check if the URL is correct.');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('   → Connection refused. Is Strapi running?');
      }
    }
  });

