# S3 para documentos

O bucket deve permanecer privado. O portal gera autorizações temporárias no servidor:

- `POST` pré-assinado por 5 minutos para o navegador enviar o documento diretamente;
- `GET` pré-assinado por 60 segundos, emitido somente após validar a sessão e a empresa;
- `HeadObject` no servidor antes de registrar o arquivo no banco.

## CORS do bucket

Configure o bucket usado por `S3_BUCKET` para aceitar o envio do domínio do portal:

```json
[
  {
    "AllowedOrigins": [
      "https://machinesafety360.com.br",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["POST", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

Não use `"*"` em `AllowedOrigins` e não habilite acesso público ao bucket.

## IAM do runtime

A role ou credencial usada pelo compute do Amplify precisa destas ações no prefixo do portal:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject"
  ],
  "Resource": "arn:aws:s3:::NOME_DO_BUCKET/*"
}
```

`HeadObject` é autorizado por `s3:GetObject`. A identidade não precisa de `s3:ListBucket`.

## Conferência após o deploy

1. Envie um PDF próximo de 20 MB pela tela de novo documento.
2. Confirme no navegador que o arquivo vai diretamente ao domínio do S3.
3. Abra e baixe o documento; `/api/documents/{id}/file` deve responder com redirect temporário.
4. Confirme que um usuário de outra empresa recebe `404` na rota do arquivo.
