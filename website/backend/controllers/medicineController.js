import axios from 'axios';
import Medicine from '../models/Medicine.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FDA_API_BASE_URL = 'https://api.fda.gov/drug';

// Initialize Google AI
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
if (!GOOGLE_AI_KEY || GOOGLE_AI_KEY === 'YOUR_GOOGLE_AI_API_KEY_HERE') {
    console.warn('⚠️  WARNING: Google AI API key not configured. AI medicine briefs will not work.');
    console.warn('   Get your free API key from: https://makersuite.google.com/app/apikey');
}
const genAI = GOOGLE_AI_KEY ? new GoogleGenerativeAI(GOOGLE_AI_KEY) : null;

export const searchMedicines = async (req, res) => {
    try {
        const { query, page = 1, limit = 20 } = req.query;

        // Search FDA API with focus on medical information
        let searchQuery = query
            ? `search=(openfda.brand_name:"${query}" OR openfda.generic_name:"${query}" OR purpose:"${query}" OR indications_and_usage:"${query}" OR openfda.pharm_class_epc:"${query}")`
            : 'search=_exists_:openfda.brand_name';

        const response = await axios.get(`${FDA_API_BASE_URL}/label.json?${searchQuery}&limit=${limit}`);
        if (!response.data.results || response.data.results.length === 0) {
            return res.json({
                success: true,
                medicines: [],
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    pages: 0
                }
            });
        }

        const medicines = response.data.results.map((drug, index) => ({
            _id: `${Buffer.from(drug.openfda?.brand_name?.[0] || 'unknown').toString('base64')}_${index}`,
            name: drug.openfda?.brand_name?.[0] || 'N/A',
            genericName: drug.openfda?.generic_name?.[0] || 'N/A',
            drugClass: drug.openfda?.pharm_class_epc?.[0] || 'N/A',
            composition: drug.active_ingredient?.[0] || 'N/A',
            dosageForm: drug.dosage_form?.[0] || 'N/A',
            strength: drug.openfda?.strength?.[0] || 'N/A',
            description: drug.description?.[0] || 'N/A',
            indications: drug.indications_and_usage?.[0] || 'N/A',
            usage: drug.dosage_and_administration?.[0] || 'N/A',
            contraindications: drug.contraindications?.[0] || 'N/A',
            sideEffects: drug.adverse_reactions?.[0]?.split('.').filter(Boolean) || [],
            warnings: drug.boxed_warnings?.[0]?.split('.').filter(Boolean) || [],
            precautions: drug.warnings?.[0]?.split('.').filter(Boolean) || [],
            interactions: drug.drug_interactions?.[0]?.split('.').filter(Boolean) || [],
            storage: drug.storage_and_handling?.[0] || 'N/A',
            pregnancy: drug.pregnancy?.[0] || 'N/A',
            clinicalPharmacology: drug.clinical_pharmacology?.[0] || 'N/A'
        }));

        res.json({
            success: true,
            medicines,
            pagination: {
                total: response.data.meta.results.total,
                page: parseInt(page),
                pages: Math.ceil(response.data.meta.results.total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



// Get all medicine categories
export const getMedicineCategories = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy?.id;
        if (!pharmacyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No pharmacyId found.' });
        }

        // Get distinct categories for this pharmacy
        const categories = await Medicine.distinct('category', { pharmacyId, isActive: true });

        return res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get medicine categories error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching medicine categories",
            error: error.message
        });
    }
};

export const getMedicineById = async (req, res) => {
    try {
        const [encodedName] = req.params.id.split('_');
        const decodedName = Buffer.from(encodedName, 'base64').toString();

        // Search FDA API for the specific medicine
        const searchQuery = `search=openfda.brand_name:"${decodedName}"&limit=1`;
        const response = await axios.get(`${FDA_API_BASE_URL}/label.json?${searchQuery}`);

        if (!response.data.results || response.data.results.length === 0) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        const drug = response.data.results[0];
        const medicine = {
            _id: req.params.id,
            name: drug.openfda?.brand_name?.[0] || 'N/A',
            genericName: drug.openfda?.generic_name?.[0] || 'N/A',
            drugClass: drug.openfda?.pharm_class_epc?.[0] || 'N/A',
            composition: drug.active_ingredient?.[0] || 'N/A',
            dosageForm: drug.dosage_form?.[0] || 'N/A',
            strength: drug.openfda?.strength?.[0] || 'N/A',
            description: drug.description?.[0] || 'N/A',
            indications: drug.indications_and_usage?.[0] || 'N/A',
            usage: drug.dosage_and_administration?.[0] || 'N/A',
            contraindications: drug.contraindications?.[0] || 'N/A',
            sideEffects: drug.adverse_reactions?.[0]?.split('.').filter(Boolean) || [],
            warnings: drug.boxed_warnings?.[0]?.split('.').filter(Boolean) || [],
            precautions: drug.warnings?.[0]?.split('.').filter(Boolean) || [],
            interactions: drug.drug_interactions?.[0]?.split('.').filter(Boolean) || [],
            storage: drug.storage_and_handling?.[0] || 'N/A',
            pregnancy: drug.pregnancy?.[0] || 'N/A',
            clinicalPharmacology: drug.clinical_pharmacology?.[0] || 'N/A'
        };

        res.json(medicine);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get pharmacy inventory
export const getInventory = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy?.id;
        if (!pharmacyId) {
            console.error('No pharmacyId found in request. Auth middleware may be misconfigured or token is missing.');
            return res.status(401).json({ success: false, message: 'Unauthorized: No pharmacyId found.' });
        }
        // Get query parameters for filtering and sorting
        const { search, category, sortBy = 'name', order = 'asc' } = req.query;
        // Build filter object
        const filter = { pharmacyId };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category && category !== 'all') {
            filter.category = category;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = order === 'asc' ? 1 : -1;
        // Debug logging
        console.log('[getInventory] pharmacyId:', pharmacyId);
        console.log('[getInventory] filter:', JSON.stringify(filter));
        console.log('[getInventory] sort:', JSON.stringify(sort));
        // Get medicines from database
        const medicines = await Medicine.find(filter).sort(sort);
        return res.json({
            success: true,
            data: medicines
        });
    } catch (error) {
        console.error('Inventory fetch error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching inventory (see server logs for details)",
            error: error.message
        });
    }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy.id;

        // Get inventory statistics
        const stats = await Medicine.getInventoryStats(pharmacyId);

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Inventory stats error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching inventory statistics",
            error: error.message
        });
    }
};

