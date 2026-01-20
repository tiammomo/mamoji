package com.mamoji.module.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AccountService Integration Tests
 */
class AccountServiceIntegrationTest extends MySqlIntegrationTestBase {

    @Autowired
    private AccountService accountService;

    @Autowired
    private FinAccountMapper accountMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        // Clean up test data using wrapper with always true condition
        accountMapper.delete(new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
    }

    @AfterEach
    void tearDown() {
        // Clean up after each test
        accountMapper.delete(new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
    }

    @Test
    @DisplayName("Create account should persist and return id")
    void createAccount_ShouldPersistAndReturnId() {
        // Given
        AccountDTO dto = AccountDTO.builder()
                .name("Test Bank Account")
                .accountType("bank")
                .accountSubType("bank_primary")
                .currency("CNY")
                .balance(new BigDecimal("10000.00"))
                .includeInTotal(1)
                .build();

        // When
        Long accountId = accountService.createAccount(testUserId, dto);

        // Then
        assertThat(accountId).isNotNull();

        FinAccount saved = accountMapper.selectById(accountId);
        assertThat(saved).isNotNull();
        assertThat(saved.getName()).isEqualTo("Test Bank Account");
        assertThat(saved.getAccountType()).isEqualTo("bank");
        assertThat(saved.getUserId()).isEqualTo(testUserId);
        assertThat(saved.getStatus()).isEqualTo(1);
    }

    @Test
    @DisplayName("List accounts should return only user's accounts")
    void listAccounts_ShouldReturnOnlyUserAccounts() {
        // Given
        FinAccount account1 = FinAccount.builder()
                .userId(testUserId)
                .name("User Account 1")
                .accountType("bank")
                .balance(new BigDecimal("5000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account1);

        FinAccount account2 = FinAccount.builder()
                .userId(testUserId + 1)
                .name("Other User Account")
                .accountType("bank")
                .balance(new BigDecimal("3000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account2);

        // When
        List<AccountVO> result = accountService.listAccounts(testUserId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("User Account 1");
    }

    @Test
    @DisplayName("Get account should return VO when exists")
    void getAccount_ShouldReturnVOWhenExists() {
        // Given
        FinAccount account = FinAccount.builder()
                .userId(testUserId)
                .name("My Account")
                .accountType("bank")
                .balance(new BigDecimal("10000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account);

        // When
        AccountVO result = accountService.getAccount(testUserId, account.getAccountId());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("My Account");
    }

    @Test
    @DisplayName("Update account should modify existing record")
    void updateAccount_ShouldModifyExistingRecord() {
        // Given
        FinAccount account = FinAccount.builder()
                .userId(testUserId)
                .name("Original Name")
                .accountType("bank")
                .balance(new BigDecimal("5000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account);

        AccountDTO updateDto = AccountDTO.builder()
                .name("Updated Name")
                .accountType("bank")
                .currency("CNY")
                .balance(new BigDecimal("6000.00"))
                .build();

        // When
        accountService.updateAccount(testUserId, account.getAccountId(), updateDto);

        // Then
        FinAccount updated = accountMapper.selectById(account.getAccountId());
        assertThat(updated.getName()).isEqualTo("Updated Name");
    }

    @Test
    @DisplayName("Delete account should set status to 0")
    void deleteAccount_ShouldSetStatusToZero() {
        // Given
        FinAccount account = FinAccount.builder()
                .userId(testUserId)
                .name("To Delete")
                .accountType("bank")
                .balance(new BigDecimal("1000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account);

        // When
        accountService.deleteAccount(testUserId, account.getAccountId());

        // Then - verify deletion by checking that active accounts count is 0
        Long activeCount = accountMapper.selectCount(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, account.getAccountId())
                        .eq(FinAccount::getStatus, 1)
        );
        assertThat(activeCount).isEqualTo(0);
    }

    @Test
    @DisplayName("Update balance should modify account balance")
    void updateBalance_ShouldModifyAccountBalance() {
        // Given
        FinAccount account = FinAccount.builder()
                .userId(testUserId)
                .name("Balance Test Account")
                .accountType("bank")
                .balance(new BigDecimal("5000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account);

        // When - add 1000 to balance
        accountService.updateBalance(account.getAccountId(), new BigDecimal("1000.00"));

        // Then
        FinAccount updated = accountMapper.selectById(account.getAccountId());
        assertThat(updated.getBalance()).isEqualByComparingTo("6000.00");
    }

    @Test
    @DisplayName("Get account summary should return assets and liabilities")
    void getAccountSummary_ShouldReturnAssetsAndLiabilities() {
        // Given - create multiple accounts
        FinAccount assetAccount = FinAccount.builder()
                .userId(testUserId)
                .name("Savings Account")
                .accountType("bank")
                .balance(new BigDecimal("10000.00"))
                .currency("CNY")
                .status(1)
                .includeInTotal(1)
                .build();
        accountMapper.insert(assetAccount);

        FinAccount liabilityAccount = FinAccount.builder()
                .userId(testUserId)
                .name("Credit Card")
                .accountType("credit")
                .balance(new BigDecimal("-3000.00"))
                .currency("CNY")
                .status(1)
                .includeInTotal(1)
                .build();
        accountMapper.insert(liabilityAccount);

        // When
        Object summary = accountService.getAccountSummary(testUserId);

        // Then
        assertThat(summary).isNotNull();
    }
}
