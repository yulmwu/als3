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
    - Move files and directories
    - Breadcrumb navigation
- RESTful API
- Web-based user interface
- _RBAC (not implemented yet)_
- _Collaboration/Cooperation and Sharing (not implemented yet)_
- _Built-in format converter/viewer (not implemented yet)_
- _Versioning and History (not implemented yet)_
- ... and more.

---

For ease of use, the following convenience UI/UX is provided.

- Drag and drop to move files and directories

![drag-and-drop](./images/easy-to-use-dnd.png)

- Dropdown menu for file actions

![dropdown-menu](./images/easy-to-use2-dropdown.png)

- Pagination for file listing

![pagination](./images/easy-to-use4-pagination.png)
![pagination](./images/easy-to-use5-pagination.png)

- Directory download as ZIP file: When downloading a directory, it is compressed into a ZIP file

![zip-download](./images/easy-to-use6-zip.png)

and file download is provided in AWS S3 Presigned URL.

```
https://sample-als3-bucket.s3.ap-northeast-2.amazonaws.com/users/1/f/1c2d9651-0cb9-4145-9b7c-6919bc139dc0?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6LGPG5W3G5SOBTFV%2F20251118%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20251118T003714Z&X-Amz-Expires=3600&X-Amz-Signature=3e7b648f519974f6fd6a4329575f95e577fcc48a787e0ef181717f9a82fe7d36&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22docker-compose.db.yaml%22&response-content-type=application%2Fx-yaml&x-amz-checksum-mode=ENABLED&x-id=GetObject
```

![download](./images/easy-to-use3-download.png)

- Storage limits and usage indicator: Displays the user's storage usage and limit in the sidebar and profile dropdown.

![storage-usage](./images/image-storage-limit.png)

# Installation and Build, Usages

```shell
git clone https://github.com/yulmwu/als3.git
cd als3
npm install
npm run shared:build # build shared package

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

# or locally for development
npm run backend:dev # or backend:build and backend:start
npm run frontend:dev # or frontend:build and frontend:start
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