// Add new medicine
export const addMedicine = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy.id;

        // Create new medicine with pharmacy ID
        const medicine = new Medicine({
            ...req.body,
            pharmacyId,
            stock: parseInt(req.body.stock) || 0,
            price: parseFloat(req.body.price) || 0,
            minStockLevel: parseInt(req.body.minStockLevel) || 10,
            workAble: req.body.workAble !== undefined ? req.body.workAble : true
        });

        // Save medicine to database
        await medicine.save();

        return res.json({
            success: true,
            message: "Medicine added successfully",
            data: medicine
        });
    } catch (error) {
        console.error('Add medicine error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while adding medicine",
            error: error.message
        });
    }
};

// Update medicine
export const updateMedicine = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy.id;

        // Check if medicine exists and belongs to this pharmacy
        const medicine = await Medicine.findOne({
            _id: req.params.id,
            pharmacyId
        });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found or you don't have permission to update it"
            });
        }

        // Update medicine
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                stock: parseInt(req.body.stock) || medicine.stock,
                price: parseFloat(req.body.price) || medicine.price,
                minStockLevel: parseInt(req.body.minStockLevel) || medicine.minStockLevel,
                workAble: req.body.workAble !== undefined ? req.body.workAble : medicine.workAble,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        return res.json({
            success: true,
            message: "Medicine updated successfully",
            data: updatedMedicine
        });
    } catch (error) {
        console.error('Update medicine error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating medicine",
            error: error.message
        });
    }
};

