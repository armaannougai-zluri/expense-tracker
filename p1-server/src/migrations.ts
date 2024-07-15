import { Migration } from '@mikro-orm/migrations';

export class Migration20210715000000 extends Migration {

  async up(): Promise<void> {
    // Add tsvector column
    this.addSql('ALTER TABLE "document" ADD COLUMN "tsvector" tsvector;');

    // Populate tsvector column
    this.addSql('UPDATE "document" SET "tsvector" = to_tsvector(\'english\', content);');

    // Create GIN index
    this.addSql('CREATE INDEX "document_tsvector_index" ON "document" USING GIN ("tsvector");');

    // Create trigger function
    this.addSql(`
      CREATE FUNCTION update_tsvector_column() RETURNS trigger AS $$
      BEGIN
        NEW.tsvector := to_tsvector('english', NEW.content);
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    this.addSql(`
      CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
      ON "document" FOR EACH ROW EXECUTE FUNCTION update_tsvector_column();
    `);
  }

  async down(): Promise<void> {
    // Drop trigger
    this.addSql('DROP TRIGGER IF EXISTS tsvectorupdate ON "document";');

    // Drop trigger function
    this.addSql('DROP FUNCTION IF EXISTS update_tsvector_column();');

    // Drop GIN index
    this.addSql('DROP INDEX IF EXISTS "document_tsvector_index";');

    // Drop tsvector column
    this.addSql('ALTER TABLE "document" DROP COLUMN "tsvector";');
  }
}
