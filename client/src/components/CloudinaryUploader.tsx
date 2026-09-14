import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  FileCode,
  Image as ImageIcon,
  Check,
  Copy,
  ExternalLink,
  Key,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface CloudinaryUploaderProps {
  onUploadSuccess?: (result: {
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    resourceType: string;
    bytes: number;
    optimizeUrl?: string;
    autoCropUrl?: string;
  }) => void;
  folder?: string;
  label?: string;
  allowedTypes?: string;
  compact?: boolean;
}

export function CloudinaryUploader({
  onUploadSuccess,
  folder = "rasi_maths_uploads",
  label = "Upload file (Image, PDF, Word doc)",
  allowedTypes = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
  compact = false,
}: CloudinaryUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string>(() => localStorage.getItem("cloudinary_api_secret") || "");
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const statusQuery = trpc.cloudinary.status.useQuery(undefined, { retry: false });
  const uploadMutation = trpc.cloudinary.upload.useMutation();

  const handleUpload = async (uploadFile: File) => {
    // Check if secret is required
    const hasSecret = statusQuery.data?.hasSecret || Boolean(apiSecret.trim());
    if (!hasSecret) {
      setShowSecretModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await uploadMutation.mutateAsync({
          fileData: base64Data,
          folder,
          apiSecret: apiSecret.trim() || undefined,
          resourceType: "auto",
        });

        setUploadResult(res);
        toast.success(`File uploaded to Cloudinary successfully! (${res.resourceType})`);

        if (onUploadSuccess) {
          onUploadSuccess(res);
        }
      } catch (err: any) {
        if (err.message?.includes("API Secret")) {
          setShowSecretModal(true);
        } else {
          toast.error(err.message || "Failed to upload file to Cloudinary");
        }
      }
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadResult(null);

    // If it's an image, create a preview
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }

    // Auto-upload the file
    handleUpload(selectedFile);
  };

  const saveSecretAndUpload = () => {
    if (!apiSecret.trim()) {
      return toast.error("Please enter your Cloudinary API Secret");
    }
    localStorage.setItem("cloudinary_api_secret", apiSecret.trim());
    setShowSecretModal(false);
    if (file) handleUpload(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Cloudinary URL copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getFileIcon = (fileType: string, format?: string) => {
    if (fileType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(format || "")) {
      return <ImageIcon className="h-6 w-6 text-purple-600" />;
    }
    if (fileType.includes("pdf") || format === "pdf") {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    return <FileCode className="h-6 w-6 text-blue-500" />;
  };

  return (
    <div className="w-full rounded-2xl border border-[#e2d8e8] bg-[#fffdfa] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold uppercase tracking-[0.14em] text-[#6d4b9f] flex items-center gap-2">
          <Upload size={15} /> {label}
        </label>
        <span className="text-[10px] rounded-full bg-[#f3ecf8] px-2.5 py-0.5 font-semibold text-[#8261b5]">
          Cloudinary ({statusQuery.data?.cloudName || "bp9b7ok6"})
        </span>
      </div>

      {/* File Dropzone */}
      <div className="relative border-2 border-dashed border-[#d9ceea] rounded-xl p-4 text-center hover:border-[#805ad5] transition bg-[#faf7fc]">
        <input
          type="file"
          accept={allowedTypes}
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-[#e0d6eb]" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-[#efe7f7] grid place-items-center">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-[#32234e] truncate">{file.name}</p>
                <p className="text-[11px] text-[#8d7ea6]">{(file.size / 1024).toFixed(1)} KB · {file.type || "Document"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-2 text-xs font-semibold z-10">
              {uploadMutation.isPending ? (
                <span className="text-[#805ad5] flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Uploading...</span>
              ) : uploadResult ? (
                <span className="text-green-600 flex items-center gap-1"><Check size={14} /> Uploaded</span>
              ) : (
                <span className="text-[#8d7ea6]">Ready</span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-3 cursor-pointer">
            <Upload className="mx-auto h-8 w-8 text-[#9878d4] mb-2" />
            <p className="text-xs font-semibold text-[#483468]">Click or drag a file to upload</p>
            <p className="text-[10px] text-[#8e7e9f] mt-1">Supports Images, PDFs, Word (.doc/.docx), Excel, Text</p>
          </div>
        )}
      </div>

      {/* Cloudinary API Secret Input Modal / Notice */}
      {showSecretModal && (
        <div className="mt-3 p-3 rounded-xl bg-[#fff5f5] border border-[#feb2b2]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#c53030]">
            <Key size={15} /> Cloudinary API Secret Required
          </div>
          <p className="text-[11px] text-[#742a2a] mt-1">
            Please enter your Cloudinary API Secret for cloud <code className="bg-white px-1 rounded border">bp9b7ok6</code>:
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              placeholder="Paste your Cloudinary API secret..."
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#feb2b2] outline-none"
            />
            <button
              type="button"
              onClick={saveSecretAndUpload}
              className="px-3 py-1.5 bg-[#c53030] text-white text-xs font-bold rounded-lg hover:bg-[#9b2c2c]"
            >
              Save & Upload
            </button>
          </div>
        </div>
      )}

      {/* Uploaded File Result & Links */}
      {uploadResult && (
        <div className="mt-3 p-3 rounded-xl bg-[#f0eaff] border border-[#d6c7fc] text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#4c2889] flex items-center gap-1.5">
              <Check size={14} className="text-green-600" /> Uploaded to Cloudinary
            </span>
            <span className="text-[10px] uppercase font-bold text-[#6b52d9] bg-white px-2 py-0.5 rounded-full border border-[#d6c7fc]">
              {uploadResult.format || uploadResult.resourceType}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded-lg border border-[#e2d8f7]">
            <input
              type="text"
              readOnly
              value={uploadResult.secureUrl}
              className="flex-1 text-[11px] text-[#332057] outline-none font-mono bg-transparent truncate"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(uploadResult.secureUrl)}
              className="p-1 text-[#6b52d9] hover:bg-[#f0eaff] rounded"
              title="Copy URL"
            >
              {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
            <a
              href={uploadResult.secureUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 text-[#6b52d9] hover:bg-[#f0eaff] rounded"
              title="Open link"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Special Cloudinary transformations for images (Auto-crop & Optimize) */}
          {uploadResult.resourceType === "image" && (
            <div className="mt-2 pt-2 border-t border-[#e2d8f7] flex flex-wrap gap-2 text-[10px]">
              {uploadResult.optimizeUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(uploadResult.optimizeUrl!)}
                  className="px-2 py-1 bg-white hover:bg-[#f4eeff] text-[#553c9a] font-semibold rounded-md border border-[#d6c7fc] flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-yellow-600" /> Copy Optimized Image URL
                </button>
              )}
              {uploadResult.autoCropUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(uploadResult.autoCropUrl!)}
                  className="px-2 py-1 bg-white hover:bg-[#f4eeff] text-[#553c9a] font-semibold rounded-md border border-[#d6c7fc] flex items-center gap-1"
                >
                  <RefreshCw size={11} className="text-blue-600" /> Copy Auto-Crop (500x500)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
