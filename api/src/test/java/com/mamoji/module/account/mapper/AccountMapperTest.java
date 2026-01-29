package com.mamoji.module.account.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.account.entity.FinAccount;

/** Account Mapper Integration Tests */
class AccountMapperTest extends MySqlIntegrationTestBase {

    @Autowired private FinAccountMapper accountMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        accountMapper.delete(
                new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
    }

    @AfterEach
    void tearDown() {
        accountMapper.delete(
                new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
    }

    @Test
    @DisplayName("Insert account should persist and return generated ID")
    void insert_ShouldPersistAndReturnGeneratedId() {
        FinAccount account =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Test Account")
                        .accountType("bank")
                        .balance(new BigDecimal("5000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();

        int result = accountMapper.insert(account);

        assertThat(result).isGreaterThan(0);
        assertThat(account.getAccountId()).isNotNull();
    }

    @Test
    @DisplayName("Select by ID should return account when exists")
    void selectById_ShouldReturnAccountWhenExists() {
        FinAccount account =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Find Me Account")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(account);

        FinAccount found = accountMapper.selectById(account.getAccountId());

        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("Find Me Account");
    }

    @Test
    @DisplayName("Select by ID should return null when not exists")
    void selectById_ShouldReturnNullWhenNotExists() {
        FinAccount found = accountMapper.selectById(99999L);
        assertThat(found).isNull();
    }

    @Test
    @DisplayName("Select list with user filter should return only user's accounts")
    void selectList_WithUserFilter_ShouldReturnOnlyUserAccounts() {
        // Insert accounts for different users
        FinAccount userAccount =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("User Account")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(userAccount);

        FinAccount otherAccount =
                FinAccount.builder()
                        .userId(testUserId + 1)
                        .name("Other User Account")
                        .accountType("bank")
                        .balance(new BigDecimal("2000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(otherAccount);

        // Query for specific user
        List<FinAccount> results =
                accountMapper.selectList(
                        new LambdaQueryWrapper<FinAccount>().eq(FinAccount::getUserId, testUserId));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("User Account");
    }

    @Test
    @DisplayName("Select list with status filter should return only active accounts")
    void selectList_WithStatusFilter_ShouldReturnOnlyActiveAccounts() {
        FinAccount activeAccount =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Active Account")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(activeAccount);

        FinAccount deletedAccount =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Deleted Account")
                        .accountType("bank")
                        .balance(new BigDecimal("500.00"))
                        .currency("CNY")
                        .status(0)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(deletedAccount);

        List<FinAccount> activeResults =
                accountMapper.selectList(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, testUserId)
                                .eq(FinAccount::getStatus, 1));

        assertThat(activeResults).hasSize(1);
        assertThat(activeResults.get(0).getName()).isEqualTo("Active Account");
    }

    @Test
    @DisplayName("Update by ID should modify existing account")
    void updateById_ShouldModifyExistingAccount() {
        FinAccount account =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Original Name")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(account);

        account.setName("Updated Name");
        account.setBalance(new BigDecimal("2000.00"));
        int result = accountMapper.updateById(account);

        assertThat(result).isGreaterThan(0);

        FinAccount updated = accountMapper.selectById(account.getAccountId());
        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getBalance()).isEqualByComparingTo("2000.00");
    }

    @Test
    @DisplayName("Delete by ID should remove account")
    void deleteById_ShouldRemoveAccount() {
        FinAccount account =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("To Delete")
                        .accountType("bank")
                        .balance(new BigDecimal("100.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(account);

        int result = accountMapper.deleteById(account.getAccountId());

        assertThat(result).isGreaterThan(0);

        FinAccount deleted = accountMapper.selectById(account.getAccountId());
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("Select count should return correct count")
    void selectCount_ShouldReturnCorrectCount() {
        FinAccount account1 =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Account 1")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(account1);

        FinAccount account2 =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Account 2")
                        .accountType("bank")
                        .balance(new BigDecimal("2000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(account2);

        Long count =
                accountMapper.selectCount(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, testUserId)
                                .eq(FinAccount::getStatus, 1));

        assertThat(count).isEqualTo(2L);
    }

    @Test
    @DisplayName("Select with includeInTotal filter should work correctly")
    void selectList_WithIncludeInTotalFilter_ShouldWorkCorrectly() {
        FinAccount included =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Included Account")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(included);

        FinAccount excluded =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Excluded Account")
                        .accountType("bank")
                        .balance(new BigDecimal("500.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(0)
                        .build();
        accountMapper.insert(excluded);

        List<FinAccount> includedResults =
                accountMapper.selectList(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, testUserId)
                                .eq(FinAccount::getStatus, 1)
                                .eq(FinAccount::getIncludeInTotal, 1));

        assertThat(includedResults).hasSize(1);
        assertThat(includedResults.get(0).getName()).isEqualTo("Included Account");
    }

    @Test
    @DisplayName("Select with account type filter should return only matching types")
    void selectList_WithAccountTypeFilter_ShouldReturnOnlyMatchingTypes() {
        FinAccount bankAccount =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Bank Account")
                        .accountType("bank")
                        .balance(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(bankAccount);

        FinAccount cashAccount =
                FinAccount.builder()
                        .userId(testUserId)
                        .name("Cash Account")
                        .accountType("cash")
                        .balance(new BigDecimal("500.00"))
                        .currency("CNY")
                        .status(1)
                        .includeInTotal(1)
                        .build();
        accountMapper.insert(cashAccount);

        List<FinAccount> bankResults =
                accountMapper.selectList(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, testUserId)
                                .eq(FinAccount::getAccountType, "bank"));

        assertThat(bankResults).hasSize(1);
        assertThat(bankResults.get(0).getName()).isEqualTo("Bank Account");
    }
}
