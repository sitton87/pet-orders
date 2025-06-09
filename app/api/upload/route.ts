import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityId = formData.get("entityId") as string;
    const entityType = formData.get("entityType") as string;

    if (!file) {
      return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
    }

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: "חסרים פרטים נדרשים" },
        { status: 400 }
      );
    }

    // Validate entity exists
    if (entityType === "supplier") {
      const supplier = await prisma.supplier.findUnique({
        where: { id: entityId },
      });
      if (!supplier) {
        return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
      }
    } else if (entityType === "order") {
      const order = await prisma.order.findUnique({
        where: { id: entityId },
      });
      if (!order) {
        return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
      }
    }

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "קובץ גדול מדי (מקסימום 10MB)" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = file.name.split(".").pop() || "";
    const fileName = `${fileId}.${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      entityType + "s",
      entityId
    );
    await mkdir(uploadDir, { recursive: true });

    // Save file to disk
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file URL
    const fileUrl = `/uploads/${entityType}s/${entityId}/${fileName}`;

    // Save file info to database and get response data
    let responseData;

    // Get or create a user for uploads
    let userId: string;
    try {
      // Try to find existing user
      let user = await prisma.user.findFirst();

      if (!user) {
        // If no user exists, we have a bigger problem - let's just use a placeholder
        // This should not happen after running seed data
        console.warn("No users found in database - please run seed data");
        userId = "placeholder-user"; // זמני
      } else {
        userId = user.id;
      }
    } catch (error) {
      console.error("Error finding user:", error);
      userId = "placeholder-user"; // fallback
    }

    if (entityType === "supplier") {
      const fileRecord = await prisma.supplierFile.create({
        data: {
          id: fileId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          filePath: fileUrl,
          supplierId: entityId,
          uploadedBy: userId,
        },
      });

      responseData = {
        id: fileRecord.id,
        name: fileRecord.fileName,
        size: fileRecord.fileSize,
        type: fileRecord.fileType,
        url: fileRecord.filePath,
        uploadedAt: fileRecord.uploadedAt,
      };
    } else {
      const fileRecord = await prisma.orderFile.create({
        data: {
          id: fileId,
          fileName: file.name,
          fileSize: file.size,
          filePath: fileUrl,
          orderId: entityId,
          uploadedBy: userId,
        },
      });

      responseData = {
        id: fileRecord.id,
        name: fileRecord.fileName,
        size: fileRecord.fileSize,
        type: file.type, // אין fileType ב-OrderFile אז נשתמש ב-file.type
        url: fileRecord.filePath,
        uploadedAt: fileRecord.uploadedAt,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "שגיאה בהעלאת הקובץ" }, { status: 500 });
  }
}
