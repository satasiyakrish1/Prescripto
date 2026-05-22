import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    // Optional link to an existing registered user
    memberUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null, index: true },
    relation: { type: String, required: true }, // Father, Mother, Spouse, Child, etc.
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: 'Not Selected' },
    bloodGroup: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    medicalConditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    image: { type: String, default: '' },
    entryId: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    }, // Unique 6-digit Entry ID
    createdAt: { type: Date, default: Date.now }
});

const familySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    familyName: { type: String, default: 'My Family' },
    members: [familyMemberSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Generate unique 6-digit Entry ID
familySchema.statics.generateEntryId = async function() {
    let entryId;
    let exists = true;
    
    while (exists) {
        // Generate random 6-digit number
        entryId = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Check if it already exists in any family member
        const familyWithId = await this.findOne({ 'members.entryId': entryId });
        exists = !!familyWithId;
    }
    
    return entryId;
};

const familyModel = mongoose.models.family || mongoose.model("family", familySchema);
export default familyModel;
