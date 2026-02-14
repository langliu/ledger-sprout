import { defineSchema } from "convex/server";
import { tables } from "./betterAuth/schema";

const schema = defineSchema(tables);

export default schema;
