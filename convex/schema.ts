import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { tables } from "./betterAuth/schema";

const schema = defineSchema({
  ...tables,
  tasks: defineTable({
    text: v.string(),
  }),
});

export default schema;
