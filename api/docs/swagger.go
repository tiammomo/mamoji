package docs

import "github.com/swaggo/swag"

// @title Mamoji API 文档
// @version 1.0
// @description Mamoji 企业财务记账系统 API 文档
// @host localhost:8888
// @BasePath /api/v1
// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization

func SwaggerInit() *swag.Spec {
	swag := swag.New()
	swag.Info.Title = "Mamoji API"
	swag.Info.Version = "1.0"
	swag.Info.Description = "Mamoji 企业财务记账系统 API 文档"
	swag.Info.Host = "localhost:8888"
	swag.Info.BasePath = "/api/v1"
	swag.SecurityDefinitions = map[string]*swag.SecurityScheme{
		"Bearer": {
			Type:        "apiKey",
			Name:        "Authorization",
			In:          "header",
			Description: "JWT Token",
		},
	}
	return swag
}
