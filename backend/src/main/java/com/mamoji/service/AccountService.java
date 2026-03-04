package com.mamoji.service;

import com.mamoji.dto.AccountDTO;
import com.mamoji.entity.Account;
import com.mamoji.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;

    public List<AccountDTO> getAccounts(Long userId) {
        return accountRepository.findByUserIdAndStatus(userId, 1)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AccountDTO getAccount(Long id, Long userId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!account.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        return toDTO(account);
    }

    @Transactional
    public AccountDTO createAccount(AccountDTO dto, Long userId) {
        Account account = new Account();
        account.setName(dto.getName());
        account.setType(dto.getType());
        account.setSubType(dto.getSubType());
        account.setBank(dto.getBank());
        account.setBalance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO);
        account.setIncludeInNetWorth(dto.getIncludeInNetWorth() != null ? dto.getIncludeInNetWorth() : true);
        account.setUserId(userId);
        account.setLedgerId(dto.getLedgerId());
        account.setStatus(1);

        return toDTO(accountRepository.save(account));
    }

    @Transactional
    public AccountDTO updateAccount(Long id, AccountDTO dto, Long userId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!account.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (dto.getName() != null) account.setName(dto.getName());
        if (dto.getType() != null) account.setType(dto.getType());
        if (dto.getSubType() != null) account.setSubType(dto.getSubType());
        if (dto.getBank() != null) account.setBank(dto.getBank());
        if (dto.getBalance() != null) account.setBalance(dto.getBalance());
        if (dto.getIncludeInNetWorth() != null) account.setIncludeInNetWorth(dto.getIncludeInNetWorth());

        return toDTO(accountRepository.save(account));
    }

    @Transactional
    public void deleteAccount(Long id, Long userId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!account.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        account.setStatus(0);
        accountRepository.save(account);
    }

    public Map<String, BigDecimal> getAccountSummary(Long userId) {
        BigDecimal totalAssets = accountRepository.getTotalAssets(userId);
        BigDecimal totalLiabilities = accountRepository.getTotalLiabilities(userId);

        BigDecimal netWorth = (totalAssets != null ? totalAssets : BigDecimal.ZERO)
                .subtract(totalLiabilities != null ? totalLiabilities : BigDecimal.ZERO);

        return Map.of(
                "totalAssets", totalAssets != null ? totalAssets : BigDecimal.ZERO,
                "totalLiabilities", totalLiabilities != null ? totalLiabilities : BigDecimal.ZERO,
                "netWorth", netWorth
        );
    }

    public Map<String, BigDecimal> getAccountSummaryByDateRange(Long userId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        // For now, return current summary - could be enhanced to calculate based on transactions
        return getAccountSummary(userId);
    }

    private AccountDTO toDTO(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setId(account.getId());
        dto.setName(account.getName());
        dto.setType(account.getType());
        dto.setSubType(account.getSubType());
        dto.setBank(account.getBank());
        dto.setBalance(account.getBalance());
        dto.setIncludeInNetWorth(account.getIncludeInNetWorth());
        dto.setUserId(account.getUserId());
        dto.setLedgerId(account.getLedgerId());
        dto.setStatus(account.getStatus());
        return dto;
    }
}