// Update stock quantity
export const updateStock = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy.id;

        // Get request body
        const { quantity, operation } = req.body;

        if (!quantity || !operation || !['add', 'subtract', 'set'].includes(operation)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. Please provide quantity and operation (add, subtract, or set)"
            });
        }

        // Check if medicine exists and belongs to this pharmacy
        const medicine = await Medicine.findOne({
            _id: req.params.id,
            pharmacyId
        });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found or you don't have permission to update it"
            });
        }

        // Calculate new stock based on operation
        let newStock = medicine.stock;
        switch (operation) {
            case 'add':
                newStock += parseInt(quantity);
                break;
            case 'subtract':
                newStock = Math.max(0, newStock - parseInt(quantity));
                break;
            case 'set':
                newStock = parseInt(quantity);
                break;
        }

        // Update medicine stock
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            { stock: newStock, updatedAt: Date.now() },
            { new: true }
        );

        return res.json({
            success: true,
            message: "Stock updated successfully",
            data: updatedMedicine
        });
    } catch (error) {
        console.error('Update stock error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating stock",
            error: error.message
        });
    }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
    try {
        // Get pharmacy ID from request object
        const pharmacyId = req.pharmacy.id;

        // Check if medicine exists and belongs to this pharmacy
        const medicine = await Medicine.findOne({
            _id: req.params.id,
            pharmacyId
        });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found or you don't have permission to delete it"
            });
        }

        // Delete medicine
        await Medicine.findByIdAndDelete(req.params.id);

        return res.json({
            success: true,
            message: "Medicine deleted successfully"
        });
    } catch (error) {
        console.error('Delete medicine error:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting medicine",
            error: error.message
        });
    }
};

// Check for potential medicine interactions
export const checkInteractions = async (req, res) => {
    try {
        const { medicines } = req.body;

        if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least two medicines to check for interactions'
            });
        }

        // Extract medicine names for logging
        const medicineNames = medicines.map(med => med.name || med).join(', ');
        console.log(`Checking interactions between: ${medicineNames}`);

        // For each medicine, try to find interaction data
        const interactionResults = [];
        let hasInteractions = false;

        // Check each pair of medicines for potential interactions
        for (let i = 0; i < medicines.length; i++) {
            for (let j = i + 1; j < medicines.length; j++) {
                const med1 = medicines[i].name || medicines[i];
                const med2 = medicines[j].name || medicines[j];

                // Search for interaction data in FDA API
                try {
                    const searchQuery = `search=(openfda.brand_name:"${med1}" AND drug_interactions:"${med2}") OR (openfda.brand_name:"${med2}" AND drug_interactions:"${med1}")`;
                    const response = await axios.get(`${FDA_API_BASE_URL}/label.json?${searchQuery}&limit=5`);

                    if (response.data.results && response.data.results.length > 0) {
                        // Found potential interaction
                        const interactionData = response.data.results.map(result => ({
                            medicine1: med1,
                            medicine2: med2,
                            interactionText: result.drug_interactions?.[0] || 'Potential interaction found, but details not available',
                            severity: 'unknown' // In a real system, you might analyze the text to determine severity
                        }));

                        interactionResults.push(...interactionData);
                        hasInteractions = true;
                    } else {
                        // No specific interaction found in FDA data
                        interactionResults.push({
                            medicine1: med1,
                            medicine2: med2,
                            interactionText: 'No specific interaction data found',
                            severity: 'none'
                        });
                    }
                } catch (error) {
                    console.error(`Error checking interaction between ${med1} and ${med2}:`, error);
                    interactionResults.push({
                        medicine1: med1,
                        medicine2: med2,
                        interactionText: 'Error checking interaction',
                        severity: 'unknown',
                        error: error.message
                    });
                }
            }
        }

        return res.json({
            success: true,
            hasInteractions,
            interactions: interactionResults
        });
    } catch (error) {
        console.error('Check interactions error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while checking medicine interactions',
            error: error.message
        });
    }
};

