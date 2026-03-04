package com.mamoji.dto;

import lombok.Data;

@Data
public class LedgerMemberDTO {
    private Long id;
    private Long ledgerId;
    private Long userId;
    private String nickname;
    private String email;
    private String role;
    private Integer status;
}
