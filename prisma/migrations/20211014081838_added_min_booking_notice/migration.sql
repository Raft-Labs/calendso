-- AlterTable
ALTER TABLE "users" ADD COLUMN     "minimumBookingNotice" INTEGER NOT NULL DEFAULT 120;

-- RenameIndex
ALTER INDEX "DailyEventReference_bookingId_unique" RENAME TO "DailyEventReference.bookingId_unique";
