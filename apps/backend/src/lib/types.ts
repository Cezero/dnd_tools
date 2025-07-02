import { z, ZodSchema } from "zod";

export type InferOrDefault<T extends ZodSchema | undefined, Fallback> =
    T extends ZodSchema ? z.infer<T> : Fallback;
