import dayjs from "dayjs";
import type { NextApiRequest, NextApiResponse } from "next";

import { asStringOrNull } from "@lib/asStringOrNull";
import prisma from "@lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = asStringOrNull(req.query.user);
  const dateFrom = dayjs(asStringOrNull(req.query.dateFrom));
  const dateTo = dayjs(asStringOrNull(req.query.dateTo));

  if (!dateFrom.isValid() || !dateTo.isValid() || dateFrom.isAfter(dateTo)) {
    return res.status(400).json({ message: "Invalid time range given." });
  }

  const rawUser = await prisma.user.findUnique({
    where: {
      username: user as string,
    },
    select: {
      credentials: true,
      timeZone: true,
      bufferTime: true,
      availability: true,
      id: true,
      startTime: true,
      endTime: true,
      selectedCalendars: true,
      Schedule: {
        select: {
          freeBusyTimes: true,
        },
      },
    },
  });

  if (!rawUser) throw new Error("No user found");

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  const workhours = rawUser?.Schedule?.reduce((acc: Array<any>, schedule: any) => {
    days.forEach((day, index) => {
      const times = schedule.freeBusyTimes?.[day]?.map((time: any) => {
        const start = time.start.split(":");
        const end = time.end.split(":");

        const startTime = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endTime = parseInt(end[0]) * 60 + parseInt(end[1]);

        return {
          days: [index],
          startTime,
          endTime,
        };
      });

      acc.push(...(times ?? []));
    });

    return acc;
  }, []);

  const timeZone = rawUser.timeZone;
  const defaultAvailability = {
    startTime: rawUser.startTime,
    endTime: rawUser.endTime,
    days: [0, 1, 2, 3, 4, 5, 6],
  };
  const workingHours = workhours?.length ? workhours : [defaultAvailability];

  workingHours.sort((a, b) => a.startTime - b.startTime);

  const day = dateFrom.tz(timeZone).day();
  const startTime = dateFrom.tz(timeZone).hour() * 60 + dateFrom.tz(timeZone).minute();
  const endTime = dateTo.tz(timeZone).hour() * 60 + dateTo.tz(timeZone).minute();

  // check for slots that include startTime
  const selectedSlots = workingHours.filter(
    (slot) =>
      slot.days.includes(day) &&
      startTime >= slot.startTime &&
      startTime <= slot.endTime &&
      endTime >= slot.startTime &&
      endTime <= slot.endTime
  );

  // const finalSelection = selectedSlots.filter((slot) => endTime >= slot.startTime && endTime <= slot.endTime);

  res.status(200).json({
    timeZone,
    workingHours: selectedSlots,
    available: !!selectedSlots.length,
  });
}
