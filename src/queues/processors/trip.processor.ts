import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { HttpException, HttpStatus } from "@nestjs/common";
import { sendMail } from "../../services/nodemailer";
import { DriversService } from "../../drivers/drivers.service";
import { usePusher } from "../../services/pusher";
import { useGoogleMapServices } from "../../services/map";
import { TripsService } from "../../trips/trips.service";
import { Trip } from "../../trips/entities/trip.entity";
import { STATUS } from "../../enums/type.enum";
import { Driver } from "../../drivers/entities/driver.entity";
import * as console from "console";

const pusher = usePusher();
const { calculateDistanceMatrix, formatLatAndLng } = useGoogleMapServices();

@Processor("trip-queue")
export class TripProcessor {
  constructor(private driverService: DriversService, private tripService: TripsService) {
  }

  // @Process("dispatch-trip-to-nearby-available-drivers")
  // async dispatchTripToNearbyAvailableDrivers(job: Job, skip_val?: number, take_val?: number) {
  //   console.log("processing trip");
  //   const skip = skip_val ? skip_val : 0;
  //   const take = take_val ? take_val : 10;
  //   let drivers_seen = 0;
  //   try {
  //     const trip = job.data.data;
  //     const drivers = await Driver.find({
  //       select: ["location", "is_online", "is_busy", "id"],
  //       where: { is_online: true },
  //       take: 10,
  //       skip: 0
  //     });
  //     console.log(`drivers count ${drivers.length}`);
  //     for (const driver of drivers) {
  //       console.log(`finding drivers through drivers - ${driver.id}`);
  //       console.log(`driver lat and lng ${driver.location.lng} ${driver.location.lng}`);
  //       const response = await calculateDistanceMatrix(formatLatAndLng(driver.location.lat, driver.location.lng), formatLatAndLng(trip.origin.lat, trip.origin.lng));
  //       if (response.km <= 10) {
  //         console.log(`Seen a driver    - ${driver.id}`);
  //         drivers_seen++;
  //         await pusher.trigger(`private-ride-request-${driver.id}`, "new_ride_request", {
  //           trip: {
  //             rider_fare: trip.rider_fare,
  //             km: trip.kilometers,
  //             duration: trip.duration,
  //             trip_id: trip.id,
  //             origin_address: trip.origin_address,
  //             destination_address: trip.destination_address,
  //             origin: trip.origin,
  //             base_fare: trip.base_fare
  //           }
  //         });
  //       }
  //     }
  //
  //     // if (!drivers_seen && drivers.length === take) {
  //     //   console.log("no drivers seen");
  //     //   await this.dispatchTripToNearbyAvailableDrivers(job, skip + 1, take + 10);
  //     // }
  //     // private-ongoing-trip-66556
  //     // trip = await Trip.findOneBy({ id: trip.id });
  //     // if (!trip.driver_id && trip.status === STATUS.PENDING) await this.dispatchTripToNearbyAvailableDrivers(job, skip + 1);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  @Process("test-queue")
  async testQueue(job: Job) {
    console.log("ruuning queue");
    console.log(job.data);
  }

  @Process("upload-vehicle-inspection-points")
  async processUploadVehicleInspectionPoints(job: Job) {
    const files = job.data.files;
    const driver = job.data.driver;
    await this.driverService.uploadDriverVehicleInspectionPoints(driver, files);
  }
}