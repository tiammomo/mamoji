package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	// 测试token解析
	token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnRlcnByaXNlSWQiOjEsImV4cCI6MTc2NzI2MDY3NSwiaWF0IjoxNzY3MTc0Mjc1LCJqdGkiOiIxNDFhNDEyYi04OGJiLTRjNWQtOTMzZC1hNzEzMWZlNGZhMjMiLCJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4ifQ.3uKQLuVRFyrpQjJne6ZOe1hjuSwJIKu__2xkKDM3QD4"

	type JWTClaims struct {
		UserId       int64  `json:"userId"`
		Username     string `json:"username"`
		EnterpriseId int64  `json:"enterpriseId"`
		Role         string `json:"role"`
		jwt.RegisteredClaims
	}

	claims := &JWTClaims{}
	t, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte("mamoji-secret-key-2024"), nil
	})

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if t.Valid {
		fmt.Printf("Token valid!\n")
		fmt.Printf("UserId: %d\n", claims.UserId)
		fmt.Printf("EnterpriseId: %d\n", claims.EnterpriseId)
		fmt.Printf("Username: %s\n", claims.Username)
		fmt.Printf("Role: %s\n", claims.Role)
	} else {
		fmt.Println("Token invalid")
	}
}
