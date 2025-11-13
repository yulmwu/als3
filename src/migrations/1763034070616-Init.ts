import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1763034070616 implements MigrationInterface {
    name = 'Init1763034070616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."files_type_enum" AS ENUM('file', 'directory')`)
        await queryRunner.query(
            `CREATE TABLE "files" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."files_type_enum" NOT NULL, "s3Key" character varying(1024), "mimeType" character varying(255), "size" bigint, "path" character varying(2048) NOT NULL DEFAULT '/', "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
        )
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('0', '1')`)
        await queryRunner.query(
            `CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(32) NOT NULL, "nickname" character varying(32), "password" character varying(255) NOT NULL, "email" character varying(320) NOT NULL, "description" character varying(255), "profileImage" character varying(255), "role" "public"."users_role_enum" NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        )
        await queryRunner.query(
            `ALTER TABLE "files" ADD CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335"`)
        await queryRunner.query(`DROP TABLE "users"`)
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
        await queryRunner.query(`DROP TABLE "files"`)
        await queryRunner.query(`DROP TYPE "public"."files_type_enum"`)
    }
}
