# spring-boot-expert

## 定义
Spring Boot 3.x 专家 skill，专门处理 Spring Boot 后端开发相关任务。

## 适用场景
- Spring Boot 项目开发
- Spring Boot 3.x 新特性使用
- Spring Data JPA / MyBatis 操作
- Spring Security / JWT 认证
- Spring Cache (Redis) 集成
- RESTful API 设计
- Spring Boot 性能优化
- 常见问题排查

## 执行步骤
1. 分析需求，确定使用的 Spring Boot 版本和依赖
2. 遵循项目已有的技术规范：
   - Spring Boot 3.4.x
   - Java 17+
   - MySQL 8.0
   - Redis 7.x
   - JWT Token 认证
3. 提供符合 Spring Boot 最佳实践的代码
4. 建议添加单元测试

## 代码规范
- 使用 Lombok 减少样板代码
- 使用 Builder 模式创建复杂对象
- 使用 @Transactional 保证事务一致性
- 异常处理使用自定义异常 + GlobalExceptionHandler
- API 响应格式统一

## 常用命令
```bash
# 启动开发服务器
./mvnw spring-boot:run

# 构建打包
./mvnw clean package -DskipTests

# 运行测试
./mvnw test
```
