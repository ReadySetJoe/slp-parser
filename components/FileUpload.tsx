import { useRef, useState } from "react";

const MAX_FILES = 100;
interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  loading: boolean;
  error: string | null;
}

export default function FileUpload({
  onFileUpload,
  loading,
  error,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.endsWith(".slp")
      );

      if (validFiles.length > 0) {
        setSelectedFiles((prevFiles) => {
          const combined = [...prevFiles, ...validFiles];
          if (combined.length > MAX_FILES) {
            alert(
              `You can upload a maximum of ${MAX_FILES} files. Only the first ${MAX_FILES} will be used.`
            );
            return combined.slice(0, MAX_FILES);
          }
          return combined;
        });
      } else {
        alert("Please upload .slp files only");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter((file) =>
        file.name.endsWith(".slp")
      );
      if (validFiles.length > 0) {
        setSelectedFiles((prevFiles) => {
          const combined = [...prevFiles, ...validFiles];
          if (combined.length > MAX_FILES) {
            alert(
              `You can upload a maximum of ${MAX_FILES} files. Only the first ${MAX_FILES} will be used.`
            );
          }
          return combined.slice(0, MAX_FILES);
        });
      } else {
        alert("Please upload .slp files only");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onFileUpload(selectedFiles);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 mb-4 flex flex-col items-center justify-center ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          className="w-12 h-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="mb-2 text-sm text-gray-500">
          <span className="font-semibold">Click to upload</span> or drag and
          drop
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Slippi replay files (.slp) only
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".slp"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
          multiple
        />

        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          disabled={loading}
        >
          Select Files
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Selected files:</p>
          <p className="text-sm text-gray-600">
            {selectedFiles.slice(0, 3).map((file, index) => (
              <span key={index} className="font-semibold">
                {file.name}
                {index < Math.min(selectedFiles.length, 3) - 1 ? ", " : ""}
              </span>
            ))}
            {selectedFiles.length > 3 && (
              <span className="text-gray-500">
                {" "}
                and {selectedFiles.length - 3} more
              </span>
            )}
          </p>
          <button
            onClick={handleSubmit}
            className={`mt-4 mr-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Replays"}
          </button>
          <button
            onClick={() => setSelectedFiles([])}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            disabled={loading}
          >
            Clear Selection
          </button>
        </div>
      )}

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
}
