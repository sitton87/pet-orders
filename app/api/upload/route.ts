import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to sanitize filename (fallback if not provided by client)
const sanitizeFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  const name =
    lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

  const cleanName = name
    .replace(/[\u0590-\u05FF]/g, "") // Remove Hebrew characters
    .replace(/[^\w\-_.]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .substring(0, 50); // Limit length

  const finalName = cleanName || `file_${Date.now()}`;
  return finalName + extension;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityId = formData.get("entityId") as string;
    const entityType = formData.get("entityType") as string;
    const originalFileName =
      (formData.get("originalFileName") as string) || file?.name;
    const sanitizedFileName =
      (formData.get("sanitizedFileName") as string) ||
      sanitizeFileName(file?.name || "");

    console.log("Upload request:", {
      originalFileName,
      sanitizedFileName,
      fileSize: file?.size,
      fileType: file?.type,
    });

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

    // Generate unique filename and public_id for Cloudinary using sanitized name
    const fileId = uuidv4();
    const fileExtension = sanitizedFileName.split(".").pop() || "";
    const folderName = `r4pet/${entityType}s/${entityId}`;
    const publicId = `${folderName}/${fileId}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Debug logging
    console.log("File processing:", {
      originalFileName: originalFileName,
      sanitizedFileName: sanitizedFileName,
      fileSize: file.size,
      fileType: file.type,
      publicId: publicId,
      bytesLength: bytes.byteLength,
      bufferLength: buffer.length,
    });

    // Validate buffer is not empty
    if (!buffer || buffer.length === 0) {
      console.log("ERROR: Buffer is empty!");
      return NextResponse.json({ error: "הקובץ ריק או פגום" }, { status: 400 });
    }

    // Determine resource type based on file type
    const getResourceType = (fileType: string) => {
      if (fileType.startsWith("image/")) return "image";
      if (fileType === "application/pdf") return "raw";
      if (fileType.includes("video/")) return "video";
      return "raw"; // Default for documents, zip files, etc.
    };

    const resourceType = getResourceType(file.type);

    console.log("Uploading to Cloudinary:", {
      publicId,
      resourceType,
      fileType: file.type,
    });

    // Upload to Cloudinary using sanitized filename
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: resourceType, // Use correct resource type
            access_mode: "public",
            delivery_type: "upload",
            use_filename: false, // Don't use original filename
            unique_filename: false,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else if (!result || !result.secure_url) {
              reject(new Error("Upload failed - no result"));
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    const cloudinaryResult = uploadResult as any;
    let fileUrl = cloudinaryResult.secure_url;

    // For PDF files, ensure the URL is correct for raw resource type
    if (file.type === "application/pdf" && fileUrl.includes("/image/upload/")) {
      fileUrl = fileUrl.replace("/image/upload/", "/raw/upload/");
      console.log("Corrected PDF URL:", fileUrl);
    }

    console.log("Cloudinary upload successful:", {
      publicId: publicId,
      secureUrl: fileUrl,
      originalUrl: cloudinaryResult.secure_url,
    });

    // Get or create a user for uploads
    let userId: string;
    try {
      let user = await prisma.user.findFirst();
      if (!user) {
        console.warn("No users found in database - please run seed data");
        userId = "placeholder-user";
      } else {
        userId = user.id;
      }
    } catch (error) {
      console.error("Error finding user:", error);
      userId = "placeholder-user";
    }

    // Save file info to database with original filename for display
    let responseData;

    if (entityType === "supplier") {
      const fileRecord = await prisma.supplierFile.create({
        data: {
          id: fileId,
          fileName: originalFileName, // Store original Hebrew name for display
          fileSize: file.size,
          fileType: file.type,
          filePath: fileUrl, // Cloudinary URL
          supplierId: entityId,
          uploadedBy: userId,
        },
      });

      responseData = {
        id: fileRecord.id,
        name: fileRecord.fileName, // Show original name to user
        size: fileRecord.fileSize,
        type: fileRecord.fileType,
        url: fileRecord.filePath,
        uploadedAt: fileRecord.uploadedAt,
        cloudinaryId: publicId, // Store ID for future deletion
      };
    } else {
      const fileRecord = await prisma.orderFile.create({
        data: {
          id: fileId,
          fileName: originalFileName, // Store original Hebrew name for display
          fileSize: file.size,
          filePath: fileUrl, // Cloudinary URL
          orderId: entityId,
          uploadedBy: userId,
        },
      });

      responseData = {
        id: fileRecord.id,
        name: fileRecord.fileName, // Show original name to user
        size: fileRecord.fileSize,
        type: file.type, // No fileType field in OrderFile so use file.type
        url: fileRecord.filePath,
        uploadedAt: fileRecord.uploadedAt,
        cloudinaryId: publicId, // Store ID for future deletion
      };
    }

    console.log("File uploaded successfully:", {
      fileId: fileId,
      originalName: originalFileName,
      url: fileUrl,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "שגיאה בהעלאת הקובץ" }, { status: 500 });
  }
}