// Generate AI brief for medicine
export const generateMedicineBrief = async (req, res) => {
    try {
        const { medicineName, genericName, drugClass, indications, description } = req.body;

        if (!medicineName) {
            return res.status(400).json({
                success: false,
                message: 'Medicine name is required'
            });
        }

        // Check if Google AI is configured
        if (!genAI) {
            console.log('⚠️  Google AI not configured. Using fallback summary generator.');
            
            // Generate a smart fallback brief using the available data
            const fallbackBrief = generateFallbackBrief({
                medicineName,
                genericName,
                drugClass,
                indications,
                description
            });

            return res.json({
                success: true,
                brief: fallbackBrief,
                medicineName: medicineName,
                isAIGenerated: false,
                setupInstructions: 'To enable AI-powered briefs, get your free API key from https://aistudio.google.com/app/apikey and add it to your .env file as GOOGLE_AI_API_KEY'
            });
        }

        console.log(`🤖 Generating AI brief for: ${medicineName}`);

        // Create an enhanced prompt for Google AI with more detailed analysis
        const prompt = `You are an expert medical information assistant. Analyze the following medicine and provide a comprehensive, patient-friendly guide.

MEDICINE INFORMATION:
Name: ${medicineName}
Generic Name: ${genericName || 'Not specified'}
Drug Class: ${drugClass || 'Not specified'}
Dosage Form: ${dosageForm || 'Not specified'}
Strength: ${strength || 'Not specified'}
Composition: ${composition || 'Not specified'}

MEDICAL DETAILS:
Indications: ${indications || 'Not specified'}
Description: ${description || 'Not specified'}
Clinical Pharmacology: ${clinicalPharmacology || 'Not specified'}
Usage Instructions: ${usage || 'Not specified'}

SAFETY INFORMATION:
Contraindications: ${contraindications || 'Not specified'}
Side Effects: ${sideEffects ? (Array.isArray(sideEffects) ? sideEffects.join(', ') : sideEffects) : 'Not specified'}
Warnings: ${warnings ? (Array.isArray(warnings) ? warnings.join(', ') : warnings) : 'Not specified'}
Precautions: ${precautions ? (Array.isArray(precautions) ? precautions.join(', ') : precautions) : 'Not specified'}
Drug Interactions: ${interactions ? (Array.isArray(interactions) ? interactions.join(', ') : interactions) : 'Not specified'}
Pregnancy Category: ${pregnancy || 'Not specified'}
Storage: ${storage || 'Not specified'}

Please provide a comprehensive analysis in the following format:

## 🎯 What is ${medicineName}?
[2-3 sentences explaining what this medicine is and its primary purpose in simple terms]

## 💊 How It Works
[Explain the mechanism of action in patient-friendly language - how it affects the body]

## ✅ When to Use
[List the main conditions/symptoms this treats, in bullet points]

## 📋 How to Take It
[Clear, simple instructions on proper usage, dosage timing, with or without food, etc.]

## ⚠️ Important Warnings
[List the most critical warnings patients must know, in bullet points]

## 🔄 Common Side Effects
[List common side effects patients might experience, categorized by severity if possible]

## 🚫 Who Should Not Take This
[List contraindications and who should avoid this medicine]

## 💡 Pro Tips
[3-5 practical tips for patients taking this medicine - things doctors often tell patients]

## 🤝 Talk to Your Doctor If...
[List situations when patients should contact their healthcare provider]

Keep the language simple, clear, and empathetic. Use analogies where helpful. Focus on what patients really need to know.`;

        // Generate content using Google AI
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const brief = response.text();

        console.log(`✅ AI brief generated successfully for: ${medicineName}`);

        return res.json({
            success: true,
            brief: brief,
            medicineName: medicineName,
            isAIGenerated: true
        });
    } catch (error) {
        console.error('❌ Generate medicine brief error:', error);
        
        // Provide fallback on error
        const fallbackBrief = generateFallbackBrief(req.body);
        
        return res.json({
            success: true,
            brief: fallbackBrief,
            medicineName: req.body.medicineName,
            isAIGenerated: false,
            error: 'AI generation failed, showing summary from available data'
        });
    }
};

