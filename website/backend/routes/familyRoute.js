import express from 'express';
import { 
    createOrUpdateFamily, 
    addFamilyMember, 
    getFamily, 
    updateFamilyMember, 
    deleteFamilyMember,
    getMemberByEntryId,
    verifyEntryId
} from '../controllers/familyController.js';
import authUser from '../middleware/authUser.js';

const familyRouter = express.Router();

// Protected routes (require authentication)
familyRouter.post("/create", authUser, createOrUpdateFamily);
familyRouter.post("/add-member", authUser, addFamilyMember);
familyRouter.get("/get-family", authUser, getFamily);
familyRouter.post("/update-member", authUser, updateFamilyMember);
familyRouter.post("/delete-member", authUser, deleteFamilyMember);

// Public routes for Entry ID verification
familyRouter.get("/member/:entryId", getMemberByEntryId);
familyRouter.post("/verify-entry-id", verifyEntryId);

export default familyRouter;
