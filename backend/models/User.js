const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, default: '' } 
}, { timestamps: false, versionKey: false, strict: true });

// Extra safety: ensure only allowed fields are saved or updated.
const ALLOWED_FIELDS = ['username', 'email', 'password', 'image'];

// Before saving a new document, remove any keys not in ALLOWED_FIELDS.
UserSchema.pre('save', function (next) {
  try {
    const doc = this;
    Object.keys(doc.toObject()).forEach((key) => {
      if (key === '_id') return; // keep _id
      if (!ALLOWED_FIELDS.includes(key)) {
        // Setting to undefined prevents Mongoose from persisting the field
        doc.set(key, undefined);
      }
    });
    next();
  } catch (err) {
    next(err);
  }
});

// Prevent updates from accidentally setting disallowed fields (including createdAt/updatedAt/__v)
UserSchema.pre('findOneAndUpdate', function (next) {
  try {
    const update = this.getUpdate() || {};
    // If update contains $set, sanitize it; otherwise sanitize root-level fields
    const sanitize = (obj) => {
      Object.keys(obj || {}).forEach((k) => {
        if (k === '_id') return;
        if (!ALLOWED_FIELDS.includes(k)) delete obj[k];
      });
    };
    if (update.$set) sanitize(update.$set);
    sanitize(update);
    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
});

// Sanitize insertMany docs (Model.create uses insertMany under the hood)
UserSchema.pre('insertMany', function (next, docs) {
  try {
    docs.forEach((doc) => {
      Object.keys(doc).forEach((k) => {
        if (k === '_id') return;
        if (!ALLOWED_FIELDS.includes(k)) delete doc[k];
      });
    });
    next();
  } catch (err) {
    next(err);
  }
});

// Sanitize updateMany and updateOne operations
const sanitizeUpdateMiddleware = function (next) {
  try {
    const update = this.getUpdate() || {};
    const sanitize = (obj) => {
      Object.keys(obj || {}).forEach((k) => {
        if (k === '_id') return;
        if (!ALLOWED_FIELDS.includes(k)) delete obj[k];
      });
    };
    if (update.$set) sanitize(update.$set);
    sanitize(update);
    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
};

UserSchema.pre('updateMany', sanitizeUpdateMiddleware);
UserSchema.pre('updateOne', sanitizeUpdateMiddleware);
UserSchema.pre('update', sanitizeUpdateMiddleware);

module.exports = mongoose.model('User', UserSchema);