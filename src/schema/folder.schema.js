import { object, string } from "zod";

export const folderSchema = object({
  body: object({
    name: string({
      required_error: "Name is required",
    }),
  }),
});
