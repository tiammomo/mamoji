package com.mamoji.module.auth.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.auth.entity.SysUser;

/** User Mapper Integration Tests */
class UserMapperTest extends MySqlIntegrationTestBase {

    @Autowired private SysUserMapper userMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        userMapper.delete(new LambdaQueryWrapper<SysUser>().isNotNull(SysUser::getUserId));
    }

    @AfterEach
    void tearDown() {
        userMapper.delete(new LambdaQueryWrapper<SysUser>().isNotNull(SysUser::getUserId));
    }

    @Test
    @DisplayName("Insert user should persist and return generated ID")
    void insert_ShouldPersistAndReturnGeneratedId() {
        SysUser user =
                SysUser.builder()
                        .username("testuser")
                        .password("hashedpassword")
                        .phone("13800138000")
                        .email("test@example.com")
                        .role("normal")
                        .status(1)
                        .build();

        int result = userMapper.insert(user);

        assertThat(result).isGreaterThan(0);
        assertThat(user.getUserId()).isNotNull();
    }

    @Test
    @DisplayName("Select by ID should return user when exists")
    void selectById_ShouldReturnUserWhenExists() {
        SysUser user =
                SysUser.builder().username("findme").password("hashedpassword").status(1).build();
        userMapper.insert(user);

        SysUser found = userMapper.selectById(user.getUserId());

        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo("findme");
    }

    @Test
    @DisplayName("Select by username should return user")
    void selectByUsername_ShouldReturnUser() {
        SysUser user =
                SysUser.builder()
                        .username("uniqueuser")
                        .password("hashedpassword")
                        .status(1)
                        .build();
        userMapper.insert(user);

        SysUser found =
                userMapper.selectOne(
                        new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, "uniqueuser"));

        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo("uniqueuser");
    }

    @Test
    @DisplayName("Select with status filter should return only active users")
    void selectList_WithStatusFilter_ShouldReturnOnlyActiveUsers() {
        SysUser activeUser =
                SysUser.builder()
                        .username("activeuser")
                        .password("hashedpassword")
                        .status(1)
                        .build();
        userMapper.insert(activeUser);

        SysUser disabledUser =
                SysUser.builder()
                        .username("disableduser")
                        .password("hashedpassword")
                        .status(0)
                        .build();
        userMapper.insert(disabledUser);

        List<SysUser> activeUsers =
                userMapper.selectList(new LambdaQueryWrapper<SysUser>().eq(SysUser::getStatus, 1));

        assertThat(activeUsers).hasSize(1);
        assertThat(activeUsers.get(0).getUsername()).isEqualTo("activeuser");
    }

    @Test
    @DisplayName("Update by ID should modify existing user")
    void updateById_ShouldModifyExistingUser() {
        SysUser user =
                SysUser.builder().username("original").password("oldpassword").status(1).build();
        userMapper.insert(user);

        user.setUsername("updated");
        user.setPhone("13900139000");
        int result = userMapper.updateById(user);

        assertThat(result).isGreaterThan(0);

        SysUser updated = userMapper.selectById(user.getUserId());
        assertThat(updated.getUsername()).isEqualTo("updated");
        assertThat(updated.getPhone()).isEqualTo("13900139000");
    }

    @Test
    @DisplayName("Delete by ID should remove user")
    void deleteById_ShouldRemoveUser() {
        SysUser user =
                SysUser.builder().username("todelete").password("hashedpassword").status(1).build();
        userMapper.insert(user);

        int result = userMapper.deleteById(user.getUserId());

        assertThat(result).isGreaterThan(0);

        SysUser deleted = userMapper.selectById(user.getUserId());
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("Select count should return correct count")
    void selectCount_ShouldReturnCorrectCount() {
        for (int i = 1; i <= 4; i++) {
            SysUser user =
                    SysUser.builder().username("user" + i).password("password").status(1).build();
            userMapper.insert(user);
        }

        Long count =
                userMapper.selectCount(new LambdaQueryWrapper<SysUser>().eq(SysUser::getStatus, 1));

        assertThat(count).isEqualTo(4L);
    }

    @Test
    @DisplayName("Username exists check should work correctly")
    void usernameExists_ShouldWorkCorrectly() {
        SysUser user =
                SysUser.builder().username("existinguser").password("password").status(1).build();
        userMapper.insert(user);

        SysUser existing =
                userMapper.selectOne(
                        new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, "existinguser"));

        assertThat(existing).isNotNull();

        SysUser nonExisting =
                userMapper.selectOne(
                        new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, "nonexisting"));

        assertThat(nonExisting).isNull();
    }
}
