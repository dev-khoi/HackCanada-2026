import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

const UserSchema = new Schema<IUser>({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String },
  username: { type: String },
  picture: { type: String },
  location: { type: String },
  backboardProfileRef: { type: String },
  styleProfileJSON: { type: Object },
});

export default mongoose.model<IUser>("User", UserSchema);
