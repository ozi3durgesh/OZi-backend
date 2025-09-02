import { Request, Response } from 'express';
import { Product } from '../models/productModel'; // ✅ fixed typo

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const {
            CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
            ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
            Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
            InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
            ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
            ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
        } = req.body;

        // ✅ Check if SKU already exists
        const existingProduct = await Product.findOne({ where: { SKU } });
        if (existingProduct) {
            return res.status(400).json({
                message: `Product with SKU ${SKU} already exists`,
                existingProduct,
            });
        }

        // ✅ Create new product
        const product = await Product.create({
            CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
            ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
            Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
            InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
            ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
            ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
        });

        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: 'Error creating product', error });
    }
};

// Update an existing product
export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
        ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
        Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
        InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
        ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
        ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
    } = req.body;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.update({
            CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
            ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
            Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
            InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
            ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
            ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
        });

        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating product', error });
    }
};

// Get a product by SKU
export const getProductBySKU = async (req: Request, res: Response) => {
    const { sku } = req.params; // Extract SKU from URL parameter

    try {
        // Find the product by SKU
        const product = await Product.findOne({ where: { SKU: sku } });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching product', error });
    }
};

// Get list of products
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.findAll();
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching products', error });
    }
};
