"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  File,
  X,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image,
  FileText,
  Archive,
} from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface FileUploadProps {
  entityId: string;
  entityType: "supplier" | "order";
  onFilesChange?: (files: FileItem[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

export default function FileUpload({
  entityId,
  entityType,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 10,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing files
  useEffect(() => {
    loadFiles();
  }, [entityId, entityType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${entityType}s/${entityId}/files`);
      if (response.ok) {
        const existingFiles = await response.json();
        setFiles(existingFiles);
        onFilesChange?.(existingFiles);
      }
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setError(null);

    // Check file count
    if (files.length + fileList.length > maxFiles) {
      setError(`ניתן להעלות עד ${maxFiles} קבצים`);
      return;
    }

    const validFiles: File[] = [];

    // Validate files
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setError(`הקובץ ${file.name} גדול מדי (מקסימום ${maxFileSize}MB)`);
        return;
      }

      // Check file type
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
        setError(`סוג קובץ לא נתמך: ${file.name}`);
        return;
      }

      validFiles.push(file);
    }

    // Upload files
    setUploading(true);
    try {
      for (const file of validFiles) {
        await uploadFile(file);
      }
      await loadFiles(); // Reload to get updated list
    } catch (error) {
      setError("שגיאה בהעלאת הקבצים");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityId", entityId);
    formData.append("entityType", entityType);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  };

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/files`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        const updatedFiles = files.filter((f) => f.id !== fileId);
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);
      }
    } catch (error) {
      setError("שגיאה במחיקת הקובץ");
    }
  };

  const downloadFile = (file: FileItem) => {
    window.open(file.url, "_blank");
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type === "application/pdf")
      return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes("word"))
      return <FileText className="h-4 w-4 text-blue-500" />;
    if (type.includes("excel") || type.includes("sheet"))
      return <FileText className="h-4 w-4 text-green-500" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="mr-2 text-gray-600">טוען קבצים...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip,.rar"
        />

        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 font-medium"
              disabled={uploading}
            >
              לחץ להעלאת קבצים
            </button>
            <span className="text-gray-600"> או גרור קבצים לכאן</span>
          </div>
          <p className="text-xs text-gray-500">
            PDF, Word, Excel, תמונות, ZIP - עד {maxFileSize}MB לקובץ
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-blue-700 text-sm">מעלה קבצים...</span>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-900">
            קבצים מצורפים ({files.length})
          </h5>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} •{" "}
                      {new Date(file.uploadedAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="הורד"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="מחק"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && files.length === 0 && !uploading && (
        <div className="text-center py-4">
          <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">אין קבצים מצורפים</p>
        </div>
      )}
    </div>
  );
}
