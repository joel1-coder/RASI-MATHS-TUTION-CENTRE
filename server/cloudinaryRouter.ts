import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { CLOUDINARY_DEFAULTS, getCloudinaryTransformations, uploadToCloudinary } from "./cloudinary";
import { TRPCError } from "@trpc/server";

export const cloudinaryRouter = router({
  status: publicProcedure.query(() => {
    const hasSecret = Boolean(process.env.CLOUDINARY_API_SECRET || CLOUDINARY_DEFAULTS.api_secret);
    return {
      cloudName: CLOUDINARY_DEFAULTS.cloud_name,
      apiKey: CLOUDINARY_DEFAULTS.api_key,
      hasSecret,
    };
  }),

  upload: publicProcedure
    .input(
      z.object({
        fileData: z.string().min(1, "File data or URL is required"),
        folder: z.string().optional().default("rasi_maths_uploads"),
        publicId: z.string().optional(),
        apiSecret: z.string().optional(),
        resourceType: z.enum(["auto", "image", "raw", "video"]).optional().default("auto"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await uploadToCloudinary({
          fileData: input.fileData,
          folder: input.folder,
          publicId: input.publicId,
          apiSecret: input.apiSecret,
          resourceType: input.resourceType,
        });
        return result;
      } catch (error: any) {
        console.error("[Cloudinary Upload Error]", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to upload file to Cloudinary.",
        });
      }
    }),

  transform: publicProcedure
    .input(
      z.object({
        publicId: z.string().min(1),
      })
    )
    .query(({ input }) => {
      return getCloudinaryTransformations(input.publicId);
    }),
});
