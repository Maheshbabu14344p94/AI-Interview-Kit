import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const KitSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  input: {
    jd: String,
    company_url: String,
    days: Number,
    fingerprint: String
  },
  kit: mongoose.Schema.Types.Mixed,
  generation: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

const PracticeSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  kitId: mongoose.Schema.Types.ObjectId,
  flashcardId: String,
  confidence: Number,
  completedAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const KitModel = mongoose.models.Kit || mongoose.model("Kit", KitSchema);
export const Practice = mongoose.models.Practice || mongoose.model("Practice", PracticeSchema);
