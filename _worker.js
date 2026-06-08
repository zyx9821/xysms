// 辅助函数：从 D1 数据库获取配置值
async function getSystemSetting(db, key, defaultValue) {
  try {
    const result = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(key).first();
    return result ? result.value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 确保 D1 数据库已绑定
    if (!env.db) {
      return new Response("Database binding 'db' is missing.", { status: 500 });
    }

    if (path === '/' || path === '/index.html') {
      // 302 临时重定向到用户登录页面
      return Response.redirect(`${url.origin}/user/login.html`, 302);
    }

    // 静态资源与页面路由交由 Pages 处理
    if (path.startsWith('/assets/') || path.endsWith('.html')) {
      return env.ASSETS.fetch(request);
    }

    // ==================== 管理员权限与登录 ====================
    
    // 1. 管理员登录接口（从 D1 数据库实时读取账号密码）
    if (path === '/api/admin/login' && request.method === 'POST') {
      const { username, password } = await request.json();
      
      const dbUser = await getSystemSetting(env.db, 'ADMIN_USER', 'admin');
      const dbPass = await getSystemSetting(env.db, 'ADMIN_PASS', 'admin123');

      if (username === dbUser && password === dbPass) {
        // 返回成功状态（此处可扩展 Session 或 Token 机制）
        return new Response(JSON.stringify({ success: true, token: "admin_authorized" }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: false, msg: "账号或密码错误" }), { status: 401 });
    }

    // 2. 获取系统配置（用于后台配置页面回显）
    if (path === '/api/admin/settings' && request.method === 'GET') {
      const { results } = await env.db.prepare("SELECT key, value FROM system_settings").all();
      // 转换成对象格式方便前端使用
      const settings = {};
      results.forEach(row => { settings[row.key] = row.value; });
      
      return new Response(JSON.stringify({ success: true, data: settings }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. 修改系统配置（在后台提交修改）
    if (path === '/api/admin/settings' && request.method === 'POST') {
      const { ADMIN_USER, ADMIN_PASS, TIMEZONE } = await request.json();
      
      // 使用事务或批量执行更新数据库
      await env.db.batch([
        env.db.prepare("UPDATE system_settings SET value = ? WHERE key = 'ADMIN_USER'").bind(ADMIN_USER),
        env.db.prepare("UPDATE system_settings SET value = ? WHERE key = 'ADMIN_PASS'").bind(ADMIN_PASS),
        env.db.prepare("UPDATE system_settings SET value = ? WHERE key = 'TIMEZONE'").bind(TIMEZONE)
      ]);

      return new Response(JSON.stringify({ success: true, msg: "系统配置更新成功" }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ==================== 接码与时区处理 ====================

    // 4. 用户接码核心逻辑示例
    if (path === '/api/user/get_phone' && request.method === 'POST') {
      // 从 D1 数据库动态获取时区设置，确保输出时间与系统设置完全同步
      const timeZone = await getSystemSetting(env.db, 'TIMEZONE', 'Asia/Shanghai');
      const currentTime = new Date().toLocaleString('zh-CN', { timeZone });
      
      // 执行接码并记录到 sms_orders 的业务逻辑...
      
      return new Response(JSON.stringify({ 
          success: true, 
          phone: "13800138000", 
          time: currentTime 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return env.ASSETS.fetch(request);
  }
};
