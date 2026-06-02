import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleCron() {
    this.logger.log('Starting automated database backup...');
    try {
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `/tmp/kaffza_backup_${dateStr}.sql`;
      
      const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kaffza';
      
      const { stdout, stderr } = await execAsync(`pg_dump "${dbUrl}" > ${backupPath}`);
      
      this.logger.log(`Backup successfully created at ${backupPath}`);
      if (stderr) {
        this.logger.warn(`Backup stderr: ${stderr}`);
      }

      // TODO: Upload to AWS S3 using aws-sdk
      
    } catch (error) {
      this.logger.error('Database backup failed', error);
    }
  }
}
