import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUuidToFiles1763163719471 implements MigrationInterface {
    name = 'AddUuidToFiles1763163719471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ADD "uuid" uuid NOT NULL DEFAULT gen_random_uuid()`)
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "UQ_80216965527c9be0babd7ea5bbe" UNIQUE ("uuid")`)
        await queryRunner.query(`ALTER TABLE "files" ADD "parentId" integer`)
        await queryRunner.query(
            `ALTER TABLE "files" ADD CONSTRAINT "FK_b104781b63037f6404e1b69280d" FOREIGN KEY ("parentId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_b104781b63037f6404e1b69280d"`)
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "parentId"`)
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "UQ_80216965527c9be0babd7ea5bbe"`)
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "uuid"`)
    }
}
