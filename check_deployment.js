// Simple script to check deployment status
const checkDeployment = async () => {
  try {
    const response = await fetch('https://full-ecom-web-156s.onrender.com/api/health');
    const data = await response.json();
    
    console.log('Health Check Response:', data);
    
    if (data.message.includes('Database-backed')) {
      console.log('✅ DEPLOYMENT COMPLETE! Database-backed server is running');
      return true;
    } else {
      console.log('⏳ Still deploying... Current:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking deployment:', error.message);
    return false;
  }
};

// Check every 30 seconds
const monitor = async () => {
  console.log('🔍 Monitoring deployment status...');
  
  const isComplete = await checkDeployment();
  
  if (!isComplete) {
    console.log('Checking again in 30 seconds...\n');
    setTimeout(monitor, 30000);
  } else {
    console.log('\n🎉 Ready to test the application!');
  }
};

monitor();