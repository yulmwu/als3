import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1763440064497 implements MigrationInterface {
    name = 'Init1763440064497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "storageUsed" bigint NOT NULL DEFAULT '0'`)
        await queryRunner.query(`ALTER TABLE "users" ADD "storageLimit" bigint NOT NULL DEFAULT '1073741824'`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "storageLimit"`)
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "storageUsed"`)
    }
}
