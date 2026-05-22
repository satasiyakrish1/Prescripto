import BedCategory from '../models/BedCategory.js';
import Ward from '../models/wardModel.js';

export const createBedCategory = async (req, res) => {
    try {
        const { name, pricePerDay, description } = req.body;

        if (!name || pricePerDay == null) {
            return res.status(400).json({ message: 'Name and pricePerDay are required' });
        }

        const existing = await BedCategory.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'Bed category with this name already exists' });
        }

        const category = await BedCategory.create({
            name: name.trim(),
            pricePerDay,
            description: description || ''
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating bed category:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getBedCategories = async (req, res) => {
    try {
        const categories = await BedCategory.find().sort({ name: 1 }).lean();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching bed categories:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateBedCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, pricePerDay, description } = req.body;

        const update = {};
        if (name) update.name = name.trim();
        if (pricePerDay != null) update.pricePerDay = pricePerDay;
        if (description !== undefined) update.description = description;

        const category = await BedCategory.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true
        });

        if (!category) {
            return res.status(404).json({ message: 'Bed category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error('Error updating bed category:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteBedCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const inUse = await Ward.exists({ 'beds.categoryId': id });
        if (inUse) {
            return res.status(400).json({ message: 'Cannot delete category that is in use by beds' });
        }

        const result = await BedCategory.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Bed category not found' });
        }

        res.status(200).json({ message: 'Bed category deleted successfully' });
    } catch (error) {
        console.error('Error deleting bed category:', error);
        res.status(500).json({ message: error.message });
    }
};

