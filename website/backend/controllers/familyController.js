import familyModel from '../models/familyModel.js';
import userModel from '../models/userModel.js';

// Create or update family
const createOrUpdateFamily = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { familyName } = req.body;

        // Check if family already exists for this user
        let family = await familyModel.findOne({ userId });

        if (family) {
            family.familyName = familyName || family.familyName;
            family.updatedAt = Date.now();
            await family.save();
        } else {
            family = new familyModel({
                userId,
                familyName: familyName || 'My Family',
                members: []
            });
            await family.save();
        }

        res.json({ success: true, message: 'Family created/updated successfully', family });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add family member
const addFamilyMember = async (req, res) => {
    try {
        const userId = req.body.userId;
        const memberData = req.body.member;
        const memberUserId = memberData.memberUserId || null;

        // Enforce that a family member must be linked to an existing Prescripto user
        if (!memberUserId) {
            return res.status(400).json({ success: false, message: 'A Prescripto user link is required (select an existing user).' });
        }

        // If linking to an existing user, fetch their basic details to prefill and ensure consistency
        let linkedUser = null;
        if (memberUserId) {
            linkedUser = await userModel.findById(memberUserId).select('name email phone image gender dob');
            if (!linkedUser) {
                return res.json({ success: false, message: 'Linked user not found' });
            }
        }

        // Generate unique Entry ID
        const entryId = await familyModel.generateEntryId();

        let family = await familyModel.findOne({ userId });

        if (!family) {
            // Create new family if doesn't exist
            family = new familyModel({
                userId,
                familyName: 'My Family',
                members: []
            });
        }

        // Add the new member with Entry ID
        family.members.push({
            ...memberData,
            // enforce consistent fields from linked user when provided
            ...(linkedUser ? {
                memberUserId: linkedUser._id,
                name: memberData.name || linkedUser.name,
                email: memberData.email || linkedUser.email || '',
                phone: memberData.phone || linkedUser.phone || '',
                image: memberData.image || linkedUser.image || ''
            } : {}),
            entryId,
            createdAt: Date.now()
        });

        family.updatedAt = Date.now();
        await family.save();

        res.json({ 
            success: true, 
            message: 'Family member added successfully', 
            entryId,
            family 
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get family details
const getFamily = async (req, res) => {
    try {
        const userId = req.body.userId;

        const family = await familyModel.findOne({ userId }).populate('userId', 'name email');

        if (!family) {
            return res.json({ success: false, message: 'No family found' });
        }

        res.json({ success: true, family });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update family member
const updateFamilyMember = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { memberId, memberData } = req.body;

        const family = await familyModel.findOne({ userId });

        if (!family) {
            return res.json({ success: false, message: 'Family not found' });
        }

        const member = family.members.id(memberId);
        if (!member) {
            return res.json({ success: false, message: 'Member not found' });
        }

        // Update member fields
        Object.keys(memberData).forEach(key => {
            if (key !== 'entryId' && key !== '_id') { // Don't allow changing Entry ID
                member[key] = memberData[key];
            }
        });

        family.updatedAt = Date.now();
        await family.save();

        res.json({ success: true, message: 'Member updated successfully', family });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete family member
const deleteFamilyMember = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { memberId } = req.body;

        const family = await familyModel.findOne({ userId });

        if (!family) {
            return res.json({ success: false, message: 'Family not found' });
        }

        family.members.pull(memberId);
        family.updatedAt = Date.now();
        await family.save();

        res.json({ success: true, message: 'Member deleted successfully', family });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get member by Entry ID
const getMemberByEntryId = async (req, res) => {
    try {
        const { entryId } = req.params;

        const family = await familyModel.findOne({ 'members.entryId': entryId });

        if (!family) {
            return res.json({ success: false, message: 'No member found with this Entry ID' });
        }

        const member = family.members.find(m => m.entryId === entryId);

        res.json({ success: true, member, familyName: family.familyName });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Verify Entry ID (check if it exists)
const verifyEntryId = async (req, res) => {
    try {
        const { entryId } = req.body;

        const family = await familyModel.findOne({ 'members.entryId': entryId });

        if (!family) {
            return res.json({ success: false, message: 'Invalid Entry ID' });
        }

        const member = family.members.find(m => m.entryId === entryId);

        res.json({ 
            success: true, 
            message: 'Entry ID verified',
            member: {
                name: member.name,
                relation: member.relation,
                entryId: member.entryId
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    createOrUpdateFamily,
    addFamilyMember,
    getFamily,
    updateFamilyMember,
    deleteFamilyMember,
    getMemberByEntryId,
    verifyEntryId
};
