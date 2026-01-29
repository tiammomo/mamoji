package com.mamoji.config;

import java.time.LocalDateTime;

import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.BlockAttackInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;

/** MyBatis-Plus Configuration */
@Configuration
public class MybatisPlusConfig {

    /** Configure MyBatis-Plus plugins/interceptors */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // Pagination interceptor for MySQL
        PaginationInnerInterceptor paginationInterceptor =
                new PaginationInnerInterceptor(DbType.MYSQL);
        paginationInterceptor.setMaxLimit(500L); // Maximum limit per page
        paginationInterceptor.setOverflow(true); // Handle overflow
        interceptor.addInnerInterceptor(paginationInterceptor);

        // Optimistic locker interceptor
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());

        // Block attack interceptor (prevent malicious full table deletion)
        interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());

        return interceptor;
    }

    /** Custom meta object handler for auto-filling fields */
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                this.strictInsertFill(
                        metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
                this.strictInsertFill(
                        metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                this.strictUpdateFill(
                        metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }
        };
    }
}
