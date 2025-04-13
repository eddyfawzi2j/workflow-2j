import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";
import { X, Upload, FileText, FileImage, File } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploadProps {
  value?: FileWithPreview[];
  onChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  },
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Create previews for images
      const newFiles = acceptedFiles.map(file => 
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        })
      );

      const updatedFiles = [...files];
      
      // Add new files without exceeding max
      for (let i = 0; i < newFiles.length; i++) {
        if (updatedFiles.length < maxFiles) {
          updatedFiles.push(newFiles[i]);
        } else {
          break;
        }
      }
      
      setFiles(updatedFiles);
      onChange(updatedFiles);
    },
    [files, maxFiles, onChange]
  );

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    
    // Revoke the object URL to avoid memory leaks
    if (updatedFiles[index].preview) {
      URL.revokeObjectURL(updatedFiles[index].preview!);
    }
    
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
    disabled: files.length >= maxFiles,
  });

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith("image/")) {
      return file.preview ? (
        <img 
          src={file.preview} 
          alt={file.name} 
          className="h-10 w-10 object-cover rounded"
        />
      ) : (
        <FileImage className="h-10 w-10 text-blue-500" />
      );
    } else if (file.type === "application/pdf") {
      return <FileText className="h-10 w-10 text-red-500" />;
    } else if (file.type.includes("spreadsheet") || file.type.includes("excel")) {
      return <FileText className="h-10 w-10 text-green-500" />;
    } else if (file.type.includes("word") || file.type.includes("document")) {
      return <FileText className="h-10 w-10 text-blue-500" />;
    } else {
      return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300",
          isDragReject && "border-red-500 bg-red-50",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium text-primary">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF, DOCX, XLSX, JPG, PNG up to {maxSize / (1024 * 1024)}MB
          </p>
          {files.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {files.length} of {maxFiles} files uploaded
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between space-x-2 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 truncate">
                {getFileIcon(file)}
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
