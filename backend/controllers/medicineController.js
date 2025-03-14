import axios from 'axios';
import Medicine from '../models/medicineModel.js';

const FDA_API_BASE_URL = 'https://api.fda.gov/drug';

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
                medicines: [],
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    pages: 0
                }
            });
        }
        
        const medicines = response.data.results.map(drug => ({
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

export const getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        
        res.json(medicine);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};