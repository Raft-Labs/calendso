import type { NextApiRequest, NextApiResponse } from "next";

import { getSession } from "@lib/auth";
import prisma from "@lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req: req });

  // if (!session) {
  //   res.status(401).json({ message: "Not authenticated" });
  //   return;
  // }

  if (req.method === "POST") {
    try {
      const createdSchedule = await prisma.schedule.create({
        data: {
          freeBusyTimes: req.body.data.freeBusyTimes,
          user: {
            connect: {
              id: session.user.id,
            },
          },
        },
      });

      return res.status(200).json({
        message: "created",
        data: createdSchedule,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Unable to create schedule." });
    }
  }

  if (req.method === "PATCH") {
    try {
      const schedule = await prisma.schedule.findFirst({
        where: {
          userId: {
            equals: req.body.userId,
          },
        },
      });

      let createdSchedule;
      if (schedule) {
        createdSchedule = await prisma.schedule.update({
          data: {
            freeBusyTimes: req.body.data.freeBusyTimes,
          },
          where: {
            id: schedule.id,
          },
        });
      } else {
        createdSchedule = await prisma.schedule.create({
          data: {
            freeBusyTimes: req.body.data.freeBusyTimes,
            user: {
              connect: {
                id: req.body.user_id,
              },
            },
          },
        });
      }

      return res.status(200).json({
        message: "updated",
        data: createdSchedule,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Unable to create schedule." });
    }
  }
}
