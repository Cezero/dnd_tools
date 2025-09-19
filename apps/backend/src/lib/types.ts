import { z, ZodType } from "zod";

export type InferOrDefault<T extends ZodType | undefined, Fallback> =
    T extends ZodType ? z.infer<T> : Fallback;
