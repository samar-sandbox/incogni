import { model, Schema } from "mongoose";
import { GENDER_ENUM } from "../../enums/index.js";

const schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minLength: [3, "First name must be at least 3 characters long"],
    },
    lastName: String,
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator(value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Email must be a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [6, "Password must be at least 6 characters long"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      validate: {
        validator(value) {
          return /^01[0125][0-9]{8}$/.test(value);
        },
        message:
          "Phone number must be a valid Egyptian number starting with 010, 011, 012, or 015 and followed by 8 digits",
      },
    },
    age: {
      type: Number,
      min: [18, "Age must be greater than 18 years old"],
      max: [60, "Age must be less than 60 years old"],
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(GENDER_ENUM),
        message:
          "`{VALUE}` is not a valid enum value for path `gender`: 'male' or 'female'",
      },
      default: GENDER_ENUM.MALE,
    },
    emailConfirmed: Boolean,
    image: String,
    coverImages: [String],
    deletedAt: Date,
  },
  {
    timestamps: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

schema
  .virtual("name")
  .set(function (value = "") {
    const [firstName, lastName] = value.split(" ");

    this.firstName = firstName;
    this.lastName = lastName;
  })
  .get(function () {
    return `${this.firstName}${this.lastName ? ` ${this.lastName}` : ""}`;
  });

export const User = model("user", schema);
