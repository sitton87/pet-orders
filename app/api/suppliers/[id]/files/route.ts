import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

// GET - קבלת כל הקבצים של ספק
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;

    const files = await prisma.supplierFile.findMany({
      where: {
        supplierId: supplierId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    const filesList = files.map((file: any) => ({
      id: file.id,
      name: file.fileName,
      size: file.fileSize,
      type: file.fileType, // SupplierFile יש לו fileType ✅
      url: file.filePath,
      uploadedAt: file.uploadedAt,
    }));

    return NextResponse.json(filesList);
  } catch (error) {
    console.error("Error fetching supplier files:", error);
    return NextResponse.json({ error: "שגיאה בטעינת קבצים" }, { status: 500 });
  }
}

// DELETE - מחיקת קובץ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "מזהה קובץ נדרש" }, { status: 400 });
    }

    // Find the file record
    const fileRecord = await prisma.supplierFile.findFirst({
      where: {
        id: fileId,
        supplierId: supplierId,
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
    await prisma.supplierFile.delete({
      where: {
        id: fileId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier file:", error);
    return NextResponse.json({ error: "שגיאה במחיקת הקובץ" }, { status: 500 });
  }
}
