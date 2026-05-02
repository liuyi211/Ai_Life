const API_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 开始 API 联调测试...\n');

  // 测试1: 健康检查
  console.log('测试 1: 健康检查');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ 健康检查通过:', data);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    console.log('💡 请确保后端服务已启动: cd apps/api && npm run dev\n');
    return;
  }

  console.log('\n测试 2: 用户注册（数据库可能未连接）');
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user_' + Date.now(),
        password: 'test123',
      }),
    });
    const data = await response.json();
    
    if (response.status === 201) {
      console.log('✅ 注册成功:', data);
    } else if (response.status === 500) {
      console.log('⚠️  数据库未连接，注册失败');
      console.log('💡 请启动数据库:');
      console.log('   1. Docker: docker-compose up -d');
      console.log('   2. 然后运行: cd apps/api && npx prisma migrate dev\n');
    } else {
      console.log('⚠️  注册返回:', data);
    }
  } catch (error) {
    console.log('❌ 注册请求失败:', error.message);
  }

  console.log('\n测试 3: 用户登录（数据库可能未连接）');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user',
        password: 'test123',
      }),
    });
    const data = await response.json();
    console.log('登录响应:', response.status, data);
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
  }

  console.log('\n✨ 测试完成！');
  console.log('\n📋 下一步操作:');
  console.log('1. 启动数据库: docker-compose up -d');
  console.log('2. 运行迁移: cd apps/api && npx prisma migrate dev');
  console.log('3. 启动后端: cd apps/api && npm run dev');
  console.log('4. 启动前端: cd apps/web && npm run dev');
}

testAPI();
