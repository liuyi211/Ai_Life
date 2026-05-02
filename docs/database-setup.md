# 数据库配置指南

## 方案一：本地开发（Docker - 推荐）

### 1. 启动数据库

确保已安装 Docker，然后在项目根目录运行：

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL 15 (端口: 5432)
- Redis 7 (端口: 6379)

### 2. 运行数据库迁移

```bash
cd apps/api
npx prisma migrate dev
```

### 3. 查看数据库

```bash
npx prisma studio
```

访问 http://localhost:5555 查看和编辑数据

### 4. 停止数据库

```bash
docker-compose down
```

## 方案二：Neon PostgreSQL（生产环境）

### 1. 注册 Neon

访问 https://neon.tech 注册账号

### 2. 创建项目

- 创建新项目
- 选择 PostgreSQL 15
- 选择最接近用户的区域（如 Singapore）

### 3. 获取连接字符串

在 Dashboard 中：
1. 点击 "Connection Details"
2. 选择 "Prisma" 格式
3. 复制连接字符串

### 4. 配置环境变量

修改 `apps/api/.env`：

```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/life_echo?sslmode=require"
```

### 5. 运行迁移

```bash
cd apps/api
npx prisma migrate deploy
```

## 方案三：本地安装 PostgreSQL

### Windows

1. 下载安装程序：https://www.postgresql.org/download/windows/
2. 安装时设置密码为 `life_echo_dev`
3. 创建数据库：`life_echo`
4. 修改 `.env` 中的连接字符串

### macOS

```bash
brew install postgresql@15
brew services start postgresql@15
createdb life_echo
```

### Linux

```bash
sudo apt-get install postgresql-15
sudo service postgresql start
sudo -u postgres createdb life_echo
sudo -u postgres psql -c "CREATE USER life_echo WITH PASSWORD 'life_echo_dev';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE life_echo TO life_echo;"
```

## 数据库重置

如果需要清空数据重新来过：

```bash
# Docker 方式
docker-compose down -v
docker-compose up -d

cd apps/api
npx prisma migrate reset
```

## 常见问题

### P1001: Can't reach database server

数据库未运行，请检查：
- Docker 是否已启动：`docker ps`
- 端口是否被占用：`netstat -an | findstr 5432`
- 连接字符串是否正确

### P3018: Migration already applied

迁移已存在但需要重置：
```bash
npx prisma migrate reset
```

## 生产环境部署

部署到生产环境前：

1. 使用 `npx prisma migrate deploy`（非 dev）
2. 确保数据库连接使用 SSL
3. 定期备份数据库
4. 监控数据库性能
