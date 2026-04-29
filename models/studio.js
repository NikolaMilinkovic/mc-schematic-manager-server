const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudioSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Studio name is required'],
		trim: true,
		minlength: [2, 'Studio name must be at least 2 characters long'],
		maxlength: [80, 'Studio name must be at most 80 characters long'],
	},
	owner_user_id: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Studio owner is required'],
	},
	profile_image: {
		key: {
			type: String,
			trim: true,
		},
		url: {
			type: String,
			trim: true,
		},
	},
	studio_users: [{ type: Schema.Types.ObjectId, ref: 'StudioUser' }],
	members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	created_at: { type: Date, required: true, default: Date.now },
	last_updated: { type: Date, default: Date.now },
	is_active: { type: Boolean, default: true },
	settings: {
		allow_member_invites: { type: Boolean, default: false },
	},
});

StudioSchema.index({ owner_user_id: 1 });
StudioSchema.index({ studio_users: 1 });
StudioSchema.index({ members: 1 });
StudioSchema.index({ owner_user_id: 1, name: 1 }, { unique: true });

StudioSchema.pre('save', function (next) {
	this.last_updated = new Date();
	next();
});

module.exports = mongoose.model('Studio', StudioSchema);
