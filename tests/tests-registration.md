# Test Registration
- linux
```
curl -X POST https://localhost:5095/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```
- windows
```
Invoke-RestMethod -Uri "https://localhost:5095/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

# Results:
1. MySQL Swagger: success
2. React: success
  - ![console log registration from react](console-log-registrationtest.png)
3. MsSQL Swagger: success
  - ![swagger log registration test for MsSQL](swagger-log-registrationtest-mssql.png)