import { Request, Response } from 'express';
import Product, { ProductCreationAttributes } from '../models/productModel';
import { ResponseHandler } from '../middleware/responseHandler';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { Op } from 'sequelize';
import csv from 'csv-parser';

// AWS S3 Configuration
const s3 = new AWS.S3();
const BUCKET_NAME = 'oms-stage-storage'; // Your S3 bucket name
const FOLDER_NAME = 'product-images'; // Folder inside S3

// ✅ Helper function: clean URL
const cleanUrl = (url: string | undefined) => {
  if (!url) return null;
  return url.replace(/`/g, '').trim();
};

// ✅ Helper function: upload image to S3 with SKU as filename
const uploadImageToS3 = async (imageUrl: string, sku: string) => {
  try {
    const cleanImageUrl = cleanUrl(imageUrl);
    if (!cleanImageUrl) throw new Error('Empty image URL');

    let fileExtension = '.jpg';
    try {
      const pathname = new URL(cleanImageUrl).pathname;
      fileExtension = path.extname(pathname) || '.jpg';
    } catch {
      fileExtension = '.jpg';
    }

    const fileName = `${sku}${fileExtension}`;

    // Download image
    const response = await fetch(cleanImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${cleanImageUrl}`);
    }
    const buffer = await response.buffer();

    // Upload to S3
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${FOLDER_NAME}/${fileName}`,
      Body: buffer,
      ContentType: response.headers.get('content-type') || 'image/jpeg',
    };

    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  } catch (err: any) {
    console.error(`❌ Image upload failed for ${imageUrl}`, err.message);
    return null;
  }
};

// ✅ Parse CSV into JSON
const parseCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// --------------------- CRUD Controllers ---------------------

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { SKU, ImageURL, ...rest } = req.body;

    const existingProduct = await Product.findOne({ where: { SKU } });
    if (existingProduct) {
      return ResponseHandler.error(res, `Product with SKU ${SKU} already exists`, 400);
    }

    const imageUrl = await uploadImageToS3(ImageURL, SKU);

    const product = await Product.create({
      SKU,
      ImageURL: imageUrl,
      ...rest,
    } as ProductCreationAttributes);

    return ResponseHandler.success(res, product, 201);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error creating product', 500);
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { SKU, ImageURL, ...rest } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return ResponseHandler.error(res, 'Product not found', 404);
    }

    let updatedImageURL = product.ImageURL;
    if (ImageURL) {
      updatedImageURL = await uploadImageToS3(ImageURL, SKU || product.SKU);
    }

    await product.update({
      SKU,
      ImageURL: updatedImageURL,
      ...rest,
    });

    return ResponseHandler.success(res, product);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating product', 500);
  }
};

// Get product by SKU
export const getProductBySKU = async (req: Request, res: Response) => {
  const { sku } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  try {
    const { count, rows } = await Product.findAndCountAll({
      where: { SKU: sku },
      limit: parseInt(limit.toString()),
      offset,
    });

    if (count === 0) {
      return ResponseHandler.error(res, 'Product not found', 404);
    }

    return ResponseHandler.success(res, {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page.toString()),
        pages: Math.ceil(count / parseInt(limit.toString())),
        limit: parseInt(limit.toString()),
      },
    });
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching product', 500);
  }
};

// Get products (pagination + filters)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (status) {
      whereClause.Status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { SKU: { [Op.like]: `%${search}%` } },
        { ProductName: { [Op.like]: `%${search}%` } },
        { ModelNum: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
    });

    return ResponseHandler.success(res, {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page.toString()),
        pages: Math.ceil(count / parseInt(limit.toString())),
        limit: parseInt(limit.toString()),
      },
    });
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching products', 500);
  }
};

// Bulk upload from CSV
export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }

    const records = await parseCSV(req.file.path);
    const productsToCreate: ProductCreationAttributes[] = [];

    for (const record of records) {
      const s3Url = record.ImageURL
        ? await uploadImageToS3(record.ImageURL, record.SKU)
        : null;

      const productData: ProductCreationAttributes = {
        ...record,
        ImageURL: s3Url,
        MRP: Number(record.MRP) || 0,
        COST: Number(record.COST) || 0,
        Weight: Number(record.Weight) || 0,
        Length: Number(record.Length) || 0,
        Height: Number(record.Height) || 0,
        Width: Number(record.Width) || 0,
      };

      productsToCreate.push(productData);
    }

    if (productsToCreate.length > 0) {
      await Product.bulkCreate(productsToCreate);
    }

    return ResponseHandler.success(res, 'Products uploaded successfully', 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error uploading products', 500);
  }
};

// Bulk update from CSV
export const bulkUpdateProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }

    const records = await parseCSV(req.file.path);
    const productsToCreate: ProductCreationAttributes[] = [];

    for (const record of records) {
      const existingProduct = await Product.findOne({ where: { SKU: record.SKU } });

      const s3Url = record.ImageURL
        ? await uploadImageToS3(record.ImageURL, record.SKU)
        : existingProduct?.ImageURL || null;

      const productData: ProductCreationAttributes = {
        ...record,
        ImageURL: s3Url,
        MRP: Number(record.MRP) || 0,
        COST: Number(record.COST) || 0,
        Weight: Number(record.Weight) || 0,
        Length: Number(record.Length) || 0,
        Height: Number(record.Height) || 0,
        Width: Number(record.Width) || 0,
      };

      if (existingProduct) {
        await existingProduct.update(productData);
      } else {
        productsToCreate.push(productData);
      }
    }

    if (productsToCreate.length > 0) {
      await Product.bulkCreate(productsToCreate);
    }

    return ResponseHandler.success(res, 'Products updated/created successfully', 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating products', 500);
  }
};
