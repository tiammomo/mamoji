package com.mamoji.controller;

import com.mamoji.dto.LedgerDTO;
import com.mamoji.dto.LedgerMemberDTO;
import com.mamoji.entity.User;
import com.mamoji.security.AuthenticationUser;
import com.mamoji.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ledgers")
@RequiredArgsConstructor
public class LedgerController {
    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLedgers(@AuthenticationUser User user) {
        List<LedgerDTO> ledgers = ledgerService.getLedgers(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", ledgers);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getLedger(@PathVariable Long id, @AuthenticationUser User user) {
        LedgerDTO ledger = ledgerService.getLedger(id, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", ledger);

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createLedger(@RequestBody LedgerDTO dto, @AuthenticationUser User user) {
        LedgerDTO ledger = ledgerService.createLedger(dto, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", ledger);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateLedger(@PathVariable Long id, @RequestBody LedgerDTO dto, @AuthenticationUser User user) {
        LedgerDTO ledger = ledgerService.updateLedger(id, dto, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", ledger);

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteLedger(@PathVariable Long id, @AuthenticationUser User user) {
        ledgerService.deleteLedger(id, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", null);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<Map<String, Object>> getMembers(@PathVariable Long id, @AuthenticationUser User user) {
        List<LedgerMemberDTO> members = ledgerService.getMembers(id, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", members);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Map<String, Object>> addMember(@PathVariable Long id, @RequestBody Map<String, Object> body, @AuthenticationUser User user) {
        Long memberUserId = Long.valueOf(body.get("userId").toString());
        String role = body.get("role") != null ? body.get("role").toString() : "viewer";
        LedgerMemberDTO member = ledgerService.addMember(id, memberUserId, role, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", member);

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<Map<String, Object>> removeMember(@PathVariable Long id, @PathVariable Long memberId, @AuthenticationUser User user) {
        ledgerService.removeMember(id, memberId, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", null);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/default")
    public ResponseEntity<Map<String, Object>> getDefaultLedger(@AuthenticationUser User user) {
        Long defaultLedgerId = ledgerService.getDefaultLedgerId(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("ledgerId", defaultLedgerId);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }
}
