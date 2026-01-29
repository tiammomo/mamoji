package com.mamoji;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGen {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "admin123";
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println("Encoded password: " + encodedPassword);
        System.out.println("Matches: " + encoder.matches(rawPassword, encodedPassword));

        // Test the hash from database
        String dbHash = "$2a$10$p8cLhqCYSS1haeK3ScksoO79gIKWSipdxcikT/XmE4oGdICHzpmyK";
        System.out.println("DB Hash matches: " + encoder.matches(rawPassword, dbHash));
    }
}
