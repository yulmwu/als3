# A Lightweight STaaS Storage Service(ALS3)

Provides lightweight cloud **STaaS(Storage as a Service)** storage services using S3 storage as a backend.

![preview](./images/preview.png)

# Features

- User authentication and management
- File and directory management
    - File upload and download (S3 Backend, Presigned URL)
    - Directory creation
    - File and directory renaming
    - File and directory deletion
    - File listing with pagination
    - Breadcrumb navigation
    - _Move files and directories (not implemented yet)_
- RESTful API
- Web-based user interface
- _RBAC (not implemented yet)_
- _Collaboration/Cooperation and Sharing (not implemented yet)_

# Installation and Build, Usages

```shell
git clone https://github.com/yulmwu/als3.git
cd als3
touch .env
```

and you need to fill in the `.env` file with your configuration. You can refer to `.env.example` for the required environment variables.

```ini
# .env example

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

PostgreSQL and Redis should be set if there is a separate remote server; the default value is provided through the Docker container.
for security, change the value of `JWT_SECRET` to any value and populate AWS IAM Credentials and S3 Bucket name.

```shell
docker-compose -f docker-compose.yaml up --build -d
```

the default is port 3000 for backend and port 4000 for frontend. You can change the port mapping in `docker-compose.yaml` if needed.

please check RESTful API Docs by connecting to the following path: `http://localhost:3000/api-docs` (Swagger UI)

# Tech Stack

- AWS S3(Storage Backend), Presigned URL
- NestJS, TypeScript
- PostgreSQL, TypeORM, Redis
- (FE) Next.js, React, TailwindCSS

# AWS Deployment

(We offer Terraform in the future.)

# LICENSE

```
The MIT License (MIT)

Copyright (c) 2025. Kim Jun Young (@yulmwu)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

# References, Blog Posts

- [Blog: [DB/SQL] Recursive CTE(Common Table Expression)을 통한 N+1 문제 개선해보기](https://velog.io/@yulmwu/db-recursive-cte-feat-breadcrumb) - about Recursive CTE for breadcrumb implementation
