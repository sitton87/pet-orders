import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

// GET - קבלת כל הקבצים של הזמנה
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const files = await prisma.orderFile.findMany({
      where: {
        orderId: orderId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    const filesList = files.map((file: any) => ({
      id: file.id,
      name: file.fileName,
      size: file.fileSize,
      type: file.fileName.split(".").pop() || "unknown", // אין fileType ב-OrderFile
      url: file.filePath,
      uploadedAt: file.uploadedAt,
    }));

    return NextResponse.json(filesList);
  } catch (error) {
    console.error("Error fetching order files:", error);
    return NextResponse.json({ error: "שגיאה בטעינת קבצים" }, { status: 500 });
  }
}

// DELETE - מחיקת קובץ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "מזהה קובץ נדרש" }, { status: 400 });
    }

    // Find the file record
    const fileRecord = await prisma.orderFile.findFirst({
      where: {
        id: fileId,
        orderId: orderId,
      },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "קובץ לא נמצא" }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), "public", fileRecord.filePath);
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
      // Continue with database deletion even if file doesn't exist on disk
    }

    // Delete file record from database
    await prisma.orderFile.delete({
      where: {
        id: fileId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order file:", error);
    return NextResponse.json({ error: "שגיאה במחיקת הקובץ" }, { status: 500 });
  }
}
