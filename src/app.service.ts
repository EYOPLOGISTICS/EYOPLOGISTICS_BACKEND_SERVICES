import {Injectable, OnApplicationBootstrap} from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationBootstrap {

    onApplicationBootstrap(): any {
        console.log('application bootstrapped')
        // AppSettings.findOneBy({id: 2}).then(value => {
        //     if (!value) {
        //         const appSettings = new AppSettings();
        //         appSettings.save().then(value1 => value1);
        //     }
        // });

    }
}
