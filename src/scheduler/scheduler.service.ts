import { Injectable } from "@nestjs/common";
import { CreateSchedulerDto } from "./dto/create-scheduler.dto";
import { UpdateSchedulerDto } from "./dto/update-scheduler.dto";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import Func = jest.Func;
import mysqldump from 'mysqldump';
import {useB2FileUpload} from "../services/file-upload";

@Injectable()
export class SchedulerService {
  constructor(private schedulerRegistry: SchedulerRegistry) {
  }

  create(name: string, date: string, method: Func) {
    console.log(date)
    const job = new CronJob(`${2} * * * * *`, () => {
      method();
    });
    // @ts-ignore
    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    console.log(
      `job ${name} added for each minute at ${2} seconds`
    );

    console.log(this.findOne(name))
  }
  restart() {
    const jobs = this.schedulerRegistry.getCronJobs();
    console.log(jobs);
    jobs.forEach((value, key, map) => {
      let next;
      try {
        // @ts-ignore
        next = value.nextDates().toDate();
      } catch (e) {
        next = "error: next fire date is in the past!";
      }
      console.log(`job: ${key} -> next: ${next}`);
      value.start();
    });
  }

  findOne(name: string): any {
    return this.schedulerRegistry.getCronJob(name);

  }


  // @Cron(CronExpression.EVERY_5_SECONDS)
  backUpDb() {
    const file_name = `./dump.sql`
    // ${Math.round(Date.now() / 1000)}
    mysqldump({
      connection: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'osr_cruise',
      },
      dumpToFile: file_name,
    }).then( async r =>  {
      // console.log('uploading')
      // await useB2FileUpload(`db_backup`, r.dump.schema);
    });
  }
}
