export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 设定系统时区，确保后台列表和 API 返回的时间一致
    const timeZone = env.TIMEZONE || 'Asia/Shanghai'; 

    // 1. 静态资源与页面路由交由 Pages 处理
    if (path.startsWith('/assets/') || path.endsWith('.html')) {
      return env.ASSETS.fetch(request);
    }

    // 2. 管理员登录接口 (通过环境变量验证)
    if (path === '/api/admin/login' && request.method === 'POST') {
      const { username, password } = await request.json();
      if (username === env.ADMIN_USER && password === env.ADMIN_PASS) {
        // 实际应用中建议生成并返回 JWT 或 Session Token
        return new Response(JSON.stringify({ success: true, token: "admin_authorized" }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: false, msg: "账号或密码错误" }), { status: 401 });
    }

    // 3. 管理员获取接口配置列表
    if (path === '/api/admin/configs' && request.method === 'GET') {
      // 此处应有鉴权逻辑验证 token
      const { results } = await env.db.prepare("SELECT * FROM api_configs").all();
      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. 用户接码核心逻辑 (对接第三方API)
    if (path === '/api/user/get_phone' && request.method === 'POST') {
      // a. 验证用户 Token 及余额
      // b. 从 db 查询 is_active = 1 的 api_configs
      // c. 向第三方接口发起 fetch 请求获取手机号
      // d. 将获取到的手机号写入 sms_orders 表
      // e. 返回当前系统时区的时间与手机号
      
      const currentTime = new Date().toLocaleString('zh-CN', { timeZone });
      return new Response(JSON.stringify({ 
          success: true, 
          phone: "13800138000", 
          time: currentTime 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 默认返回主页或让 Pages 继续处理
    return env.ASSETS.fetch(request);
  }
};