// Enhanced helper function to generate comprehensive fallback brief from available data
function generateFallbackBrief({ medicineName, genericName, drugClass, indications, description, dosageForm, strength, composition, usage, contraindications, sideEffects, warnings, precautions, interactions, storage, pregnancy, clinicalPharmacology }) {
    let brief = '';
    
    // Header with comprehensive overview
    brief += `## 🎯 What is ${medicineName}?\n\n`;
    
    // Build comprehensive introduction
    let intro = '';
    if (genericName && genericName !== 'N/A') {
        intro += `${medicineName} (generic name: ${genericName}) is `;
    } else {
        intro += `${medicineName} is `;
    }
    
    if (drugClass && drugClass !== 'N/A') {
        intro += `a medication belonging to the ${drugClass} class of drugs. `;
    } else {
        intro += `a prescription medication. `;
    }
    
    if (dosageForm && dosageForm !== 'N/A') {
        intro += `It is available as ${dosageForm.toLowerCase()}`;
        if (strength && strength !== 'N/A') {
            intro += ` in ${strength} strength`;
        }
        intro += `. `;
    }
    
    brief += intro + '\n\n';
    
    // Primary uses and indications
    if (indications && indications !== 'N/A' && indications.length > 10) {
        brief += `**Primary Uses:**\n`;
        const cleanIndications = extractKeyPoints(indications, 5);
        cleanIndications.forEach(point => {
            brief += `• ${point}\n`;
        });
        brief += `\n`;
    }
    
    // Detailed description
    if (description && description !== 'N/A' && description.length > 10) {
        brief += `## 📖 Detailed Information\n\n`;
        const cleanDescription = formatLongText(description, 1200);
        brief += `${cleanDescription}\n\n`;
    }
    
    // How it works (Mechanism of Action)
    if (clinicalPharmacology && clinicalPharmacology !== 'N/A' && clinicalPharmacology.length > 10) {
        brief += `## 💊 How It Works\n\n`;
        const cleanPharmacology = formatLongText(clinicalPharmacology, 1000);
        brief += `${cleanPharmacology}\n\n`;
        
        // Add simplified explanation
        brief += `**In Simple Terms:** This medication works by affecting specific processes in your body to achieve its therapeutic effect. The exact mechanism helps your healthcare provider determine if this is the right treatment for your condition.\n\n`;
    }
    
    // Dosage and administration
    if (usage && usage !== 'N/A' && usage.length > 10) {
        brief += `## 📋 How to Take ${medicineName}\n\n`;
        const cleanUsage = formatLongText(usage, 1000);
        brief += `${cleanUsage}\n\n`;
        
        brief += `**Important Dosing Tips:**\n`;
        brief += `• Take exactly as prescribed by your doctor\n`;
        brief += `• Do not adjust the dose without consulting your healthcare provider\n`;
        brief += `• If you miss a dose, follow your doctor's instructions\n`;
        brief += `• Do not double doses to make up for a missed one\n\n`;
    }
    
    // Composition details
    if (composition && composition !== 'N/A') {
        brief += `## 🧪 Active Ingredients\n\n`;
        brief += `**Composition:** ${composition}\n\n`;
        brief += `This information is important for identifying potential allergies or sensitivities to the medication's components.\n\n`;
    }
    
    // Side effects with categorization
    if (sideEffects && Array.isArray(sideEffects) && sideEffects.length > 0) {
        brief += `## ⚠️ Possible Side Effects\n\n`;
        brief += `Like all medications, ${medicineName} may cause side effects, although not everyone experiences them.\n\n`;
        
        const commonEffects = sideEffects.slice(0, 5);
        const otherEffects = sideEffects.slice(5, 12);
        
        if (commonEffects.length > 0) {
            brief += `**Common Side Effects:**\n`;
            commonEffects.forEach(effect => {
                if (effect && effect.trim()) {
                    brief += `• ${capitalizeFirst(effect.trim())}\n`;
                }
            });
            brief += `\n`;
        }
        
        if (otherEffects.length > 0) {
            brief += `**Other Possible Side Effects:**\n`;
            otherEffects.forEach(effect => {
                if (effect && effect.trim()) {
                    brief += `• ${capitalizeFirst(effect.trim())}\n`;
                }
            });
            brief += `\n`;
        }
        
        brief += `**When to Seek Medical Attention:** Contact your doctor immediately if you experience severe or persistent side effects, allergic reactions, or any symptoms that concern you.\n\n`;
    }
    
    // Critical warnings
    if (warnings && (Array.isArray(warnings) && warnings.length > 0 || (typeof warnings === 'string' && warnings !== 'N/A' && warnings.length > 10))) {
        brief += `## 🚨 Critical Warnings & Safety Information\n\n`;
        brief += `**READ THIS CAREFULLY - Important safety information you must know:**\n\n`;
        
        if (Array.isArray(warnings)) {
            warnings.slice(0, 10).forEach((warning, index) => {
                if (warning && warning.trim()) {
                    brief += `${index + 1}. ${capitalizeFirst(warning.trim())}\n\n`;
                }
            });
        } else {
            const cleanWarnings = formatLongText(warnings, 1200);
            brief += `${cleanWarnings}\n\n`;
        }
    }
    
    // Precautions
    if (precautions && (Array.isArray(precautions) && precautions.length > 0 || (typeof precautions === 'string' && precautions !== 'N/A' && precautions.length > 10))) {
        brief += `## 🛡️ Precautions & Special Considerations\n\n`;
        brief += `Before taking ${medicineName}, inform your doctor if you have:\n\n`;
        
        if (Array.isArray(precautions)) {
            precautions.slice(0, 10).forEach(precaution => {
                if (precaution && precaution.trim()) {
                    brief += `• ${capitalizeFirst(precaution.trim())}\n`;
                }
            });
        } else {
            const cleanPrecautions = formatLongText(precautions, 1000);
            brief += `${cleanPrecautions}\n`;
        }
        brief += `\n`;
    }
    
    // Contraindications
    if (contraindications && contraindications !== 'N/A' && contraindications.length > 10) {
        brief += `## 🚫 Who Should NOT Take This Medicine\n\n`;
        brief += `**Do not use ${medicineName} if:**\n\n`;
        const cleanContraindications = formatLongText(contraindications, 1000);
        const contraindicationPoints = extractKeyPoints(cleanContraindications, 8);
        contraindicationPoints.forEach(point => {
            brief += `• ${point}\n`;
        });
        brief += `\n`;
    }
    
    // Drug interactions
    if (interactions && (Array.isArray(interactions) && interactions.length > 0 || (typeof interactions === 'string' && interactions !== 'N/A' && interactions.length > 10))) {
        brief += `## 🔄 Drug Interactions\n\n`;
        brief += `${medicineName} may interact with other medications, vitamins, or herbal supplements. Always inform your healthcare provider about all products you use.\n\n`;
        
        if (Array.isArray(interactions)) {
            brief += `**Known Interactions:**\n`;
            interactions.slice(0, 12).forEach(interaction => {
                if (interaction && interaction.trim()) {
                    brief += `• ${capitalizeFirst(interaction.trim())}\n`;
                }
            });
        } else {
            const cleanInteractions = formatLongText(interactions, 1000);
            brief += `${cleanInteractions}\n`;
        }
        brief += `\n`;
    }
    
    // Pregnancy and breastfeeding
    if (pregnancy && pregnancy !== 'N/A' && pregnancy.length > 5) {
        brief += `## 🤰 Pregnancy, Breastfeeding & Fertility\n\n`;
        const cleanPregnancy = formatLongText(pregnancy, 800);
        brief += `${cleanPregnancy}\n\n`;
        brief += `**Important:** Always consult your doctor if you are pregnant, planning to become pregnant, or breastfeeding before taking this medication.\n\n`;
    }
    
    // Storage information
    if (storage && storage !== 'N/A' && storage.length > 5) {
        brief += `## 📦 Storage & Handling\n\n`;
        const cleanStorage = formatLongText(storage, 500);
        brief += `${cleanStorage}\n\n`;
        brief += `**General Storage Tips:**\n`;
        brief += `• Keep out of reach of children and pets\n`;
        brief += `• Store in original container\n`;
        brief += `• Do not use after expiration date\n`;
        brief += `• Dispose of unused medication properly\n\n`;
    }
    
    // Practical tips
    brief += `## 💡 Practical Tips for Taking ${medicineName}\n\n`;
    brief += `**DO:**\n`;
    brief += `✓ Take exactly as prescribed by your healthcare provider\n`;
    brief += `✓ Complete the full course of treatment (if applicable)\n`;
    brief += `✓ Keep all follow-up appointments with your doctor\n`;
    brief += `✓ Store the medication properly\n`;
    brief += `✓ Keep a list of all medications you take\n\n`;
    
    brief += `**DON'T:**\n`;
    brief += `✗ Share your medication with others\n`;
    brief += `✗ Take more or less than prescribed\n`;
    brief += `✗ Stop taking suddenly without consulting your doctor\n`;
    brief += `✗ Use expired medication\n`;
    brief += `✗ Mix with alcohol (unless approved by your doctor)\n\n`;
    
    // When to contact doctor
    brief += `## 🤝 When to Contact Your Healthcare Provider\n\n`;
    brief += `Contact your doctor or pharmacist if:\n`;
    brief += `• You experience any severe or concerning side effects\n`;
    brief += `• Your symptoms don't improve or get worse\n`;
    brief += `• You have questions about your medication\n`;
    brief += `• You miss multiple doses\n`;
    brief += `• You think you may have taken too much\n\n`;
    
    brief += `**Emergency:** Call emergency services immediately if you experience signs of a severe allergic reaction (difficulty breathing, swelling of face/throat, severe rash) or other life-threatening symptoms.\n\n`;
    
    // Footer
    brief += `---\n\n`;
    brief += `📊 **Data Source:** This comprehensive summary is compiled from FDA-approved medical information and clinical databases.\n\n`;
    brief += `🤖 **Want AI-Enhanced Analysis?** For even more detailed, personalized insights powered by Google AI, add your free API key from https://aistudio.google.com/app/apikey to your environment configuration.\n\n`;
    brief += `⚕️ **Medical Disclaimer:** This information is for educational purposes only and does not replace professional medical advice. Always consult your healthcare provider for medical decisions.`;
    
    return brief;
}

// Helper function to format long text with proper breaks
function formatLongText(text, maxLength = 1000) {
    if (!text || text === 'N/A') return '';
    
    let cleaned = text.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength).trim();
        const lastPeriod = cleaned.lastIndexOf('.');
        if (lastPeriod > maxLength * 0.8) {
            cleaned = cleaned.substring(0, lastPeriod + 1);
        } else {
            cleaned += '...';
        }
    }
    
    cleaned = cleaned.replace(/\. ([A-Z])/g, '.\n\n$1');
    return cleaned;
}

// Helper function to extract key points from text
function extractKeyPoints(text, maxPoints = 5) {
    if (!text || text === 'N/A') return [];
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, maxPoints).map(s => capitalizeFirst(s.trim()));
}

// Helper function to capitalize first letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}